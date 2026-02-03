import { Command } from '@commander-js/extra-typings'
import { removePasscodeInDirectory, setPasscodeInDirectory, showPasscodeInDirectory } from '../lib/passcode'

export const cmdPasscode = new Command('passcode')
    .summary('Show, set or remove problem passcode')
    .description(
        `Show, set or remove the passcode of a problem at Jutge.org.

These operations require an existing problem.yml file in the problem directory.
On success, problem.yml is updated with the new passcode (or empty for remove).`,
    )


cmdPasscode
    .command('show')
    .description('Show the passcode of the problem')
    .option('-d, --directory <directory>', 'problem directory', '.')

    .action(async ({ directory }) => {
        await showPasscodeInDirectory(directory)
    })

cmdPasscode
    .command('set')
    .description('Set or update the passcode of the problem')

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-p, --passcode <passcode>', 'passcode (if omitted, will prompt)')

    .action(async ({ directory, passcode }) => {
        await setPasscodeInDirectory(directory, passcode)
    })

cmdPasscode
    .command('remove')
    .description('Remove the passcode of the problem')
    .option('-d, --directory <directory>', 'problem directory', '.')

    .action(async ({ directory }) => {
        await removePasscodeInDirectory(directory)
    })
