// TODO: improve the use of the email to ensure the user is the owner of the problem

import { exists, glob, mkdir } from 'fs/promises'
import { basename, join, normalize, resolve, sep } from 'path'
import { JutgeApiClient } from './jutge_api_client'
import { getLoggedInJutgeClient } from './login'
import tui from './tui'
import { ProblemInfo } from './types'
import { createFileFromPath, nanoid12, nanoid8, readYaml, toolkitPrefix, writeYamlInDir } from './utils'
import { createZipFromFiles, type FileToArchive } from './zip-creation'

export async function uploadProblemInDirectory(directory: string): Promise<void> {
    //

    function accept(file: string): boolean {
        const extensionsToExclude = ['.exe', '.o', '.hi', '~', '.bak', '.class', '.pyc', '.pyo']
        const prefixesToExclude = [toolkitPrefix() + '-', '__MACOSX', '.DS_Store', '.', '__pycache__']

        for (const ext of extensionsToExclude) {
            if (file.endsWith(ext)) {
                return false
            }
        }
        const parts = normalize(file).split(sep)
        for (const part of parts) {
            for (const prefix of prefixesToExclude) {
                if (part.startsWith(prefix)) {
                    return false
                }
            }
        }
        return true
    }

    const dir = resolve(directory)
    if (!dir.endsWith('.pbm')) {
        throw new Error(`Directory ${directory} is not a problem directory (missing .pbm suffix)`)
    }

    const zipDir = join(directory, toolkitPrefix() + '-zip', nanoid8())
    const base = basename(dir)
    const zipFilePath = join(zipDir, `${base}.zip`)
    await mkdir(zipDir, { recursive: true })

    await tui.section(`Zipping problem to ${zipFilePath}`, async () => {
        const filesToArchive: FileToArchive[] = []
        const files = await Array.fromAsync(glob('**/*', { cwd: directory }))
        for (const file of files) {
            if (accept(file)) {
                const sourcePath = join(directory, file)
                const archivePath = join(basename(dir), file)
                tui.print(`adding ${archivePath}`)
                filesToArchive.push({ sourcePath, archivePath })
            }
        }
        tui.print('Creating zip file...')
        await createZipFromFiles(filesToArchive, zipFilePath)
    })

    const info = await createOrUpdateProblem(directory, zipFilePath)
    displayProblemInfo(info)
}

async function createOrUpdateProblem(directory: string, zipFilePath: string): Promise<ProblemInfo> {
    const ymlPath = join(directory, 'problem.yml')
    if (await exists(ymlPath)) {
        const info = ProblemInfo.parse(await readYaml(ymlPath))
        return await updateProblemInJutgeOrg(directory, info, zipFilePath)
    } else {
        return await createProblemInJutgeOrg(directory, zipFilePath)
    }
}

function displayProblemInfo(info: ProblemInfo): void {
    tui.yaml(info)
    tui.url(`https://jutge.org/problems/${info.problem_nm}`)
}

async function createProblemInJutgeOrg(directory: string, zipFilePath: string): Promise<ProblemInfo> {
    return await tui.section('Creating problem in Jutge.org', async () => {
        const jutge = await getLoggedInJutgeClient()
        const profile = await jutge.student.profile.get()
        const email = profile.email

        const info: ProblemInfo = {
            problem_nm: '',
            email,
            passcode: nanoid12(),
            created_at: '',
            updated_at: '',
        }

        await tui.section('Creating problem in Jutge.org', async () => {
            const file = await createFileFromPath(zipFilePath, 'application/zip')
            const { id } = await jutge.instructor.problems.create(info.passcode, file)
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
        const jutge = await getLoggedInJutgeClient()

        await tui.section('Updating problem in Jutge.org', async () => {
            const file = await createFileFromPath(zipFilePath, 'application/zip')
            const { id } = await jutge.instructor.problems.update(info.problem_nm, file)
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
        tui.print(text.trim())

        const matchCreated = text.match(/Problem ([A-Z]\d{5}) created\./)
        if (matchCreated) problem_nm = matchCreated[1]

        const matchUpdated = text.match(/Problem ([A-Z]\d{5}) updated\./)
        if (matchUpdated) problem_nm = matchUpdated[1]
    }
}
