import { Command } from '@commander-js/extra-typings'
import { makeQuiz, validateQuiz } from '../lib/quiz'
import tui from '../lib/tui'
import { findRealDirectories } from '../lib/helpers'
import { random } from 'radash'

export const quizCmd = new Command('quiz')
    .description('Commands related to quizzes')

    .action(() => {
        quizCmd.help()
    })

quizCmd
    .command('validate')
    .description('Validate a quiz problem')

    .option('-d, --directory <directory>', 'problem directory', '.')

    .action(async ({ directory }) => {
        const realDirectories = await findRealDirectories([directory])
        for (const directory of realDirectories) {
            await tui.section(`Validating quiz in directory ${tui.hyperlink(directory)}`, async () => {
                await validateQuiz(directory)
            })
        }
    })

quizCmd
    .command('make')
    .description('Make a quiz problem')

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-s, --seed <seed>', 'random seed')

    .action(async ({ directory, seed }) => {
        tui.warning('The quiz make command is work-in-progress and may not work as expected yet.')
        const realDirectories = await findRealDirectories([directory])
        const seedValue = seed ? parseInt(seed, 10) : random(1000000, 9999999)
        for (const directory of realDirectories) {
            await makeQuiz(directory, seedValue)
            return // in this case we only process one directory as quizzes should only have one language
        }
    })
