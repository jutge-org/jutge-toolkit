import { exists } from 'fs/promises'
import { projectDir, readText } from './utils'
import { join } from 'path'
import { normalize, relative, resolve } from 'node:path'
import { languageNames } from './data'
import tui from './tui'

export function getTitleFromStatement(statement: string): string | null {
    const pattern = /\\Problem\{(.*?)\}/
    const match = statement.match(pattern)
    if (match) {
        return match[1]!.trim()
    }
    return null
}

export async function getIOPromptForProglang(proglang: string): Promise<string> {
    const location = join(projectDir(), 'assets', 'prompts', 'io', 'proglangs', `io-${proglang}.md`)
    if (await exists(location)) {
        return await readText(location)
    } else {
        tui.warning(`Prompt for ${proglang} not found at ${location}`)
        return ''
    }
}

/*
    Find real problem directories from a list of directories. A real problem directory is one that contains a handler.yml file.
    If a directory does not contain a handler.yml file, check if it contains subdirectories for each language that contain a handler.yml file.
    If so, add those subdirectories to the list of real problem directories.
*/
export async function findRealDirectories(directories: string[]): Promise<string[]> {
    const realDirectories: string[] = []
    for (let dir of directories) {
        if (dir === '.') {
            dir = normalize(resolve(process.cwd()))
        }
        if (await exists(join(dir, 'handler.yml'))) {
            realDirectories.push(dir)
        } else {
            for (const language of Object.keys(languageNames).sort()) {
                const child = join(dir, language, 'handler.yml')
                if (await exists(child)) {
                    realDirectories.push(resolve(dir, language))
                }
            }
        }
    }
    return realDirectories.map((d) => normalize(d)).sort()
}

export function listify(items: (string | undefined)[]): string {
    if (items.length === 0) {
        return '<none>'
    }
    return items.map((item) => `- ${item}`).join('\n')
}
