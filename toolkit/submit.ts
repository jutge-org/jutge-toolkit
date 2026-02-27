import { Command } from '@commander-js/extra-typings'
import { submitInDirectory } from '../lib/submit'
import { nanoid16 } from '../lib/utils'

export const submitCmd = new Command('submit')
    .summary('Submit solutions to Jutge.org')

    .argument('<programs...>', 'programs to submit (e.g. solution.cc slow.py buggy.py)')
    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-c, --compiler <id>', 'compiler to use (default: auto-detect from file extension)', 'auto')
    .option('-l, --language <code>', 'language code (ca, es, en, ...)', 'en')
    .option('-n, --no-wait', 'do not wait for submissions to be judged')
    .option(
        '--no-browser',
        'do not open the submission URL in the browser (only print URL and/or wait for verdict in terminal)',
    )
    .option('-a, --annotation <annotation>', "annotation for the submission (default: 'jtk-submit-<nanoid16>')")

    .action(async (programs, { directory, compiler, language, wait, browser, annotation }) => {
        const annotationValue = annotation ?? `jtk-submit-${nanoid16()}`
        await submitInDirectory(directory, language, programs, !wait, browser, compiler, annotationValue)
    })
