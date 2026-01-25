import { execa } from 'execa'
import { join } from 'path'
import tui from '../lib/tui'
import type { Handler } from '../lib/types'
import { nothing, readText, toolkitPrefix, writeText } from '../lib/utils'
import { Compiler } from './base'

export class R_Compiler extends Compiler {
    id(): string {
        return 'R'
    }

    name(): string {
        return 'R'
    }

    type(): string {
        return 'interpreter'
    }

    language(): string {
        return 'R'
    }

    async version(): Promise<string> {
        return await this.getVersion('R --version', 0)
    }

    flags1(): string {
        return ''
    }

    flags2(): string {
        return ''
    }

    tool(): string {
        return 'R'
    }

    extension(): string {
        return 'R'
    }

    override async compileNormal(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        await nothing()

        tui.warning(`No compilation available for R`)

        return sourcePath
    }

    override async compileWithMain(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        await nothing()

        tui.warning(`No compilation available for R`)

        return sourcePath
    }

    override async execute(
        handler: Handler,
        directory: string,
        sourcePath: string,
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        const exePath = sourcePath

        await this.rmInDir(directory, outputPath)
        const input = await this.getInput(directory, inputPath)

        tui.command(`Rscript ${exePath} < ${inputPath} > ${outputPath}`)

        const { exitCode } = await execa({
            reject: false,
            input,
            stdout: { file: join(directory, outputPath) },
            stderr: 'inherit',
            cwd: directory,
        })`Rscript ${exePath}`

        if (exitCode !== 0) throw new Error(`Execution failed for ${exePath}`)
    }
}
