import { execa } from 'execa'
import { exists, rm } from 'fs/promises'
import { join, resolve, sep } from 'path'
import tui from '../lib/tui'
import type { HandlerInfo } from '../lib/types'
import { readText, toolkitPrefix, writeText } from '../lib/utils'

export type CompilerInfo = {
    compiler_id: string
    name: string
    language: string
    version: string
    flags1: string
    flags2: string
    extension: string
    type: string
    warning: string
}

export abstract class Compiler {
    abstract id(): string

    abstract name(): string

    abstract type(): string

    abstract language(): string

    abstract version(): Promise<string>

    abstract flags1(): string

    abstract flags2(): string

    abstract tool(): string

    abstract extension(): string

    warning(): string {
        return ''
    }

    async available(): Promise<boolean> {
        const version = await this.version()
        return version !== 'not found'
    }

    async info(): Promise<CompilerInfo> {
        return {
            compiler_id: this.id(),
            name: this.name(),
            language: this.language(),
            version: await this.version(),
            flags1: this.flags1(),
            flags2: this.flags2(),
            extension: this.extension(),
            type: this.type(),
            warning: this.warning(),
        }
    }

    public async compileNormal(handler: HandlerInfo, directory: string, sourcePath: string): Promise<string> {
        const exePath = `${sourcePath}.exe`

        await this.rmInDir(directory, exePath)

        tui.command(`${this.tool()} ${this.flags1()} ${sourcePath} -o ${exePath}`)
        await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: directory,
        })`${this.tool()}  ${this.flags1().split(' ')} ${sourcePath} -o ${exePath}`

        return exePath
    }

    public async compileWithMain(handler: HandlerInfo, directory: string, sourcePath: string): Promise<string> {
        const exePath = `${sourcePath}.exe`

        tui.command(`add main.${this.extension()} to ${sourcePath}`)
        await this.concatText(directory, [sourcePath, `main.${this.extension()}`], sourcePath)

        tui.command(`${this.tool()} ${this.flags1()} ${sourcePath} -o ${exePath}`)
        await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: directory,
        })`${this.tool()} ${this.flags1().split(' ')} ${sourcePath} -o ${exePath}`

        return exePath
    }

    // Default implementation of execute for compiled languages
    async execute(
        handler: HandlerInfo,
        directory: string,
        sourcePath: string,
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        const exePath = `${sourcePath}.exe`

        const fullExecutablePath = resolve(join(directory, exePath))
        await this.rmInDir(directory, outputPath)
        const input = await this.getInput(directory, inputPath)

        tui.command(`${fullExecutablePath} < ${inputPath} > ${outputPath}`)

        const { exitCode } = await execa({
            reject: false,
            input,
            stdout: { file: join(directory, outputPath) },
            stderr: 'inherit',
            cwd: directory,
        })`${fullExecutablePath}`

        if (exitCode !== 0) {
            throw new Error(`Execution failed for ${exePath} with exit code ${exitCode}`)
        }
    }

    protected async getVersion(cmd: string, lineIndex: number): Promise<string> {
        try {
            const { stdout } = await execa`${cmd.split(' ')}`
            const lines = stdout.split('\n')
            return lines[lineIndex]?.trim() || 'Unknown version'
        } catch {
            return 'not found'
        }
    }

    getInput(directory: string, inputPath: string): Promise<string> {
        return readText(join(directory, inputPath))
    }

    rmInDir(directory: string, path: string): Promise<void> {
        return rm(join(directory, path), { force: true })
    }

    existsInDir(directory: string, path: string): Promise<boolean> {
        return exists(join(directory, path))
    }

    async concatText(
        directory: string,
        inputPaths: string[],
        outputPath: string,
        separator: string = '\n\n\n',
    ): Promise<void> {
        let content = ''
        for (const inputPath of inputPaths) {
            content += (await readText(join(directory, inputPath))) + separator
        }
        await writeText(join(directory, outputPath), content)
    }
}
