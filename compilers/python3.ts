import { execa } from 'execa'
import { join } from 'path'
import tui from '../lib/tui'
import type { HandlerInfo } from '../lib/types'
import { readText, toolkitPrefix, writeText } from '../lib/utils'
import { Compiler } from './base'

export class Python3_Compiler extends Compiler {
    id(): string {
        return 'Python3'
    }

    name(): string {
        return 'Python3'
    }

    type(): string {
        return 'interpreter'
    }

    language(): string {
        return 'Python'
    }

    async version(): Promise<string> {
        return await this.getVersion('python3 --version', 0)
    }

    flags1(): string {
        return ''
    }

    flags2(): string {
        return ''
    }

    tool(): string {
        return 'python3'
    }

    extension(): string {
        return 'py'
    }

    override async compileNormal(handler: HandlerInfo, directory: string, sourcePath: string): Promise<string> {
        const source = await readText(join(directory, sourcePath))

        tui.command(`tweak ${sourcePath} for turtle compatibility`)
        const modSource = source
            .replace('import turtle', 'import turtle_pil as turtle')
            .replace('from turtle import', 'from turtle_pil import')
        await writeText(join(directory, sourcePath), modSource)

        tui.command(`python3 -m py_compile ${sourcePath}`)
        const { exitCode } = await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: directory,
        })`python3 -m py_compile ${sourcePath}`

        if (exitCode !== 0) {
            throw new Error(`Compilation failed for ${sourcePath}`)
        }

        return sourcePath
    }

    override async compileWithMain(handler: HandlerInfo, directory: string, sourcePath: string): Promise<string> {
        tui.command(`add main.${this.extension()} to ${sourcePath}`)
        await this.concatText(directory, [sourcePath, `main.${this.extension()}`], sourcePath)

        tui.command(`python3 -m py_compile ${sourcePath}`)
        const { exitCode } = await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: directory,
        })`python3 -m py_compile ${sourcePath}`

        if (exitCode !== 0) {
            throw new Error(`Compilation failed for ${sourcePath}`)
        }

        return sourcePath
    }

    override async execute(
        handler: HandlerInfo,
        directory: string,
        sourcePath: string,
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        const exePath = sourcePath

        await this.rmInDir(directory, outputPath)
        const input = await this.getInput(directory, inputPath)

        tui.command(`python3 ${exePath} < ${inputPath} > ${outputPath}`)

        const { exitCode } = await execa({
            reject: false,
            input,
            stdout: { file: join(directory, outputPath) },
            stderr: 'inherit',
            cwd: directory,
        })`python3 ${exePath}`

        if (exitCode !== 0) throw new Error(`Execution failed for ${exePath}`)
    }
}
