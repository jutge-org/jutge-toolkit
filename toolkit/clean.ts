import { Command, Option } from '@commander-js/extra-typings'
import { loadAbstractProblem } from '../lib/new-problem'
import { clean } from '../lib/clean'

export const cleanCmd = new Command('clean')
    .description('Clean disposable files')

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-a, --all', 'clean all disposable files (including correct files', false)
    .addOption(new Option('-f, --force', 'force removal').conflicts('dryRun'))
    .addOption(new Option('-n, --dry-run', 'show but do not remove files').conflicts('force'))

    .action(async ({ directory, all, force, dryRun }) => {
        const isForce = force || false // default to dry-run if neither option is specified
        const aproblem = await loadAbstractProblem(directory)
        await clean(aproblem, isForce, all)
    })
