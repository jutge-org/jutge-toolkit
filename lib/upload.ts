import { input, password as input_password } from '@inquirer/prompts'
import extract from 'extract-zip'
import { exists, glob, mkdir } from 'fs/promises'
import { basename, join, normalize } from 'path'
import { findRealDirectories } from '../lib/helpers'
import { newProblem } from '../lib/problem'
import { JutgeApiClient } from './jutge_api_client'
import type { Problem } from './problem'
import { settings } from './settings'
import tui from './tui'
import { ProblemInfo } from './types'
import { createFileFromPath, nanoid12, nanoid8, readYaml, toolkitPrefix, writeYamlInDir } from './utils'
import { createZipFromFiles, type FileToArchive } from './zip-creation'

export async function uploadProblemInDirectory(directory: string): Promise<void> {
    const zipFiles: string[] = []
    const problems: Problem[] = []

    for (const realDirectory of await findRealDirectories([directory])) {
        const problem = await newProblem(realDirectory)
        const zipFile = await zippingProblem(problem)
        problems.push(problem)
        zipFiles.push(zipFile)
    }

    if (problems.length === 0) {
        throw new Error(`No problem found in directory ${directory}`)
    }

    const isSingleStructure = problems.length >= 1 && problems[0]!.structure === 'single'

    if (isSingleStructure) {
        await handleSingleStructureUpload(problems, zipFiles)
    } else {
        await handleMultiStructureUpload(problems[0]!.directory, problems[0]!, zipFiles[0]!)
    }
}

async function handleSingleStructureUpload(problems: Problem[], zipFiles: string[]): Promise<void> {
    const problem = problems[0]!
    const rootDir = normalize(join(problem.directory, '..'))
    const zipDir = join(rootDir, toolkitPrefix() + '-zip', nanoid8())

    await mkdir(zipDir, { recursive: true })
    await extractZipsToLanguageDirs(problems, zipFiles, zipDir)

    const zipFilePath = await createMultiLanguageZip(problems, zipDir, rootDir)
    const info = await createOrUpdateProblem(rootDir, zipFilePath)

    displayProblemInfo(info, problem.languages)
}

async function handleMultiStructureUpload(directory: string, problem: Problem, zipFilePath: string): Promise<void> {
    const info = await createOrUpdateProblem(directory, zipFilePath, problem.problemYml)
    displayProblemInfo(info, problem.languages)
}

async function extractZipsToLanguageDirs(problems: Problem[], zipFiles: string[], zipDir: string): Promise<void> {
    for (let i = 0; i < problems.length; i++) {
        const zipFile = zipFiles[i]!
        const problem = problems[i]!
        await extract(zipFile, { dir: join(zipDir, problem.language!) })
    }
}

async function createMultiLanguageZip(problems: Problem[], zipDir: string, rootDir: string): Promise<string> {
    const zipFilePath = join(zipDir, `${basename(rootDir)}.zip`)
    const filesToArchive: FileToArchive[] = []

    for (const problem of problems) {
        const directory = join(zipDir, problem.language!)
        const files = await Array.fromAsync(glob('*/*', { cwd: directory }))

        for (const file of files) {
            filesToArchive.push({
                sourcePath: join(directory, file),
                archivePath: join(basename(rootDir), problem.language!, basename(file)),
            })
        }
    }

    await createZipFromFiles(filesToArchive, zipFilePath)
    return zipFilePath
}

async function createOrUpdateProblem(
    directory: string,
    zipFilePath: string,
    existingInfo?: ProblemInfo | null,
): Promise<ProblemInfo> {
    const ymlPath = join(directory, 'problem.yml')
    if (existingInfo || (await exists(ymlPath))) {
        const info = existingInfo || ProblemInfo.parse(await readYaml(ymlPath))
        return await updateProblemInJutgeOrg(directory, info, zipFilePath)
    } else {
        return await createProblemInJutgeOrg(directory, zipFilePath)
    }
}

function displayProblemInfo(info: ProblemInfo, languages: string[]): void {
    tui.yaml(info)
    tui.url(`https://jutge.org/problems/${info.problem_nm}`)
    for (const language of languages) {
        tui.url(`https://jutge.org/problems/${info.problem_nm}_${language}`)
    }
}

async function zippingProblem(problem: Problem): Promise<string> {
    return await tui.section('Ziping problem', async () => {
        await validateInpCorFiles(problem.directory)

        const tmpDir = join(problem.directory, toolkitPrefix() + '-zip', nanoid8())
        const base = basename(process.cwd())
        const zipFilePath = join(tmpDir, `${base}.zip`)
        await mkdir(tmpDir, { recursive: true })

        await tui.section('Creating zip file', async () => {
            tui.directory(tmpDir)
            await createZipFile(problem.directory, zipFilePath, base)
            tui.success(`Created zip file ${base}.zip at ${tui.hyperlink(tmpDir)}`)
        })

        return zipFilePath
    })
}

