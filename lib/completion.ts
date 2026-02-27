/**
 * Shell completion logic: given argv words and current index, return candidate words.
 */

import {
    compilerIds,
    configKeys,
    configSubcommands,
    convertSubcommands,
    generateSubcommands,
    languageCodes,
    makeTasks,
    proglangCodes,
    templateNames,
    topLevelCommands,
} from './completion-data'

export type Shell = 'bash' | 'zsh' | 'fish' | 'powershell'

/** Option that takes a value: completion context for the value */
type ValueContext =
    | { kind: 'language' }
    | { kind: 'compiler' }
    | { kind: 'template' }
    | { kind: 'config-key' }
    | { kind: 'make-task' }
    | { kind: 'proglang' }
    | { kind: 'directory' }
    | { kind: 'file' }
    | { kind: 'model' }
    | { kind: 'word' }

export interface CompletionResult {
    /** Candidates to output (one per line for bash/zsh) */
    words: string[]
    /** Optional: whether we're completing after an option that takes a value */
    valueContext?: ValueContext
}

/** Keep only long options (--opt), drop short ones (-o), then filter by prefix */
function filterLongOptions(opts: string[], curWord: string): string[] {
    const longOnly = opts.filter((o) => o.startsWith('--'))
    return longOnly.filter((o) => o.startsWith(curWord))
}

/**
 * Compute completion candidates for the given word list.
 * curWordIndex: index in words of the word being completed (may be empty string).
 */
export async function complete(words: string[], curWordIndex: number): Promise<CompletionResult> {
    const curWord = words[curWordIndex] ?? ''
    const prevWord = curWordIndex > 0 ? words[curWordIndex - 1] : ''
    const isOptionValue = curWordIndex >= 1 && (prevWord?.startsWith('-') ?? false)

    // Helper: complete option value
    if (curWordIndex >= 2) {
        const cmd = words[1]
        const prev = words[curWordIndex - 1]!
        if (prev === '-d' || prev === '--directory' || prev === '--directories') {
            return { words: [], valueContext: { kind: 'directory' } }
        }
        if (prev === '-l' || prev === '--language') {
            const list = languageCodes.filter((w) => w.startsWith(curWord))
            return { words: list }
        }
        if (prev === '-c' || prev === '--compiler') {
            const ids = await compilerIds()
            const list = ids.filter((w) => w.startsWith(curWord))
            return { words: list }
        }
        if (prev === '-m' || prev === '--model') {
            return { words: [], valueContext: { kind: 'model' } }
        }
        if (prev === '-p' || prev === '--passcode' || prev === '--problem_nm') {
            return { words: [], valueContext: { kind: 'word' } }
        }
        if ((prev === '-i' || prev === '--input' || prev === '--output') && cmd === 'generate') {
            return { words: [], valueContext: { kind: 'file' } }
        }
    }

    // Top-level: complete command or global option
    if (curWordIndex <= 1) {
        const opts = ['--help', '--version']
        const commands = topLevelCommands.filter((c) => c.startsWith(curWord))
        const options = filterLongOptions(opts, curWord)
        return { words: [...commands, ...options] }
    }

    const cmd = words[1]!

    switch (cmd) {
        case 'make': {
            if (curWordIndex === 2 && !curWord.startsWith('-')) {
                const list = makeTasks.filter((t) => t.startsWith(curWord))
                return { words: list }
            }
            const opts = ['--directories', '--ignore-errors', '--only-errors', '--problem_nm']
            return { words: filterLongOptions(opts, curWord) }
        }
        case 'upload':
        case 'verify':
        case 'doctor':
        case 'about':
        case 'upgrade':
            return { words: filterLongOptions(['--directory', '--help'], curWord) }
        case 'clean': {
            const opts = ['--directories', '--all', '--force', '--dry-run', '--help']
            return { words: filterLongOptions(opts, curWord) }
        }
        case 'clone': {
            if (curWordIndex === 2 && !curWord.startsWith('-')) {
                const names = await templateNames()
                const list = names.filter((n) => n.startsWith(curWord))
                return { words: list }
            }
            return { words: filterLongOptions(['--directory', '--help'], curWord) }
        }
        case 'generate': {
            if (curWordIndex === 2 && !curWord.startsWith('-')) {
                const list = generateSubcommands.filter((s) => s.startsWith(curWord))
                return { words: list }
            }
            if (curWordIndex === 3 && !curWord.startsWith('-')) {
                const sub = words[2]
                if (sub === 'translations') {
                    const list = languageCodes.filter((l) => l.startsWith(curWord))
                    return { words: list }
                }
                if (sub === 'solutions' || sub === 'mains') {
                    const list = proglangCodes.filter((p) => p.startsWith(curWord))
                    return { words: list }
                }
            }
            const opts = ['--directory', '--model', '--input', '--output', '--do-not-ask']
            const genOpts =
                words[2] === 'generators'
                    ? ['--random', '--hard', '--efficiency', '--all', '--directory', '--output', '--model']
                    : opts
            return { words: filterLongOptions(genOpts, curWord) }
        }
        case 'submit': {
            const opts = [
                '--directory',
                '--compiler',
                '--language',
                '--no-wait',
                '--no-browser',
                '--annotation',
                '--help',
            ]
            return { words: filterLongOptions(opts, curWord) }
        }
        case 'config': {
            if (curWordIndex === 2 && !curWord.startsWith('-')) {
                const list = configSubcommands.filter((s) => s.startsWith(curWord))
                return { words: list }
            }
            if (words[2] === 'get' && curWordIndex === 3) {
                const list = configKeys.filter((k) => k.startsWith(curWord))
                return { words: list }
            }
            if (words[2] === 'set' && curWordIndex === 3) {
                const list = configKeys.filter((k) => k.startsWith(curWord))
                return { words: list }
            }
            return { words: filterLongOptions(['--help'], curWord) }
        }
        case 'share': {
            const opts = [
                '--directory',
                '--passcode',
                '--no-passcode',
                '--testcases',
                '--no-testcases',
                '--solutions',
                '--no-solutions',
                '--help',
            ]
            return { words: filterLongOptions(opts, curWord) }
        }
        case 'convert': {
            if (curWordIndex === 2 && !curWord.startsWith('-')) {
                const list = convertSubcommands.filter((s) => s.startsWith(curWord))
                return { words: list }
            }
            if (words[2] === 'transform-at-signs') {
                return { words: filterLongOptions(['--directories', '--help'], curWord) }
            }
            return { words: [] }
        }
        case 'lint':
        case 'stage': {
            const opts = ['--directory', '--problem_nm', '--help']
            return { words: filterLongOptions(opts, curWord) }
        }
        case 'ask':
            return { words: filterLongOptions(['--model', '--help'], curWord) }
        case 'completion': {
            if (curWordIndex === 2 && !curWord.startsWith('-')) {
                const subs = ['bash', 'zsh', 'fish', 'powershell', 'install']
                const list = subs.filter((s) => s.startsWith(curWord))
                return { words: list }
            }
            return { words: filterLongOptions(['--help'], curWord) }
        }
        case 'for-dummies':
        case 'interactive':
            return { words: filterLongOptions(['--help'], curWord) }
        default:
            return { words: [] }
    }
}
