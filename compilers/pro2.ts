import { execa } from 'execa'
import { cp, glob, mkdir, rm } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import tui from '../lib/tui'
import type { Handler } from '../lib/types'
import { existsInDir, nanoid8, toolkitPrefix } from '../lib/utils'
import { Compiler } from './base'

export class PRO2_Compiler extends Compiler {
    id(): string {
        return 'PRO2'
    }

    name(): string {
        return 'PRO2 Project C++ Compiler'
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
        return '-std=c++17 -D_JUDGE_ -O2 -D_GLIBCXX_DEBUG -DNDEBUG -Wall -Wextra -Wno-sign-compare -Wshadow'
    }

    flags2(): string {
        return '-std=c++17 -D_JUDGE_ -O2 -D_GLIBCXX_DEBUG -DNDEBUG -Wall -Wextra -Wno-sign-compare -Wshadow'
    }

    tool(): string {
        return 'g++'
    }

    extension(): string {
        return 'hh'
    }

    override async compileNormal(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        const exePath = `${sourcePath}.exe`
        const dirPath = join(directory, `${toolkitPrefix()}-PRO2/${nanoid8()}`) // We will work in this directory

        await rm(dirPath, { recursive: true, force: true })
        await mkdir(dirPath, { recursive: true })
        tui.print(`Using working directory ${tui.hyperlink(directory, dirPath)}`)

        // Copy `public` and `private` C++ files over to
        // NOTE(pauek): We _have_ to copy files in "public", then "private"
        for (const sourceDir of ['public', 'private']) {
            const files = await Array.fromAsync(glob(`${sourceDir}/*.{cc,hh}`, { cwd: directory }))
            for (const file of files) {
                const dest = join(dirPath, basename(file))
                await cp(join(directory, file), dest)
            }
        }

        //
        const extension = extname(sourcePath)
        await cp(join(directory, sourcePath), join(dirPath, `program${extension}`))

        const ccFiles = await Array.fromAsync(glob(`*.cc`, { cwd: dirPath }))
        await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: dirPath,
        })`${this.tool()} ${this.flags1().split(' ')} -o ${exePath} ${ccFiles}`

        if (!(await existsInDir(dirPath, exePath))) {
            throw new Error(`Compilation failed for ${sourcePath}`)
        }

        await cp(join(dirPath, exePath), join(directory, exePath))

        return exePath
    }
}
