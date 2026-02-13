import { Argument, Command } from '@commander-js/extra-typings'
import { join } from 'path'
import sharp from 'sharp'
import { createProblemWithJutgeAI } from '../lib/create-with-jutgeai'
import { complete } from '../lib/aiclient'
import { languageKeys, languageNames, proglangKeys, proglangNames } from '../lib/data'
import {
    addAlternativeSolution,
    addMainFile,
    addStatementTranslation,
    generateTestCasesGenerator,
} from '../lib/generate'
import { newProblem } from '../lib/problem'
import { settings } from '../lib/settings'
import tui from '../lib/tui'
import { writeText } from '../lib/utils'
import { getLoggedInJutgeClient } from '../lib/login'

export const generateCmd = new Command('generate')
    .description('Generate problem elements using JutgeAI')

    .action(() => {
        generateCmd.help()
    })

generateCmd
    .command('problem')
    .description('Generate a problem with JutgeAI')

    .option('-d, --directory <path>', 'output directory', 'new-problem.pbm')
    .option('-i, --input <path>', 'input specification file')
    .option('-o, --output <path>', 'output specification file')
    .option('-n, --do-not-ask', 'do not ask interactively if --input given', false)
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)

    .action(async ({ input, output, directory, model, doNotAsk }) => {
        const jutge = await getLoggedInJutgeClient()
        await tui.section('Generating problem with JutgeAI', async () => {
            await createProblemWithJutgeAI(jutge, model, directory, input, output, doNotAsk)
        })
    })

generateCmd
    .command('translations')
    .summary('Generate statement translations using JutgeAI')
    .description(
        `Generate statement translations using JutgeAI
    
Use this command to add translations of the problem statement into different languages.
The original statement will be used as the source text for translation.

Provide one or more target language from the following list:
${Object.entries(languageNames)
            .map(([key, name]) => `  - ${key}: ${name}`)
            .join('\n')}

The added translations will be saved in the problem directory overwrite possible existing files.`,
    )

    .addArgument(new Argument('<languages...>', 'languages to add').choices(languageKeys))
    .option('-d, --directory <path>', 'problem directory', '.')
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)

    .action(async (languages, { directory, model }) => {
        const jutge = await getLoggedInJutgeClient()
        const problem = await newProblem(directory)
        await tui.section('Generating statement translations', async () => {
            for (const language of languages) {
                await addStatementTranslation(jutge, model, problem, language)
            }
        })
    })

generateCmd
    .command('solutions')
    .summary('Generate alternative solutions using JutgeAI')
    .description(
        `Generate alternative solutions using JutgeAI

Use this command to add alternative solutions for the problem in different programming languages.
The golden solution will be used as a reference for generating the alternatives.

Provide one or more target programming languages from the following list:
${Object.entries(languageNames)
            .map(([key, name]) => `  - ${key}: ${name}`)
            .join('\n')}

The added solutions will be saved in the problem directory overwrite possible existing files.`,
    )

    .addArgument(new Argument('<proglangs...>', 'proglangs to add').choices(proglangKeys))
    .option('-d, --directory <path>', 'problem directory', '.')
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)

    .action(async (proglangs, { directory, model }) => {
        const jutge = await getLoggedInJutgeClient()
        const problem = await newProblem(directory)
        await tui.section('Generating statement translations', async () => {
            for (const proglang of proglangs) {
                await tui.section(`Generating solution in ${proglangNames[proglang]}`, async () => {
                    await addAlternativeSolution(jutge, model, problem, proglang)
                })
            }
        })
    })

generateCmd
    .command('mains')
    .summary('Generate main files using JutgeAI')
    .description(
        `Generate main files using JutgeAI

Main files are the entry point for problems that ask users to implement specific functions or classes.

Use this command to add main files for the problem in different programming languages.
The main file for the golden solution will be used as a reference for generating the main files.

Provide one or more target programming languages from the following list:
${Object.entries(languageNames)
            .map(([key, name]) => `  - ${key}: ${name}`)
            .join('\n')}

The added main files will be saved in the problem directory overwrite possible existing files.`,
    )

    .addArgument(new Argument('<proglangs...>', 'proglangs to add').choices(proglangKeys))
    .option('-d, --directory <path>', 'problem directory', '.')
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)

    .action(async (proglangs, { directory, model }) => {
        const jutge = await getLoggedInJutgeClient()
        const problem = await newProblem(directory)
        for (const proglang of proglangs) {
            await addMainFile(jutge, model, problem, proglang)
        }
    })

