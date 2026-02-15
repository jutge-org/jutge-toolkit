import { Command } from '@commander-js/extra-typings'
import { submitInDirectory } from '../lib/submit'

export const submitCmd = new Command('submit')
    .summary('Submit solutions to Jutge.org')

    .argument('<programs...>', 'programs to submit (e.g. solution.cc slow.py buggy.py)')
    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-l, --language <code>', 'language code (ca, es, en, ...)', 'en')
    .option('-n, --no-wait', 'do not wait for submissions to be judged')

    .action(async (programs, { directory, language, wait }) => {
        await submitInDirectory(directory, language, programs, !wait)
    })
