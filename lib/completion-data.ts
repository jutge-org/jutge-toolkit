/**
 * Data and helpers for shell completion.
 * Used by the completion command to provide candidates for commands, options, and values.
 */

import { glob } from 'fs/promises'
import path from 'path'
import { languageKeys, proglangKeys } from './data'
import { getDefinedCompilerIds } from '../compilers'
import { projectDir } from './utils'
import { Settings } from './types'

/** Top-level commands (public; order matches index.ts where possible) */
export const topLevelCommands = [
    'make',
    'upload',
    'passcode',
    'clean',
    'clone',
    'generate',
    'verify',
    'lint',
    'submit',
    'convert',
    'stage',
    'doctor',
    'config',
    'upgrade',
    'about',
    'ask',
] as const

/** make task names */
export const makeTasks = ['all', 'info', 'exe', 'cor', 'pdf', 'txt', 'md', 'html'] as const

/** generate subcommands */
export const generateSubcommands = [
    'problem',
    'translations',
    'solutions',
    'mains',
    'generators',
    'award.png',
    'award.html',
] as const

/** config subcommands */
export const configSubcommands = ['show', 'list', 'get', 'set', 'edit', 'reset'] as const

/** passcode subcommands */
export const passcodeSubcommands = ['show', 'set', 'remove'] as const

/** convert subcommands */
export const convertSubcommands = ['transform-at-signs'] as const

/** Language codes (statement/UI languages) */
export const languageCodes = [...languageKeys]

/** Programming language keys (for solutions, mains, etc.) */
export const proglangCodes = [...proglangKeys]

/** Config keys from Settings schema */
export const configKeys: string[] = Object.keys(Settings.shape)

/** Compiler ids (toolkit-defined; for submit -c) */
export async function compilerIds(): Promise<string[]> {
    const ids = await getDefinedCompilerIds()
    return ['auto', ...ids]
}

/** Template names (category/name.pbm) from assets/problems */
export async function templateNames(): Promise<string[]> {
    const templatesDir = path.join(projectDir(), 'assets', 'problems')
    const out: string[] = []
    try {
        const dirNames = await glob('*', { cwd: templatesDir })
        const dirs = Array.isArray(dirNames) ? dirNames : Object.keys(dirNames as object)
        for (const dir of dirs) {
            const subPath = path.join(templatesDir, dir)
            const pbms = await glob('*.pbm', { cwd: subPath })
            const list = Array.isArray(pbms) ? pbms : Object.keys(pbms as object)
            list.sort()
            for (const p of list) {
                out.push(`${dir}/${p}`)
            }
        }
    } catch {
        // ignore (e.g. assets not available in built package)
    }
    return out
}