generateCmd
    .command('generators')
    .summary('Generate test cases generators using JutgeAI')

    .option('--random', 'generate a generator for random test cases')
    .option('--hard', 'generate a generator for hard test cases')
    .option('--efficiency', 'generate a generator for efficiency test cases')
    .option('--all', 'generate all three test case generators')

    .option('-d, --directory <path>', 'problem directory', '.')
    .option('-o, --output <path>', 'output file', 'generator-{{type}}.py')
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)

    .action(async ({ efficiency, hard, random, all, directory, model, output }) => {
        const jutge = await getLoggedInJutgeClient()
        const problem = await newProblem(directory)
        await tui.section('Generating test cases generators', async () => {
            if (all || random) await generateTestCasesGenerator(jutge, model, problem, output, 'random')
            if (all || hard) await generateTestCasesGenerator(jutge, model, problem, output, 'hard')
            if (all || efficiency) await generateTestCasesGenerator(jutge, model, problem, output, 'efficiency')
        })
    })

generateCmd
    .command('award.png')
    .summary('Generate award.png using JutgeAI')
    .description(
        `Generate award.png using AI
    
Use this command to add an award image for the problem.
Awards are shown to users when they solve the problem.
They help to motivate users and make the platform more engaging.

Provide an interesting prompt to customize the image content. For example:
    - "A golden trophy with a blue ribbon on a wooden base."
    - "A star made of sparkling diamonds on a black background."
    - "A minimalist image with a white background using Van Gogh style."

If no prompt is provided, the original problem title will be used.

The new image will be saved as award.png in the problem directory, overriding any existing file.`,
    )

    .option('-d, --directory <path>', 'problem directory', '.')
    .option('-m, --model <model>', 'graphic AI model to use', 'openai/dall-e-3')
    .argument('[prompt]', 'prompt to generate the image', '')

    .action(async (prompt, { directory, model }) => {
        const jutge = await getLoggedInJutgeClient()
        const output = join(directory, 'award.png')
        const problem = await newProblem(directory)
        let imagePrompt = prompt.trim()
        if (imagePrompt === '') {
            imagePrompt = 'A colorful award on a white background'
        }
        await tui.section('Generating award image', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- generated API client
            const download = await jutge.instructor.jutgeai.createImage({
                model,
                label: 'award',
                prompt: imagePrompt,
                size: '1024x1024',
            })
            await sharp(Buffer.from(download.data)).resize(512, 512).toFile(output)
            await tui.image(output, 20, 10)
            tui.success(`Added ${output}`)
        })
    })

generateCmd
    .command('award.html')
    .summary('Generate award.html using JutgeAI')
    .description(
        `Generate award.html using JutgeAI

Use this command to add an award message for the problem.
Awards are shown to users when they solve the problem.
They help to motivate users and make the platform more engaging.

Provide an interesting prompt to customize the message content. For example:
- "A short encouraging message after having solved a challenge or a problem."
- "A congratulatory message for completing a difficult task."
- "A motivational quote to inspire further learning."

The new message will be saved as award.html in the problem directory, overriding any existing file.`,
    )

    .option('-d, --directory <path>', 'problem directory', '.')
    .argument(
        '[prompt]',
        'prompt to generate the award message',
        'Only provide a short encouraging message after having solved a challenge or a problem. Nothing else!',
    )
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)

    .action(async (prompt, { directory, model }) => {
        const jutge = await getLoggedInJutgeClient()
        const output = join(directory, 'award.html')
        const systemPrompt =
            'You generate short textual award messages shown when a user solves a problem. Output only the message text, no markdown code blocks or explanation. If you like, use a famous quote by a famous person. In this case, use the name of the person in the message.'
        await tui.section('Generating award message', async () => {
            const message = await complete(jutge, model, 'award', systemPrompt, prompt)
            tui.print(message)
            await writeText(output, message)
            tui.success(`Added ${output}`)
        })
    })
