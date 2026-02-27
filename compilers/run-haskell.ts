import { execa } from 'execa'
import { join, parse } from 'path'
import tui from '../lib/tui'
import type { Handler } from '../lib/types'
import { nothing, readText, toolkitPrefix, writeText } from '../lib/utils'
import { Compiler } from './base'

export class RunHaskell_Compiler extends Compiler {
    id(): string {
        return 'RunHaskell'
    }

    name(): string {
        return 'RunHaskell'
    }

    type(): string {
        return 'interpreter'
    }

    language(): string {
        return 'Haskell'
    }

    async version(): Promise<string> {
        return await this.getVersion('runhaskell --version', 0)
    }

    flags1(): string {
        // we disable some warnings for backward compatibility with old Haskell code
        return '-Wno-empty-enumerations -Wno-tabs -Wno-x-partial'
    }

    flags2(): string {
        return ''
    }

    tool(): string {
        return 'ghc'
    }

    extension(): string {
        return 'hs'
    }

    override async compileNormal(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        // ghci -e ':q' solution.hs
        // This will load and typecheck the file, then immediately quit.
        // If there are compilation errors, they'll be shown. If it loads successfully and just exits, the code compiles.
        // With execa, it seems we have to remove the quotes around :q

        tui.command(`ghci -e ':q' ${this.flags1()} ${sourcePath}`)

        const { exitCode } = await execa({
            reject: false,
            stderr: 'inherit',
            stdout: 'inherit',
            cwd: directory,
        })`ghci -e :q ${this.flags1().split(' ')} ${sourcePath}`

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
        const newSourcePath = `${toolkitPrefix()}-${parse(sourcePath).name}-${parse(inputPath).name}.hs`

        tui.command(`merge ${sourcePath} ${inputPath} > ${newSourcePath}`)
        await this.mergeScripts(directory, sourcePath, inputPath, newSourcePath)

        tui.command(`runhaskell ${this.flags1()} ${newSourcePath} > ${outputPath}`)
        const { exitCode } = await execa({
            reject: false,
            stdout: { file: join(directory, outputPath) },
            stderr: 'inherit',
            cwd: directory,
        })`runhaskell ${this.flags1().split(' ')} ${newSourcePath}`

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
        mergedScript += '\n\n\nmain = do\n'
        for (const line of script2.trim().split('\n')) {
            if (line.trim() === '') {
                mergedScript += '    print ()\n' // The "()" is because the drive does so
            } else if (line.startsWith('let')) {
                mergedScript += `    ${line}\n`
            } else {
                mergedScript += `    print $ ${line}\n`
            }
        }
        await writeText(join(directory, outputScriptPath), mergedScript)
    }
}
