import { confirm } from '@inquirer/prompts'
import fs from 'fs/promises'
import path from 'path'
import type { AbstractProblem } from './new-problem'
import tui from './tui'
import { toolkitPrefix } from './utils'

export async function cleanStd(aproblem: AbstractProblem, force: boolean, all: boolean) {
    const filesToClean = new Set<string>()

    await addAllFilesToClean(aproblem, all, filesToClean)

    showFilesToClean(aproblem, filesToClean)

    if (filesToClean.size === 0) {
        return
    }

    if (!force) {
        console.log()
        const confirmation = await confirm({
            message: `Remove ${filesToClean.size} files?`,
            default: false,
        })
        if (!confirmation) return
    }

    await wipeFilesToClean(filesToClean)
}

const PROBLEM_EXTENSIONS = ['ps', 'pdf', 'md', 'txt', 'html', 'short.md', 'short.txt', 'short.html']

function buildProblemPatterns(): string[] {
    return PROBLEM_EXTENSIONS.map((ext) => `^problem\\.[a-z][a-z]\\.${ext.replace('.', '\\.')}$`)
}

const BASE_PATTERNS = [
    `^${toolkitPrefix()}-`,
    '\\.exe$',
    '\\.out$',
    '\\.pyc$',
    '\\.class$',
    '\\.o$',
    '\\.hi$',
    '~$',
    '^a\\.out$',
    '^__pycache__$',
    ...buildProblemPatterns(),
]

const EXTENDED_PATTERNS = ['\\.cor$']

async function addFilesToClean(directory: string, all: boolean, filesToClean: Set<string>) {
    const patterns = all ? [...BASE_PATTERNS, ...EXTENDED_PATTERNS] : BASE_PATTERNS

    const pattern = new RegExp(patterns.join('|'))

    try {
        const entries = await fs.readdir(directory, { withFileTypes: true })

        for (const entry of entries) {
            if (pattern.test(entry.name)) {
                const fullPath = path.join(directory, entry.name)
                filesToClean.add(fullPath)
            }
        }
    } catch (error) {
        tui.error(`Could not read directory ${directory}`)
    }
}

async function addAllFilesToClean(aproblem: AbstractProblem, all: boolean, filesToClean: Set<string>) {
    for (const problem of Object.values(aproblem.problems)) {
        await addFilesToClean(problem.dir, all, filesToClean)
    }
    await addFilesToClean(aproblem.dir, all, filesToClean)
}

function showFilesToClean(aproblem: AbstractProblem, filesToClean: Set<string>) {
    if (filesToClean.size === 0) {
        tui.success('No files to remove')
        return
    }

    tui.warning(`The following ${filesToClean.size} files will be removed:`)
    for (const file of Array.from(filesToClean).sort()) {
        tui.print(tui.hyperlink(aproblem.dir, file))
    }
}

async function wipeFilesToClean(filesToClean: Set<string>) {
    if (filesToClean.size === 0) {
        return
    }

    let removalCount = 0
    const errors: string[] = []

    for (const file of filesToClean) {
        try {
            await fs.rm(file, { recursive: true, force: true })
            removalCount++
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            errors.push(`${file}: ${errorMsg}`)
        }
    }

    if (errors.length > 0) {
        tui.error(`Failed to remove ${errors.length} file(s):`)
        errors.forEach((err) => tui.print(`  ${err}`))
    }

    if (removalCount > 0) {
        tui.success(`Removed ${removalCount} file(s)`)
    }
}
