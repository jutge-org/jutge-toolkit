import { execa } from 'execa'
import { join } from 'path'
import tui from '../lib/tui'
import type { Handler } from '../lib/types'
import { nothing, readText, toolkitPrefix, writeText, writeTextInDir } from '../lib/utils'
import { Compiler } from './base'
import { no } from 'zod/v4/locales'

// This is easy as there is nothing to do!

export class Verilog_Compiler extends Compiler {
    id(): string {
        return 'Verilog'
    }

    name(): string {
        return 'Verilog'
    }

    type(): string {
        return 'formal methods'
    }

    language(): string {
        return 'Verilog'
    }

    async version(): Promise<string> {
        await nothing()
        return 'Verilog Fake Compiler'
    }

    flags1(): string {
        return ''
    }

    flags2(): string {
        return ''
    }

    tool(): string {
        return 'Verilog'
    }

    extension(): string {
        return 'v'
    }

    override async compileNormal(handler: Handler, directory: string, sourcePath: string): Promise<string> {
        const exePath = `${sourcePath}.exe`
        await writeTextInDir(directory, exePath, `echo "This is a fake executable for Verilog source ${sourcePath}"\n`)
        return exePath
    }

    override async execute(
        handler: Handler,
        directory: string,
        sourcePath: string,
        inputPath: string,
        outputPath: string,
    ): Promise<void> {}
}
