import { Command } from '@commander-js/extra-typings'
import { runQuiz, lintQuiz } from '../lib/quiz'
import tui from '../lib/tui'
import { findRealDirectories } from '../lib/helpers'
import { random } from 'radash'

export const quizCmd = new Command('quiz')
    .summary('Commands related to quizzes')

    .action(() => {
        quizCmd.help()
    })

quizCmd
    .command('lint')
    .summary('Lint a quiz problem')

    .option('-d, --directory <directory>', 'problem directory', '.')

    .action(async ({ directory }) => {
        const realDirectories = await findRealDirectories([directory])
        for (const directory of realDirectories) {
            await tui.section(`Linting quiz in directory ${tui.hyperlink(directory)}`, async () => {
                await lintQuiz(directory)
            })
        }
    })

quizCmd
    .command('run')
    .summary('Run a quiz problem')
    .description(
        `Run a quiz problem. This command is work-in-progress and may not work as expected yet.

This command will run the quiz problem and print the resulting object to stdout.
A random seed will be generated if not provided.
`,
    )

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-s, --seed <seed>', 'random seed')
    .option('-f, --format <format>', 'output format (json|yaml)', 'json')

    .action(async ({ directory, seed, format }) => {
        const seedValue = seed ? parseInt(seed, 10) : random(1000000, 9999999)
        const object = await runQuiz(directory, seedValue)
        if (format === 'json') {
            tui.json(object)
        } else {
            tui.yaml(object)
        }
    })
