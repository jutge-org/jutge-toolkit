import { password } from '@inquirer/prompts'
import { Command } from '@commander-js/extra-typings'
import { updateSharingSettings } from '../lib/share'

export const cmdShare = new Command('share')
    .summary('Update and show sharing settings')

    .description(
        `Update and show sharing settings

First, this command updates the sharing settings in problem.yml file with the ones on Jutge.org to ensure they are consistent.

Then, it updates the sharing settings in Jutge.org with the requested changes. The following options are available:
    --passcode [code] Set a passcode (prompted if omitted)
    --no-passcode Clear the passcode
    --testcases Share testcases
    --no-testcases Stop sharing testcases
    --solutions Share solutions
    --no-solutions Stop sharing solutions

Finally, it updates problem.yml file with the current sharing settings and shows them.`,
    )

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('--passcode [code]', 'Set a passcode (prompted if omitted)')
    .option('--no-passcode', 'Clear the passcode')
    .option('--testcases', 'Share testcases')
    .option('--no-testcases', 'Stop sharing testcases')
    .option('--solutions', 'Share solutions')
    .option('--no-solutions', 'Stop sharing solutions')

    .action(async function () {
        const opts = this.opts()

        let passcode: string | undefined | false
        if (this.getOptionValueSource('passcode') === undefined) {
            passcode = undefined
        } else if (this.getOptionValueSource('passcode') === 'cli') {
            if (opts.passcode === true) {
                passcode = await password({ message: 'Passcode:' })
            } else {
                passcode = opts.passcode
            }
        }

        const testcases = this.getOptionValueSource('testcases') !== 'default' ? opts.testcases : undefined
        const solutions = this.getOptionValueSource('solutions') !== 'default' ? opts.solutions : undefined

        await updateSharingSettings(opts.directory, { passcode, testcases, solutions })
    })
