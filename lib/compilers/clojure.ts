import tui from '../tui'
import { type Handler } from '../types'
import { Compiler } from './base'
import { execa } from 'execa'
import { join } from 'path'
import { nothing, readText, toolkitPrefix } from '../utils'
import { rm } from 'fs/promises'

export class Clojure_Compiler extends Compiler {
    id(): string {
        return 'Clojure'
    }

    name(): string {
        return 'Clojure'
    }

    type(): string {
        return 'vm'
    }

    language(): string {
        return 'Clojure'
    }

    async version(): Promise<string> {
        return await this.getVersion('clj --version', 0)
    }

    flags1(): string {
        return ''
    }

    flags2(): string {
        return ''
    }

    tool(): string {
        return 'clj'
    }

    extension(): string {
        return 'clj'
    }

    override async compileNormal(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        await nothing()
        return sourcePath
    }

    override async compileWithMain(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        tui.command(`add main.${this.extension()} to ${sourcePath}`)
        await this.concatText(directory, [sourcePath, `main.${this.extension()}`], sourcePath)

        tui.warning(`No compilation available for Clojure`)

        return sourcePath
    }

    override async execute(
        handler: Handler,
        directory: string,
        sourcePath: string,
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        const exePath = `${toolkitPrefix()}-${sourcePath}`

        await this.rmInDir(directory, outputPath)
        const input = await this.getInput(directory, inputPath)

        tui.command(`clj -M ${sourcePath} < ${inputPath} > ${outputPath}`)

        const { exitCode } = await execa({
            reject: false,
            input,
            stdout: { file: join(directory, outputPath) },
            stderr: 'inherit',
            cwd: directory,
        })`clj -M ${sourcePath}`

        if (exitCode !== 0) throw new Error(`Execution failed for ${sourcePath}`)
    }
}
