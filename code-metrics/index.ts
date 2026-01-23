#!/usr/bin/env bun

import { program } from '@commander-js/extra-typings'
import { exists } from 'fs/promises'
import { packageJson } from '../lib/versions'

async function computeCodeMetrics(program: string): Promise<any> {
    if (!(await exists(program))) {
        throw new Error(`Program file ${program} not found`)
    }
    return {
        warning: 'not implemented yet, returning dummy values',
        linesOfCode: 42,
        cyclomaticComplexity: 7,
        maintainabilityIndex: 85,
    }
}

// main

program.name('code-metrics')
program.version(packageJson.version)
program.description('Provides measures extracted from a static inspection of the submitted code.')
program.helpCommand('help [command]', 'Display help for command') // To get the message with uppercase :-)
program.addHelpText('after', '\nMore documentation:\n  https://github.com/jutge-org/new-jutge-toolkit/tree/main/docs')

program
    .argument('program', 'Program file to analyze')

    .action(async (program: string) => {
        const metrics = await computeCodeMetrics(program)
        console.log(JSON.stringify(metrics, null, 4))
    })

try {
    await program.parseAsync()
    process.exit(0)
} catch (error) {
    console.error(error)
    process.exit(1)
}
