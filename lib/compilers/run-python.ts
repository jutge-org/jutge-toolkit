import { execa } from 'execa'
import { cp } from 'fs/promises'
import { join, parse } from 'path'
import tui from '../tui'
import type { Handler } from '../types'
import { nothing, readText, toolkitPrefix, writeText } from '../utils'
import { Compiler } from './base'

export class RunPython_Compiler extends Compiler {
    id(): string {
        return 'RunPython'
    }

    name(): string {
        return 'RunPython'
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

    override async compileNormal(handler: Handler, directory: string, sourcePath: string): Promise<string> {
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

    override async compileWithMain(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        await nothing()
        throw new Error('Method not implemented.')
    }

    override async execute(
        handler: Handler,
        directory: string,
        sourcePath: string,
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        const newSourcePath = `${toolkitPrefix()}-${parse(sourcePath).name}-${parse(inputPath).name}.py`

        tui.command(`merge ${sourcePath} ${inputPath} > ${newSourcePath}`)
        await this.mergeScripts(directory, sourcePath, inputPath, newSourcePath)

        tui.command(`python3 ${newSourcePath} > ${outputPath}`)

        const { exitCode } = await execa({
            reject: false,
            stdout: { file: join(directory, outputPath) },
            stderr: 'inherit',
            cwd: directory,
        })`python3 ${newSourcePath}`

        if (exitCode !== 0) throw new Error(`Execution failed for ${newSourcePath}`)
    }

    async mergeScripts(
        directory: string,
        scriptPath1: string,
        scriptPath2: string,
        outputScriptPath: string,
    ): Promise<void> {
        const script1 = await readText(join(directory, scriptPath1))
        const script2 = await readText(join(directory, scriptPath2))
        const mergedScript = script1 + '\n\n\n' + script2
        await writeText(join(directory, outputScriptPath), mergedScript)
    }
}
