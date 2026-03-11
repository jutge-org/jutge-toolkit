import { Command } from '@commander-js/extra-typings'
import { removeProblemInDirectory } from '../lib/remove'

export const removeCmd = new Command('remove')
    .summary('Remove problem from Jutge.org')
    .description(
        `Remove problem from Jutge.org. Only problems that have a few submissions can be removed.

Removes the problem from Jutge.org using the problem_nm in problem.yml.
On success, deletes the problem.yml file. On error, shows the error.`,
    )

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-y, --yes', 'skip confirmation prompt')

    .action(async ({ directory, yes }) => {
        await removeProblemInDirectory(directory, { yes })
    })
