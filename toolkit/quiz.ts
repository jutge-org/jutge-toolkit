import { Command } from '@commander-js/extra-typings'
import { runQuiz, lintQuiz } from '../lib/quiz'
import {
    loadQuizTestInput,
    playQuiz,
    writeQuizTestOutput,
} from '../lib/play-quiz'
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
        `Run a quiz problem.

This command will run the quiz problem and print the resulting object to stdout.
A random seed will be generated if not provided.
`)

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


quizCmd
    .command('play')
    .summary('Play a quiz problem')
    .description(
        `Play an interactive quiz test. Questions are shown in sequence; you can review and change answers before submitting.
Input is a JSON file from \`quiz run\`; if --input is omitted, a run is generated with a random seed from the given directory.
If --output is given, the results (your answers, correct answers, and score per question) are written to that file.`)

    .option('-i, --input <input>', 'input JSON file from quiz run')
    .option('-o, --output <output>', 'output file for results')
    .option('-d, --directory <directory>', 'problem directory (used when --input is not provided)', '.')
    .option('-s, --seed <seed>', 'random seed (used when --input is not provided)')

    .action(async ({ input, output, directory, seed }) => {
        const seedValue = seed !== undefined ? parseInt(seed, 10) : undefined
        const quizInput = await loadQuizTestInput(input, directory, seedValue)
        const results = await playQuiz(quizInput)
        if (output !== undefined) {
            await writeQuizTestOutput(output, results)
        }
    })
