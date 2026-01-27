import { Command } from '@commander-js/extra-typings'
import { newMaker } from '../lib/make-std'

export const verifyCmd = new Command('verify')
    .description('Verify programs against golden solution')

    .argument('<programs...>', 'source programs to verify')
    .option('-d, --directory <path>', 'problem directory', '.')

    .action(async (programs, { directory }) => {
        const maker = await newMaker(directory)
        for (const program of programs) {
            await maker.verifyCandidate(program)
        }
    })
