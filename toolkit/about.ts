import { Command } from '@commander-js/extra-typings'
import chalk from 'chalk'
import tui from '../lib/tui.ts'
import { nothing } from '../lib/utils.ts'
import { packageJson } from '../lib/versions.ts'

export const aboutCmd = new Command('about')
    .description('Get information about jutge-toolkit')

    .action(async () => {
        await nothing()
        tui.print(chalk.bold(`jutge-toolkit ${packageJson.version}`))
        tui.print(packageJson.description)
        tui.print('')
        tui.url(packageJson.homepage!)
        tui.print('')
        tui.print('Author:')
        showPerson(packageJson.author!)
        tui.print('')
        tui.print('Contributors:')
        for (const contributor of packageJson.contributors!) {
            showPerson(contributor)
        }
        tui.print('')
        tui.print('Documentation:')
        tui.url('https://github.com/jutge-org/new-jutge-toolkit/tree/main/docs')
    })

function showPerson(person: string | { name: string; email?: string; url?: string }) {
    let line = '    - '
    if (typeof person === 'string') {
        line += person
    } else {
        line += person.name
        if (person.email) {
            line += ` <${tui.link('mailto://' + person.email, person.email)}>`
        }
        if (person.url) {
            line += ` (${tui.link(person.url)})`
        }
    }
    tui.print(line)
}
