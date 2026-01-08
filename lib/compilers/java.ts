import { execa } from 'execa'
import { join, parse } from 'path'
import tui from '../tui'
import type { Handler } from '../types'
import { nothing, toolkitPrefix } from '../utils'
import { Compiler } from './base'

export class Java_Compiler extends Compiler {
    id(): string {
        return 'Java'
    }

    name(): string {
        return 'Java'
    }

    type(): string {
        return 'vm'
    }

    language(): string {
        return 'Java'
    }

    async version(): Promise<string> {
        return await this.getVersion('javac --version', 0)
    }

    flags1(): string {
        return ''
    }

    flags2(): string {
        return ''
    }

    tool(): string {
        return 'javac'
    }

    extension(): string {
        return 'java'
    }

    override async compileNormal(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        const classPath = 'Main.class'

        await this.rmInDir(directory, classPath)

        tui.command(`${this.tool()} ${sourcePath}`)
        await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: directory,
        })`${this.tool()} ${sourcePath}`

        return classPath
    }

    override async compileWithMain(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        const classPath = 'Main.class'

        tui.command(`add main.${this.extension()} to ${sourcePath}`)
        await this.concatText(directory, [`main.${this.extension()}`, sourcePath], sourcePath)

        await this.rmInDir(directory, classPath)

        tui.command(`${this.tool()} ${sourcePath}`)
        await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: directory,
        })`${this.tool()} ${sourcePath}`

        return classPath
    }

    override async execute(
        handler: Handler,
        directory: string,
        sourcePath: string,
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        const className = 'Main'
        const classPath = className + '.class'

        await this.rmInDir(directory, outputPath)
        const input = await this.getInput(directory, inputPath)

        tui.command(`java ${className} < ${inputPath} > ${outputPath}`)

        const { exitCode } = await execa({
            reject: false,
            input,
            stdout: { file: join(directory, outputPath) },
            stderr: 'inherit',
            cwd: directory,
        })`java ${className}`

        if (exitCode !== 0) throw new Error(`Execution failed for ${classPath}`)
    }
}
