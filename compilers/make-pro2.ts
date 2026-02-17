import { execa } from 'execa'
import { cp, glob, mkdir, rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import tui from '../lib/tui'
import type { Handler } from '../lib/types'
import { existsInDir, nanoid8, toolkitPrefix } from '../lib/utils'
import { Compiler } from './base'

export class MakePRO2_Compiler extends Compiler {
    id(): string {
        return 'MakePRO2'
    }

    name(): string {
        return 'PRO2 Makefile C++ Compiler'
    }

    type(): string {
        return 'compiler'
    }

    language(): string {
        return 'C++'
    }

    async version(): Promise<string> {
        return await this.getVersion('g++ --version', 0)
    }

    flags1(): string {
        return ''
    }

    flags2(): string {
        return ''
    }

    tool(): string {
        return 'make'
    }

    extension(): string {
        return 'tar'
    }

    override async compileNormal(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        const exePath = `${sourcePath}.exe`
        const dirPath = `${toolkitPrefix()}-MakePRO2/${nanoid8()}` // We will work in this directory

        await rm(dirPath, { recursive: true, force: true })
        await mkdir(dirPath, { recursive: true })
        tui.print(`Using working directory ${tui.hyperlink(directory, dirPath)}`)

        // Copy `public`, `private`, and `solution` C++ files over
        // NOTE(pauek): We _have_ to copy files in "public", then "private", then "solution"
        for (const dir of ['public', 'private', 'solution']) {
            const ccfiles = await Array.fromAsync(glob(`${dir}/*.{cc,hh}`, { cwd: directory }))
            for (const file of ccfiles) {
                const dest = join(dirPath, basename(file))
                await cp(join(directory, file), dest)
            }
            if (await existsInDir(join(directory, dir), `Makefile`)) {
                const dest = join(dirPath, `Makefile`)
                await cp(join(directory, dir, `Makefile`), dest)
            }
        }

        // If no solution/ directory, extract from tar
        if (!(await existsInDir(directory, 'solution'))) {
            await execa({ cwd: dirPath })`tar xf ${join(directory, sourcePath)}`
        }

        const ccFiles = await Array.fromAsync(glob(`*.cc`, { cwd: dirPath }))
        await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: dirPath,
        })`${this.tool()}`

        if (!(await existsInDir(dirPath, `program.exe`))) {
            throw new Error(`"program.exe" not found after calling 'make'`)
        }
        await cp(join(dirPath, `program.exe`), join(directory, exePath))

        return exePath
    }
}
