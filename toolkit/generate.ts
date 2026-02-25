import { Argument, Command, Option } from '@commander-js/extra-typings'
import { exists } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { complete } from '../lib/aiclient'
import { createFuncsProblem } from '../lib/create-funcs'
import { createIOProblem } from '../lib/create-io'
import { languageKeys, languageNames, proglangKeys, proglangNames } from '../lib/data'
import {
    addAlternativeSolution,
    addMainFile,
    addStatementTranslation,
    generateStatementFromSolution,
    generateTestCasesGenerator,
} from '../lib/generate'
import { getLoggedInJutgeClient } from '../lib/login'
import { newProblem } from '../lib/problem'
import { settings } from '../lib/settings'
import tui from '../lib/tui'
import { writeText } from '../lib/utils'

export const generateCmd = new Command('generate')
    .description('Generate problem elements using JutgeAI')

    .action(() => {
        generateCmd.help()
    })

generateCmd
    .command('problem')
    .description('Generate a problem with JutgeAI')

    .summary(`Generate a problem with JutgeAI

Use this command to generate a problem with JutgeAI from a specification.

There are currently two types of problems that can be generated:

- io: The problem consists of reading input from standard input and writing output to standard output.

    Current implementation supports C, C++, Python, Haskell, Java, Rust, R and Clojure programming languages.
    
    The following items will be generated:
        - problem statement in original language
        - sample test cases
        - private test cases
        - golden solution 
        - translations of the problem statement into other languages
        - alternative solutions in other programming languages
        - test cases generators
        - a README.md file describing the problem and LLM usage

- funcs: The problem consists of implementing one or more functions.

    Current implementation supports Python, Haskell and Clojure programming languages (through RunPython, RunHaskell and RunClojure compilers).

    The following items will be generated:
        - problem statement in original language
        - translations of the problem statement into other languages
        - generate sample.dt for Python
        - sample test cases
        - private test cases for each function
        - golden solution
        - alternative solutions in other programming languages
        - scores.yml file with the scores for each function (if there is more than one function)
        - a README.md file describing the problem and LLM usage

Problem generation needs a problem specification:
    - If --input is provided, the system will read the given input specification file.
    - If --output is provided, the system will write the problem specification to the given output specification file.
    - The system will ask interactively for the problem specification (using the values in the --input specification file if provided as defaults)
    - unless the --do-not-ask flag is given.

Treat the generated problem as a starting draft. You should edit the problem directory manually after the generation.
`)

    .addOption(
        new Option
            ('-k, --kind <kind>', 'problem kind')
            .default('io')
            .choices(['io', 'funcs'])
    )
    .option('-d, --directory <path>', 'output directory', 'new-problem.pbm')
    .option('-i, --input <path>', 'input specification file')
    .option('-o, --output <path>', 'output specification file')
    .option('-n, --do-not-ask', 'do not ask interactively if --input given', false)
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)

    .action(async ({ input, output, directory, model, doNotAsk, kind }) => {
        const jutge = await getLoggedInJutgeClient()
        await tui.section(`Generating ${kind} problem with JutgeAI`, async () => {

            if (await exists(directory)) {
                throw new Error(`Directory ${directory} already exists`)
            }
            if (!directory.endsWith('.pbm')) {
                throw new Error('The output directory must end with .pbm')
            }

            if (kind === 'io') {
                await createIOProblem(jutge, model, directory, input, output, doNotAsk)
            } else if (kind === 'funcs') {
                await createFuncsProblem(jutge, model, directory, input, output, doNotAsk)
            } else {
                throw new Error(`Invalid problem kind: ${kind as string}`)
            }
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
    .command('statement')
    .summary('Generate a statement from a solution using JutgeAI')
    .description(
        `Generate a problem statement from a solution using JutgeAI

Use this command to create a statement file from an existing solution.
The AI infers the problem (input/output, task) from the solution code and writes a problem statement.

Provide the programming language of the solution to use and the target language for the statement.
An optional prompt can guide the statement generation (e.g. "Focus on edge cases" or "Assume the problem is for beginners").

The result is written to statement.<lang>.tex in the problem directory.`,
    )
    .addArgument(new Argument('<proglang>', 'solution to use (e.g. cc, py)').choices(proglangKeys))
    .addArgument(new Argument('<language>', 'statement language').choices(languageKeys))
    .option('-d, --directory <path>', 'problem directory', '.')
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)
    .argument('[prompt]', 'optional prompt to guide statement generation', '')
    .action(async (proglang, language, prompt, { directory, model }) => {
        const jutge = await getLoggedInJutgeClient()
        const problem = await newProblem(directory)
        await generateStatementFromSolution(jutge, model, problem, proglang, language, (prompt ?? '').trim() || undefined)
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
        await newProblem(directory)
        let imagePrompt = prompt.trim()
        if (imagePrompt === '') {
            imagePrompt = 'A colorful award on a white background'
        }
        await tui.section('Generating award image', async () => {
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
