import chalk from 'chalk'
import { exists } from 'fs/promises'
import open from 'open'
import { basename, join, resolve } from 'path'
import { sleep } from 'radash'
import { getCompilerByExtension } from '../compilers'
import type { Submission, Verdict } from './jutge_api_client'
import { getLoggedInJutgeClient } from './login'
import tui from './tui'
import { ProblemInfo } from './types'
import { createFileFromPath, readYaml } from './utils'

function colorizeVerdict(verdict: string): string {
    if (verdict === 'Pending') return chalk.gray(verdict)
    if (verdict === 'AC') return chalk.green(verdict)
    if (verdict === 'PE') return chalk.yellow(verdict)
    return chalk.red(verdict)
}

function showVerdict(allVerdicts: Record<string, Verdict>, verdict: string): string {
    const verdictInfo = allVerdicts[verdict]
    if (!verdictInfo) return verdict
    const colorized = colorizeVerdict(verdict)
    const emoji = verdictInfo.emoji || ''
    return `${emoji} ${colorized} ${verdictInfo.name}`
}

async function ensureProblemYml(dir: string): Promise<ProblemInfo> {
    const ymlPath = join(dir, 'problem.yml')
    if (!(await exists(ymlPath))) {
        throw new Error('No problem.yml in directory. Upload the problem first with: jtk upload -d <directory>')
    }
    const data = await readYaml(ymlPath)
    return ProblemInfo.parse(data)
}

function getExtension(filename: string): string {
    const ext = filename.split('.').pop()
    if (!ext) throw new Error(`File has no extension: ${filename}`)
    return ext
}

function isSubmissionPending(submission: Submission): boolean {
    return submission.veredict === 'Pending'
}

type SubmissionEntry = { sourceFile: string; submission_id: string }

async function verifyProblemOnJutge(
    jutge: Awaited<ReturnType<typeof getLoggedInJutgeClient>>,
    problem_id: string,
    info: ProblemInfo,
    directory: string,
): Promise<void> {
    await tui.section(`Checking for ${problem_id} on Jutge.org`, async () => {
        const profile = await jutge.student.profile.get()
        if (profile.email !== info.email) {
            throw new Error(
                `The jutge user ${profile.email} is not the same as the one in the problem.yml ${info.email}`,
            )
        }
        tui.success(`Problem owner verified`)

        try {
            await jutge.problems.getProblem(problem_id)
        } catch {
            throw new Error(
                `Problem ${problem_id} not found on Jutge.org. Upload it first with: jtk upload -d ${directory}`,
            )
        }
        tui.success(`Problem ${problem_id} found`)
    })
}

function compilerIdForJutge(compilerId: string): string {
    return compilerId === 'GXX' ? 'G++17' : compilerId
}

async function submitOneFile(
    jutge: Awaited<ReturnType<typeof getLoggedInJutgeClient>>,
    dir: string,
    problem_id: string,
    sourceFile: string,
    forcedCompilerId: string | null,
    annotation: string,
    openBrowser: boolean,
): Promise<SubmissionEntry> {
    const fullPath = resolve(dir, sourceFile)
    const compiler_id =
        forcedCompilerId ??
        (() => {
            const ext = getExtension(basename(sourceFile))
            const compiler = getCompilerByExtension(ext)
            return compilerIdForJutge(compiler.id())
        })()

    const sourceFileUrl = tui.hyperlink(sourceFile)
    const problem_id_url = tui.weblink(`https://jutge.org/problems/${problem_id}`, problem_id)
    const compiler_id_url = tui.weblink(`https://jutge.org/documentation/compilers/${compiler_id}`, compiler_id)
    let entry: SubmissionEntry
    await tui.section(
        `Submitting ${sourceFileUrl} to problem ${problem_id_url} with compiler ${compiler_id_url} and annotation ${annotation}`,
        async () => {
            const file = await createFileFromPath(fullPath, 'text/plain')
            const out = await jutge.student.submissions.submitFull({ problem_id, compiler_id, annotation }, file)
            entry = { sourceFile, submission_id: out.submission_id }
            const url = `https://jutge.org/problems/${problem_id}/submissions/${out.submission_id}`
            tui.url(url)
            if (openBrowser) await open(url)
        },
    )
    return entry!
}

async function waitForVerdicts(
    jutge: Awaited<ReturnType<typeof getLoggedInJutgeClient>>,
    problem_id: string,
    submissions: SubmissionEntry[],
    annotation: string,
): Promise<void> {
    await tui.section('Waiting for verdicts', async () => {
        const allVerdicts = await jutge.tables.getVerdicts()

        const pending = new Map(submissions.map((s) => [s.submission_id, s]))
        const pollIntervalMs = 1000

        while (pending.size > 0) {
            await sleep(pollIntervalMs)
            for (const [submission_id, entry] of Array.from(pending.entries())) {
                try {
                    const submission = await jutge.student.submissions.get({
                        problem_id,
                        submission_id,
                    })
                    if (!isSubmissionPending(submission)) {
                        pending.delete(submission_id)
                        const verdict = submission.veredict ?? 'Pending'
                        tui.print(entry.sourceFile.padEnd(20) + ' ' + showVerdict(allVerdicts, verdict))
                    }
                } catch {
                    // keep in pending, retry next round
                }
            }
        }
        tui.success('All submissions judged')
    })
}

export async function submitInDirectory(
    directory: string,
    language: string,
    sourceFiles: string[],
    noWait: boolean,
    openBrowser: boolean,
    compilerOption: string = 'auto',
    annotation: string,
): Promise<void> {
    const dir = resolve(directory)
    const info = await ensureProblemYml(dir)
    if (!info.problem_nm) {
        throw new Error('Problem not uploaded to Jutge.org. Upload it first with jtk upload')
    }

    const jutge = await getLoggedInJutgeClient()
    const problem_id = `${info.problem_nm}_${language}`

    let forcedCompilerId: string | null = null
    if (compilerOption !== 'auto') {
        const compilers = await jutge.tables.getCompilers()
        if (!(compilerOption in compilers)) {
            const valid = Object.keys(compilers).sort().join(', ')
            throw new Error(`Unknown compiler '${compilerOption}'. Valid compilers from Jutge.org: ${valid}`)
        }
        forcedCompilerId = compilerOption
    }

    await verifyProblemOnJutge(jutge, problem_id, info, directory)

    const submissions: SubmissionEntry[] = []
    await tui.section('Submitting solutions', async () => {
        for (const sourceFile of sourceFiles) {
            submissions.push(
                await submitOneFile(jutge, dir, problem_id, sourceFile, forcedCompilerId, annotation, openBrowser),
            )
        }
    })

    if (!noWait && submissions.length > 0) {
        await waitForVerdicts(jutge, problem_id, submissions, annotation)
    }
}
