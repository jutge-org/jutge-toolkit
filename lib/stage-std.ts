import { execa } from 'execa'
import { cp, exists, glob, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { proglangExtensions, proglangNames } from './data'
import { probeCodeMetrics } from './doctor'
import type { StagingContext } from './stage-base'
import tui from './tui'
import { writeText } from './utils'
import { createZipFromFiles, type FileToArchive } from './zip-creation'

const proglangExtensionKeys = Object.keys(proglangNames)

export async function prepareStatements_Std(context: StagingContext, language: string, workDirLang: string) {
    await tui.section('Preparing standard statements', async () => {
        const dir = join(context.workDir, language)

        tui.command(`jtk make pdf html md txt --problem_nm ${context.problem_nm}`)
        await execa({
            cwd: dir,
            stdout: 'inherit',
            stderr: 'inherit',
        })`jtk make pdf html md txt --problem_nm ${context.problem_nm}`

        await rm(join(dir, 'jtk-pdf'), { recursive: true, force: true })
        await rm(join(dir, 'jtk-text'), { recursive: true, force: true })

        tui.success('Generated statements')
    })
}

export async function findGoldenSolution(
    context: StagingContext,
    language: string,
    workDirLang: string,
    directory: string,
) {
    return await tui.section('Finding golden solution', async () => {
        const handler = context.handlers[language].handler
        const compilers = context.handlers[language].compilers || '' // this is only one string!

        let goldenSolution: string

        if (handler === 'circuits') {
            goldenSolution = 'solution.v'
        } else if (compilers === 'RunPython') {
            goldenSolution = 'solution.py'
        } else if (compilers === 'RunHaskell' || compilers === 'GHC') {
            goldenSolution = 'solution.hs'
        } else if (compilers === 'RunClojure' || compilers === 'Clojure') {
            goldenSolution = 'solution.clj'
        } else {
            let solutionProglang = context.handlers[language].solution || 'C++'

            // if there is a single solution file with an extension, use that to set the solution language
            if (solutionProglang === 'C++') {
                const files = await Array.fromAsync(glob('solution.*', { cwd: directory }))
                console.log(files)
                if (files.length === 1) {
                    const ext = files[0]!.split('.').pop()
                    solutionProglang = proglangNames[ext!]
                }
            }

            const extension = proglangExtensions[solutionProglang]
            if (!extension) {
                throw new Error(`Unknown programming language ${solutionProglang} for solution`)
            }
            const goldenSolutionPath = join(context.workDir, language, `solution.${extension}`)
            const fileExists = await exists(goldenSolutionPath)
            if (!fileExists) {
                throw new Error(`Golden solution file ${goldenSolutionPath} not found`)
            }
            goldenSolution = `solution.${extension}`
        }

        tui.success(`Golden solution: ${goldenSolution}`)
        return goldenSolution
    })
}

export async function computeCodeMetrics(
    context: StagingContext,
    language: string,
    workDirLang: string,
    stagingDirLang: string,
    directory: string,
) {
    if (!(await probeCodeMetrics())) {
        tui.warning('jutge-code-metrics not installed, skipping code metrics')
        return
    }

    await tui.section('Computing code metrics', async () => {
        const golden_solution = await findGoldenSolution(context, language, workDirLang, directory)
        tui.command(`jutge-code-metrics ${golden_solution}`)
        try {
            const { stdout } = await execa({ cwd: workDirLang })`jutge-code-metrics ${golden_solution}`
            await writeText(join(stagingDirLang, `code-metrics.json`), stdout)
            tui.success(`Generated ${tui.hyperlink(stagingDirLang, `code-metrics.json`)}`)
        } catch (error) {
            tui.warning('Failed to compute code metrics')
        }
    })
}

export async function stageProblemFiles_Std(
    context: StagingContext,
    language: string,
    workDirLang: string,
    stagingDirLang: string,
    problem_id: string,
) {
    const accept = (filename: string) => {
        // general
        if (filename === 'handler.yml') return true
        for (const ext of ['inp', 'cor', 'ops']) {
            if (filename.endsWith(`.${ext}`)) return true
        }
        for (const extension of proglangExtensionKeys) {
            if (filename === `solution.${extension}`) return true
            if (filename === `main.${extension}`) return true
        }
        if (filename === 'scores.yml') return true

        // checkers
        if (filename === 'checker.py') return true
        if (filename === 'checker.cc') return true

        // MakePRO2 (TODO: check with pauek)
        if (filename === 'private.tar') return true
        if (filename === 'public.tar') return true

        return false
    }

    const dst = join(stagingDirLang, `problem.pbm`)
    await mkdir(dst, { recursive: true })
    const files = await Array.fromAsync(glob('*', { cwd: workDirLang }))
    let count = 0
    for (const file of files) {
        if (accept(file)) {
            await cp(join(workDirLang, file), join(dst, file))
            count++
        }
    }
    tui.success(`Staged ${count} files to ${tui.hyperlink(stagingDirLang, `problem.pbm`)}`)
}

export async function stageZip_Std(
    context: StagingContext,
    language: string,
    workDirLang: string,
    stagingDirLang: string,
    problem_id: string,
) {
    const accept = (filename: string) => {
        // general
        for (const extension of ['pdf', 'html', 'md', 'txt']) {
            if (filename === `problem.${language}.${extension}`) return true
        }
        for (const extension of proglangExtensionKeys) {
            if (filename === `main.${extension}`) return true
            if (filename === `code.${extension}`) return true
        }
        if (/^(sample|public).*\.(inp|cor)$/.test(filename)) return true

        return false
    }

    const filesToZip: FileToArchive[] = []
    const files = await Array.fromAsync(glob('*', { cwd: workDirLang }))
    for (const file of files) {
        if (accept(file)) {
            filesToZip.push({
                sourcePath: join(workDirLang, file),
                archivePath: join(`${problem_id}`, file),
            })
        }
    }

    await createZipFromFiles(filesToZip, join(stagingDirLang, `problem.zip`))
    tui.success(`Created ${tui.hyperlink(stagingDirLang, `problem.zip`)} with ${filesToZip.length} files`)
}
