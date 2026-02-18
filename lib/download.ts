import AdmZip from 'adm-zip'
import { cp, exists, mkdir, readdir, rm, stat } from 'fs/promises'
import open from 'open'
import { join } from 'path'
import tree from 'tree-node-cli'
import { getLoggedInJutgeClient } from './login'
import tui from './tui'
import { isDirectory } from './utils'

/**
 * Download a problem from Jutge.org and extract it to the given directory.
 * If the zip has a single root folder, its contents are moved to the target directory.
 */
export async function downloadProblem(problem_nm: string, directory: string): Promise<void> {
    const jutge = await getLoggedInJutgeClient()
    await tui.section(`Downloading problem ${problem_nm} from Jutge.org`, async () => {
        const download = await jutge.instructor.problems.download(problem_nm)
        await extractZipToDirectory(download.data, directory)
        const treeFiles = tree(directory, { allFiles: true, dirsFirst: false })
        tui.print(treeFiles)
        tui.success(`Problem downloaded to ${tui.hyperlink(directory)}`)
        await open(directory)
    })
}

async function extractZipToDirectory(zipData: Uint8Array, directory: string): Promise<void> {
    if (await exists(directory)) {
        throw new Error(`Directory ${directory} already exists`)
    }

    await mkdir(directory, { recursive: true })

    const zip = new AdmZip(Buffer.from(zipData))
    zip.extractAllTo(directory, true)

    // If the zip had a single root folder, flatten so contents sit directly in directory
    const entries = await readdir(directory)
    if (entries.length === 1) {
        const solePath = join(directory, entries[0]!)
        if (await isDirectory(solePath)) {
            await flattenSingleSubdir(directory, solePath)
        }
    }
}

async function flattenSingleSubdir(parentDir: string, subdirPath: string): Promise<void> {
    const entries = await readdir(subdirPath)
    for (const name of entries) {
        const src = join(subdirPath, name)
        const dest = join(parentDir, name)
        const st = await stat(src)
        if (st.isDirectory()) {
            await cp(src, dest, { recursive: true })
        } else {
            await cp(src, dest)
        }
    }
    await rm(subdirPath, { recursive: true })
}
