import { execa } from 'execa'
import { join, parse } from 'path'
import tui from '../lib/tui'
import type { HandlerInfo } from '../lib/types'
import { nothing, readText, toolkitPrefix, writeText } from '../lib/utils'
import { Compiler } from './base'

export class RunClojure_Compiler extends Compiler {
    id(): string {
        return 'RunClojure'
    }

    name(): string {
        return 'RunClojure'
    }

    type(): string {
        return 'interpreter'
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

    override async compileNormal(handler: HandlerInfo, directory: string, sourcePath: string): Promise<string> {
        await nothing()

        tui.warning(`No compilation available for Clojure`)

        return sourcePath
    }

    override async compileWithMain(handler: HandlerInfo, directory: string, sourcePath: string): Promise<string> {
        await nothing()
        throw new Error('Method not implemented.')
    }

    override async execute(
        handler: HandlerInfo,
        directory: string,
        sourcePath: string,
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        const newSourcePath = `${toolkitPrefix()}-${parse(sourcePath).name}-${parse(inputPath).name}.clj`

        tui.command(`merge ${sourcePath} ${inputPath} > ${newSourcePath}`)
        await this.mergeScripts(directory, sourcePath, inputPath, newSourcePath)

        tui.command(`clj -M ${newSourcePath} > ${outputPath}`)

        const { exitCode } = await execa({
            reject: false,
            stdout: { file: join(directory, outputPath) },
            stderr: 'inherit',
            cwd: directory,
        })`clj -M ${newSourcePath}`

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
        let mergedScript = script1
        mergedScript += '\n\n\n'
        for (const line of script2.split('\n')) {
            if (line.trim() === '') {
                mergedScript += '\n'
            } else {
                mergedScript += `(println ${line})\n`
            }
        }
        await writeText(join(directory, outputScriptPath), mergedScript)
    }
}
