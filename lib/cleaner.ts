import path from 'path'
import tui from './tui'
import { confirm } from '@inquirer/prompts'
import { readdir, rm } from 'fs/promises'
import { toolkitPrefix } from './utils'

export async function cleanDirectory(force: boolean, all: boolean, directory: string): Promise<void> {
    const patterns = [
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
    ]
    const allPatterns = [
        '\\.cor$',
        '^problem\\.[a-z][a-z]\\.ps$',
        '^problem\\.[a-z][a-z]\\.pdf$',
        '^problem\\.[a-z][a-z]\\.md$',
        '^problem\\.[a-z][a-z]\\.txt$',
        '^problem\\.[a-z][a-z]\\.html$',
        '^problem\\.[a-z][a-z]\\.short\\.md$',
        '^problem\\.[a-z][a-z]\\.short\\.txt$',
        '^problem\\.[a-z][a-z]\\.short\\.html$',
    ]
    if (all) {
        patterns.push(...allPatterns)
    }

    const pattern = new RegExp(patterns.join('|'))

    const entries = await readdir(directory, { withFileTypes: true })

    const removalList: string[] = []
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)
        if (pattern.test(entry.name)) {
            removalList.push(fullPath)
        }
    }

    if (removalList.length === 0) {
        tui.success('No entries to remove')
        return
    }

    tui.warning(`The following ${removalList.length} entries will be removed:`)
    for (const elem of removalList.sort()) {
        tui.print(tui.hyperlink(directory, elem))
    }

    if (!force) {
        console.log()
        const conformation = await confirm({
            message: `Remove ${removalList.length} entries?`,
            default: false,
        })
        if (!conformation) return
    }

    let removalCount = 0
    for (const elem of removalList) {
        try {
            await rm(elem, { recursive: true, force: true })
            removalCount++
        } catch (error) {
            tui.error(`Could not remove entry ${elem}`)
        }
    }

    tui.success(`Removed ${removalCount} entries`)
    if (!all) {
        tui.warning(`You can use the --all option to remove generated statement and correct files as well`)
    }
}
