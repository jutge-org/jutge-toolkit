import { Command } from '@commander-js/extra-typings'
import { inspect } from '../lib/inspect'
import { loadAbstractProblem } from '../lib/new-problem'

export const inspectCmd = new Command('inspect')
    .summary('Inspect problem')

    .option('-d, --directory <directory>', 'problem directory', '.')

    .action(async ({ directory }) => {
        const aproblem = await loadAbstractProblem(directory)
        await inspect(aproblem)
    })