async function validateInpCorFiles(directory: string): Promise<void> {
    await tui.section('Checking .inp/.cor files', async () => {
        const inps = await Array.fromAsync(glob('*.inp', { cwd: directory }))
        const cors = await Array.fromAsync(glob('*.cor', { cwd: directory }))

        if (inps.length !== cors.length) {
            throw new Error(
                `Number of .inp files (${inps.length}) does not match number of .cor files (${cors.length})`,
            )
        }
        tui.success(`Looks good`)
    })
}

async function createZipFile(directory: string, zipFilePath: string, base: string): Promise<void> {
    const patterns = [
        'README.{md,txt}',
        'problem.yml',
        'handler.yml',
        'problem.[a-z][a-z].{yml,tex}',
        'solution.*',
        'main.*',
        'code.*',
        'sample.dt',
        '*.{inp,cor}',
        'award.{html,png}',
        '*.{png,jpg,jpeg,gif,svg,pdf,eps}',
    ]
    const exclusions = ['.exe', '.o', '.hi', '~']

    const filesToArchive: FileToArchive[] = []

    for (const pattern of patterns) {
        const files = await Array.fromAsync(glob(pattern, { cwd: directory }))
        const sortedFiles = files.sort()

        for (const file of sortedFiles) {
            if (exclusions.some((ext) => file.endsWith(ext))) continue

            tui.print(`  add ${file}`)
            filesToArchive.push({
                sourcePath: join(directory, file),
                archivePath: join(base, file),
            })
        }
    }

    await createZipFromFiles(filesToArchive, zipFilePath)
}

async function createProblemInJutgeOrg(directory: string, zipFilePath: string): Promise<ProblemInfo> {
    return await tui.section('Creating problem in Jutge.org', async () => {
        const info: ProblemInfo = {
            problem_nm: '',
            passcode: nanoid12(),
            created_at: '',
            updated_at: '',
        }

        const jutge = new JutgeApiClient()
        await loginToJutge(jutge)

        await tui.section('Creating problem in Jutge.org', async () => {
            const file = await createFileFromPath(zipFilePath, 'application/zip')
            const { id } = await jutge.instructor.problems.legacyCreateWithTerminal(info.passcode, file)
            const problem_nm = await showTerminalOutput(id)

            if (!problem_nm) throw new Error('Failed to get problem name')

            info.problem_nm = problem_nm
            info.created_at = new Date().toISOString()
            info.updated_at = new Date().toISOString()
        })

        await saveProblemYml(directory, info, 'Created')
        tui.print('')
        tui.success(`Problem ${info.problem_nm} created successfully`)

        return info
    })
}

async function updateProblemInJutgeOrg(
    directory: string,
    info: ProblemInfo,
    zipFilePath: string,
): Promise<ProblemInfo> {
    return await tui.section('Updating problem in Jutge.org', async () => {
        const jutge = new JutgeApiClient()
        await loginToJutge(jutge)

        await tui.section('Updating problem in Jutge.org', async () => {
            const file = await createFileFromPath(zipFilePath, 'application/zip')
            const { id } = await jutge.instructor.problems.legacyUpdateWithTerminal(info.problem_nm, file)
            await showTerminalOutput(id)
            info.updated_at = new Date().toISOString()
        })

        await saveProblemYml(directory, info, 'Updated')
        tui.print('')
        tui.success(`Problem ${info.problem_nm} updated successfully`)

        return info
    })
}

async function saveProblemYml(directory: string, info: ProblemInfo, action: 'Created' | 'Updated'): Promise<void> {
    await tui.section(`${action === 'Created' ? 'Creating' : 'Updating'} problem.yml`, async () => {
        await writeYamlInDir(directory, 'problem.yml', info)
        tui.success(`${action} problem.yml`)
    })
}

async function loginToJutge(jutge: JutgeApiClient): Promise<void> {
    await tui.section('Loging in into Jutge.org', async () => {
        let email = process.env.JUTGE_EMAIL
        let password = process.env.JUTGE_PASSWORD

        if (!email || !password) {
            tui.warning('set JUTGE_EMAIL and JUTGE_PASSWORD environment variables to login without prompt')
            email = await input({ message: 'Jutge.org email:', default: settings.email || '' })
            password = await input_password({ message: 'Jutge.org password:' })
        }

        await jutge.login({ email, password })
    })
}

async function showTerminalOutput(id: string): Promise<string | null> {
    const jutge = new JutgeApiClient()
    const response = await fetch(`${jutge.JUTGE_API_URL}/webstreams/${id}`)

    if (response.body === null) return null

    let problem_nm: string | undefined = undefined
    const reader = response.body.getReader()

    while (true) {
        const { done, value } = await reader.read()
        if (done) return problem_nm || null

        const text = new TextDecoder().decode(value as Uint8Array)
        tui.print(text)

        const matchCreated = text.match(/Problem ([A-Z]\d{5}) created\./)
        if (matchCreated) problem_nm = matchCreated[1]

        const matchUpdated = text.match(/Problem ([A-Z]\d{5}) updated\./)
        if (matchUpdated) problem_nm = matchUpdated[1]
    }
}
