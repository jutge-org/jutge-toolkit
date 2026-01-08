import { Command, Option } from '@commander-js/extra-typings'
import { cleanDirectory } from '../lib/cleaner'
import tui from '../lib/tui'
import { findRealDirectories } from '../lib/helpers'

export const cleanCmd = new Command('clean')
    .description('Clean disposable files')

    .option('-d, --directories <directories...>', 'problem directories', ['.'])
    .option('-a, --all', 'clean all disposable files (including generated statement and correct files', false)
    .addOption(new Option('-f, --force', 'force removal').conflicts('dryRun'))
    .addOption(new Option('-n, --dry-run', 'show but do not remove files').conflicts('force'))

    .action(async ({ directories, all, force, dryRun }) => {
        const isForce = force || false // default to dry-run if neither option is specified

        await tui.section(`Cleaning generated files`, async () => {
            const realDirectories = await findRealDirectories(directories)
            for (const directory of realDirectories) {
                await tui.section(`Cleaning directory ${tui.hyperlink(directory)}`, async () => {
                    await cleanDirectory(isForce, all, directory)
                })
            }
        })
    })
