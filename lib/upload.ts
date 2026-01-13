import { input, password as input_password } from '@inquirer/prompts'
import archiver from 'archiver'
import { createWriteStream } from 'fs'
import { exists, glob, mkdir } from 'fs/promises'
import { basename, join, normalize } from 'path'
import YAML from 'yaml'
import { findRealDirectories } from '../lib/helpers'
import { newProblem } from '../lib/problem'
import { JutgeApiClient } from './jutge_api_client'
import type { Problem } from './problem'
import { settings } from './settings'
import tui from './tui'
import { ProblemInfo } from './types'
import { createFileFromPath, nanoid12, nanoid8, readJsonInDir, toolkitPrefix, writeYamlInDir } from './utils'
import extract from 'extract-zip'

export async function uploadProblemInDirectory(directory: string): Promise<void> {
    const zipFiles: string[] = []
    const problems: Problem[] = []

    for (const realDirectory of await findRealDirectories([directory])) {
        const problem = await newProblem(realDirectory)
        problems.push(problem)
        const zipFile = await zippingProblem(problem)
        zipFiles.push(zipFile)
    }

    if (problems.length === 0) {
        throw new Error(`No problem found in directory ${directory}`)
    }

    if (problems.length >= 1 && problems[0]!.structure === 'single') {
        // single case
        const problem = problems[0]
        const rootDir = normalize(join(problems[0]!.directory, '..'))
        // extract each zip into its language subdirectory
        const zipDir = join(rootDir, toolkitPrefix() + '-zip', nanoid8())
        await mkdir(zipDir, { recursive: true })
        for (let i = 0; i < problems.length; i++) {
            const zipFile = zipFiles[i]!
            const problem = problems[i]!
            await extract(zipFile, { dir: join(zipDir, problem.language!) })
        }
        // archive the rootDir
        const zipFilePath = join(zipDir, `${basename(rootDir)}.zip`)
        const output = createWriteStream(zipFilePath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        // Wrap the completion in a Promise
        const zipPromise = new Promise<void>((resolve, reject) => {
            output.on('close', function () {
                // console.log(`Archive created: ${archive.pointer()} total bytes`)
                resolve() // ← Resolve when done
            })

            output.on('error', reject) // ← Handle output stream errors
            archive.on('error', reject) // ← Handle archive errors
            archive.on('warning', function (err) {
                if (err.code === 'ENOENT') {
                    console.warn(err)
                } else {
                    reject(err)
                }
            })
        })

        // Pipe archive data to the file
        archive.pipe(output)

        for (const problem of problems) {
            const directory = join(zipDir, problem.language!)

            const files = glob('*/*', { cwd: directory })
            const list = await Array.fromAsync(files)
            for (const file of list) {
                archive.file(join(directory, file), { name: join(problem.language!, basename(file)) })
            }
        }

        // Finalize the archive (this does not end immediately, thus the Promise)
        await archive.finalize()
        await zipPromise // ← Wait for the file to actually be written

        let info = null
        if (await exists(join(rootDir, 'problem.yml'))) {
            info = ProblemInfo.parse(readJsonInDir(rootDir, 'problem.yml'))
            info = await updateProblemInJutgeOrg(rootDir, info, zipFilePath)
        } else {
            info = await createProblemInJutgeOrg(rootDir, zipFilePath)
        }
        tui.print(YAML.stringify(info, null, 4).trim())
        tui.url(`https://jutge.org/problems/${info.problem_nm}`)
        for (const language of problems[0]!.languages) {
            tui.url(`https://jutge.org/problems/${info.problem_nm}_${language}`)
        }
    } else {
        // multi case
        const zipFilePath = zipFiles[0]!
        let info = problems[0]!.problemYml
        if (info) {
            info = await updateProblemInJutgeOrg(directory, info, zipFilePath)
        } else {
            info = await createProblemInJutgeOrg(directory, zipFilePath)
        }
        tui.print(YAML.stringify(info, null, 4).trim())
        tui.url(`https://jutge.org/problems/${info.problem_nm}`)
        for (const language of problems[0]!.languages) {
            tui.url(`https://jutge.org/problems/${info.problem_nm}_${language}`)
        }
    }
}

async function zippingProblem(problem: Problem): Promise<string> {
    const directory = problem.directory
    return await tui.section('Ziping problem', async () => {
        await tui.section('Checking .inp/.cor files', async () => {
            // TODO: check that each .inp has a corresponding .cor file
            // TODO: check that date of .cor is not before .inp nor before solution/main files
            const inps = await Array.fromAsync(glob('*.inp', { cwd: directory }))
            const cors = await Array.fromAsync(glob('*.cor', { cwd: directory }))
            if (inps.length !== cors.length) {
                throw new Error(
                    `Number of .inp files (${inps.length}) does not match number of .cor files (${cors.length})`,
                )
            }
            tui.success(`Looks good`)
        })

        const tmpDir = join(directory, toolkitPrefix() + '-zip', nanoid8())
        const base = basename(process.cwd())
        const zipFilePath = join(tmpDir, `${base}.zip`)
        await mkdir(tmpDir, { recursive: true })

        await tui.section('Creating zip file', async () => {
            tui.directory(tmpDir)
            await createZipFile(directory, zipFilePath, base)
            tui.success(`Created zip file ${base}.zip at ${tui.hyperlink(tmpDir)}`)
        })

        return zipFilePath
    })
}

async function createProblemInJutgeOrg(directory: string, zipFilePath: string): Promise<ProblemInfo> {
    return await tui.section('Creating problem in Jutge.org', async () => {
        const info = {
            problem_nm: '',
            passcode: nanoid12(),
            created_at: '',
            updated_at: '',
        }
        const jutge = new JutgeApiClient()

        await tui.section('Loging in into Jutge.org', async () => {
            await login(jutge)
        })

        await tui.section('Creating problem in Jutge.org', async () => {
            const file = await createFileFromPath(zipFilePath, 'application/zip')
            const { id } = await jutge.instructor.problems.legacyCreateWithTerminal(info.passcode, file)
            const problem_nm = await showTerminalOutput(id)
            if (!problem_nm) throw new Error('Failed to get problem name')
            info.problem_nm = problem_nm
            info.created_at = new Date().toISOString()
            info.updated_at = new Date().toISOString()
        })

        await tui.section('Creating problem.yml', async () => {
            await writeYamlInDir(directory, 'problem.yml', info)
            tui.success(`Created problem.yml`)
        })

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

        await tui.section('Loging in into Jutge.org', async () => {
            await login(jutge)
        })

        await tui.section('Updating problem in Jutge.org', async () => {
            const file = await createFileFromPath(zipFilePath, 'application/zip')
            const { id } = await jutge.instructor.problems.legacyUpdateWithTerminal(info.problem_nm, file)
            await showTerminalOutput(id)
            info.updated_at = new Date().toISOString()
        })

        await tui.section('Updating problem.yml', async () => {
            await writeYamlInDir(directory, 'problem.yml', info)
            tui.success(`Updated problem.yml`)
        })

        tui.print('')
        tui.success(`Problem ${info.problem_nm} updated successfully`)

        return info
    })
}

async function createZipFile(directory: string, zipFilePath: string, base: string) {
    const output = createWriteStream(zipFilePath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    // Wrap the completion in a Promise
    const zipPromise = new Promise<void>((resolve, reject) => {
        output.on('close', function () {
            // console.log(`Archive created: ${archive.pointer()} total bytes`)
            resolve() // ← Resolve when done
        })

        output.on('error', reject) // ← Handle output stream errors
        archive.on('error', reject) // ← Handle archive errors
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                console.warn(err)
            } else {
                reject(err)
            }
        })
    })

    // Pipe archive data to the file
    archive.pipe(output)

    const add = async (pattern: string) => {
        const files = glob(pattern, { cwd: directory })
        const list = await Array.fromAsync(files)
        const sortedList = list.sort()
        for (const file of sortedList) {
            if (file.endsWith('.exe')) continue // skip executables
            if (file.endsWith('.o')) continue // skip object files
            if (file.endsWith('.hi')) continue // skip Haskell interface files
            if (file.endsWith('~')) continue // skip backup files
            tui.print(`  add ${file}`)
            archive.file(join(directory, file), { name: join(base, file) })
        }
    }

    // Add files according to Jutge.org problem structure
    await add('README.{md,txt}')
    await add('problem.yml')
    await add('handler.yml')
    await add('problem.[a-z][a-z].{yml,tex}')
    await add('solution.*')
    await add('main.*')
    await add('*.{inp,cor}')
    await add('award.{html,png}')
    await add('*.png')

    // Finalize the archive (this does not end immediately, thus the Promise)
    await archive.finalize()
    await zipPromise // ← Wait for the file to actually be written
}

