import archiver from 'archiver'
import { createWriteStream } from 'fs'

export interface ZipOptions {
    directory: string
    zipFilePath: string
    base: string
    patterns?: string[]
}

export interface FileToArchive {
    sourcePath: string
    archivePath: string
}

export async function createZipFromFiles(files: FileToArchive[], zipFilePath: string): Promise<void> {
    const output = createWriteStream(zipFilePath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    const zipPromise = new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve())
        output.on('error', reject)
        archive.on('error', reject)
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn(err)
            } else {
                reject(err)
            }
        })
    })

    archive.pipe(output)

    for (const file of files) {
        archive.file(file.sourcePath, { name: file.archivePath })
    }

    await archive.finalize()
    await zipPromise
}