// returns the found problem_nm
async function showTerminalOutput(id: string): Promise<string | null> {
    let problem_nm: string | undefined = undefined

    const jutge = new JutgeApiClient()

    const response = await fetch(`${jutge.JUTGE_API_URL}/webstreams/${id}`)
    if (response.body === null) return null

    const reader = response.body.getReader()
    while (true) {
        const { done, value } = await reader.read()
        if (done) return problem_nm || null
        const text = new TextDecoder().decode(value as Uint8Array)
        tui.print(text)
        const matchCreated = text.match(/Problem ([A-Z]\d{5}) created./)
        if (matchCreated) problem_nm = matchCreated[1]
        const matchUpdated = text.match(/Problem ([A-Z]\d{5}) updated./)
        if (matchUpdated) problem_nm = matchUpdated[1]
    }
}

// TODO: improve login mechanism
async function login(jutge: JutgeApiClient): Promise<void> {
    let email = process.env.JUTGE_EMAIL
    let password = process.env.JUTGE_PASSWORD
    if (!email || !password) {
        tui.warning('set JUTGE_EMAIL and JUTGE_PASSWORD environment variables to login without prompt')
        email = await input({ message: 'Jutge.org email:', default: settings.email || '' })
        password = await input_password({ message: 'Jutge.org password:' })
    }
    await jutge.login({ email, password })
}
