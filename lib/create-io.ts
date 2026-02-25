import * as prompts from '@inquirer/prompts'
import { exists, mkdir } from 'fs/promises'
import Handlebars from 'handlebars'
import checkboxPlus from 'inquirer-checkbox-plus-plus'
import { join } from 'path'
import tree from 'tree-node-cli'
import YAML from 'yaml'
import { z } from 'zod'
import { ChatBot, cleanMarkdownCodeString, complete, llmEstimates } from './aiclient'
import { languageNames, proglangNames } from './data'
import { getTitleFromStatement, listify } from './helpers'
import type { JutgeApiClient, LlmUsageEntry } from './jutge_api_client'
import { settings } from './settings'
import tui from './tui'
import {
    createGitIgnoreFile,
    nanoid12,
    projectDir,
    readText,
    readTextInDir,
    readYaml,
    writeTextInDir,
    writeYaml,
    writeYamlInDir,
} from './utils'

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

export async function createIOProblem(
    jutge: JutgeApiClient,
    model: string,
    directory: string,
    inputPath: string | undefined,
    outputPath: string | undefined,
    doNotAsk: boolean,
) {
    const generator = new IOProblemGenerator({
        jutge,
        model,
        directory,
        inputPath,
        outputPath,
        doNotAsk,
    })
    await generator.run()
}


function promptsPath(...segments: string[]): string {
    return join(projectDir(), 'assets', 'prompts', ...segments)
}


interface ProblemGeneratorParams {
    jutge: JutgeApiClient
    model: string
    directory: string
    inputPath: string | undefined
    outputPath: string | undefined
    doNotAsk: boolean
}


const IOSpecification = z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Unknown'),
    email: z.string().default('unknown'),
    golden_proglang: z.string(),
    more_proglangs: z.array(z.string()),
    original_language: z.string(),
    more_languages: z.array(z.string()),
    generators: z.array(z.string()),
})


type IOSpecification = z.infer<typeof IOSpecification>


class IOProblemGenerator {

    // inputs
    jutge: JutgeApiClient
    model: string
    dir: string
    bot: ChatBot
    label: string
    inputPath: string | undefined
    outputPath: string | undefined
    doNotAsk: boolean

    // generated
    problemStatement: string = ''
    problemMoreStatements: Record<string, string> = {}
    problemMoreSolutions: Record<string, string> = {}
    problemGenerators: Record<string, string> = {}
    problemSampleTests1: string = ''
    problemSampleTests2: string = ''
    problemPrivateTests1: string = ''
    problemPrivateTests2: string = ''
    problemReadme: string = ''

    spec!: IOSpecification

    constructor(params: ProblemGeneratorParams) {
        this.jutge = params.jutge
        this.model = params.model
        this.dir = params.directory
        this.label = `create-problem-${nanoid12()}`
        this.bot = new ChatBot(this.jutge, this.model, this.label, '')
        this.inputPath = params.inputPath
        this.outputPath = params.outputPath
        this.doNotAsk = params.doNotAsk
    }

    protected async loadSpecificationCore<T>(options: {
        loadOrCreateDefault: () => Promise<T>
        editSpec: (spec: T) => Promise<void>
    }): Promise<T> {
        const spec = await options.loadOrCreateDefault()
        if (this.inputPath && this.doNotAsk) return spec
        while (true) {
            await options.editSpec(spec)
            const action = await prompts.select({
                message: 'Choose an action:',
                choices: [
                    {
                        value: 'confirm',
                        name: 'Confirm',
                        description: 'Confirm specification and proceed to problem creation',
                    },
                    { value: 'edit', name: 'Edit', description: 'Edit the specification' },
                    { value: 'cancel', name: 'Cancel', description: 'Cancel problem creation' },
                ],
            })
            if (action === 'confirm') break
            if (action === 'cancel') {
                tui.print('Problem creation cancelled')
                process.exit(0)
            }
        }
        if (this.outputPath) {
            await writeYaml(this.outputPath, spec)
            tui.success(`Specification file written at ${tui.hyperlink(this.outputPath)}`)
        }
        return spec
    }


    async run() {
        this.spec = await this.loadSpecification()

        await tui.section(`Generating problem with JutgeAI using ${this.model}`, async () => {
            this.problemStatement = await this.generateStatement()
            await tui.section(`Generating testcases`, async () => {
                this.problemSampleTests1 = await this.generateSampleTests()
                this.bot.forgetLastInteraction() // forget first sample tests
                this.problemSampleTests2 = await this.generateSampleTests()
                this.problemPrivateTests1 = await this.generatePrivateTests()
                this.bot.forgetLastInteraction() // forget first private tests
                this.problemPrivateTests2 = await this.generatePrivateTests()
            })
            this.problemMoreSolutions = await this.generateSolutions() // these are forgotten inside
            this.bot.forgetLastInteraction() // forget private tests
            this.bot.forgetLastInteraction() // forget sample tests
            this.problemMoreStatements = await this.translateStatements()
            this.bot.forgetLastInteraction() // forget translations
            this.problemGenerators = await this.generateGenerators() // these are forgotten inside
            this.problemReadme = await this.generateReadme()
        })
        await this.save(this.dir)
        await createGitIgnoreFile(this.dir)
        const readme = await readTextInDir(this.dir, 'README.md')
        await tui.markdown(readme)
        const treeFiles = tree(this.dir, { allFiles: true, dirsFirst: false })
        tui.print(treeFiles)
        tui.success(`Created problem ${tui.hyperlink(this.dir)}`)
    }


    async loadSpecification(): Promise<IOSpecification> {
        return this.loadSpecificationCore<IOSpecification>({
            loadOrCreateDefault: async () => {
                if (this.inputPath) {
                    const spec = await tui.section(
                        `Reading specification from ${this.inputPath}`,
                        async () => IOSpecification.parse(await readYaml(this.inputPath!))
                    )
                    tui.yaml(spec)
                    return spec
                }
                this.doNotAsk = true
                return {
                    title: 'Your new problem title',
                    description: 'Describe the task of the problem here.',
                    author: settings.name || 'Your Name',
                    email: settings.email || 'email@example.com',
                    golden_proglang: 'cc',
                    more_proglangs: ['py'],
                    original_language: 'en',
                    more_languages: ['ca', 'es'],
                    generators: ['hard', 'random', 'efficiency'],
                }
            },
            editSpec: async (spec) => {
                spec.title = await prompts.input({ message: 'Title:', default: spec.title, prefill: 'editable' })
                spec.description = await prompts.editor({
                    message: 'Description:',
                    default: spec.description,
                    postfix: '.md',
                    waitForUserInput: false,
                })
                spec.author = await prompts.input({ message: 'Author:', default: spec.author, prefill: 'editable' })
                spec.email = await prompts.input({ message: 'Email:', default: spec.email, prefill: 'editable' })
                spec.original_language = await prompts.select({
                    message: `Language for original version:`,
                    choices: Object.entries(languageNames).map(([value, name]) => ({ value, name })),
                    default: spec.original_language,
                })
                spec.more_languages = await checkboxPlus({
                    message: `Other languages:`,
                    searchable: false,
                    // eslint-disable-next-line @typescript-eslint/require-await
                    source: async (answers, input) =>
                        Object.entries(languageNames)
                            .filter(([value]) => value !== spec.original_language)
                            .map(([value, name]) => ({ value, name })),
                    default: spec.more_languages,
                    loop: false,
                })
                spec.golden_proglang = await prompts.select({
                    message: `Programming language for golden solution:`,
                    choices: Object.entries(proglangNames).map(([value, name]) => ({ value, name })),
                    default: spec.golden_proglang,
                })
                spec.more_proglangs = await checkboxPlus({
                    message: `Other programming languages for solutions:`,
                    // eslint-disable-next-line @typescript-eslint/require-await
                    source: async (answers, input) =>
                        Object.entries(proglangNames)
                            .filter(([value]) => value !== spec.golden_proglang)
                            .map(([value, name]) => ({ value, name })),
                    default: spec.more_proglangs,
                })
                spec.generators = await checkboxPlus({
                    message: `Test case generators:`,
                    // eslint-disable-next-line @typescript-eslint/require-await
                    source: async (answers, input) => [
                        { value: 'random', name: 'Random' },
                        { value: 'hard', name: 'Hard' },
                        { value: 'efficiency', name: 'Efficiency' },
                    ],
                    default: spec.generators,
                })
            },
        })
    }


    async generateStatement(): Promise<string> {
        tui.print(`Chat label: ${this.label}`)
        return await tui.section(
            `Generating problem statement in ${languageNames[this.spec.original_language]}`,
            async () => {
                const [ioStatementPromptTemplate, ioLatexExample, statementCoda] = await Promise.all([
                    readText(promptsPath('io', 'creators', 'create-statement.tpl.txt')),
                    readText(promptsPath('io', 'examples', 'statement.tex')),
                    readText(promptsPath('io', 'examples', 'statement-coda.tex')),
                ])
                const ioStatementPrompt = Handlebars.compile(ioStatementPromptTemplate)({
                    language: languageNames[this.spec.original_language],
                    latexExample: ioLatexExample,
                    title: this.spec.title,
                    description: this.spec.description,
                })
                const answer = await this.bot.complete(ioStatementPrompt)
                return cleanMarkdownCodeString(answer) + statementCoda
            }
        )
    }


    async generateSampleTests(): Promise<string> {
        return await tui.section('Generating sample test cases', async () => {
            const sampleTestCasesPrompt = await readText(promptsPath('io', 'creators', 'sample-test-cases.txt'))
            const answer = await this.bot.complete(sampleTestCasesPrompt)
            return cleanMarkdownCodeString(answer)
        })
    }


    async generatePrivateTests(): Promise<string> {
        return await tui.section('Generating private test cases', async () => {
            const privateTestCasesPrompt = await readText(promptsPath('io', 'creators', 'private-test-cases.txt'))
            const answer = await this.bot.complete(privateTestCasesPrompt)
            return cleanMarkdownCodeString(answer)
        })
    }



    async generateSolutions(): Promise<Record<string, string>> {
        return await tui.section('Generating solutions', async () => {
            const ioSolutionPromptTemplate = await readText(promptsPath('io', 'creators', 'create-solution.tpl.txt'))
            const solutions: Record<string, string> = {}
            for (const proglang of this.spec.more_proglangs.concat([this.spec.golden_proglang]).reverse()) {
                await tui.section(`Generating solution in ${proglangNames[proglang]}`, async () => {
                    const proglangPrompt = await getPromptForProglang(proglang)
                    const solutionPrompt = Handlebars.compile(ioSolutionPromptTemplate)({
                        proglang: proglangNames[proglang],
                        proglangPrompt,
                    })
                    const answer = await this.bot.complete(solutionPrompt)
                    solutions[proglang] = cleanMarkdownCodeString(answer)
                    this.bot.forgetLastInteraction()
                })
            }
            return solutions
        })
    }


    async translateStatements(): Promise<Record<string, string>> {
        return await tui.section('Translating problem statements', async () => {
            const [translationPromptTemplate, statementCoda] = await Promise.all([
                readText(promptsPath('io', 'creators', 'create-translation.tpl.txt')),
                readText(promptsPath('io', 'examples', 'statement-coda.tex')),
            ])
            const translations: Record<string, string> = {}
            for (const language of this.spec.more_languages.sort()) {
                await tui.section(`Translating to ${languageNames[language]}`, async () => {
                    const translationPrompt = Handlebars.compile(translationPromptTemplate)({
                        language: languageNames[language],
                    })
                    const answer = await this.bot.complete(translationPrompt)
                    translations[language] = cleanMarkdownCodeString(answer) + statementCoda
                    this.bot.forgetLastInteraction()
                })
            }
            return translations
        })
    }


    async generateGenerators(): Promise<Record<string, string>> {
        return await tui.section('Generating test cases generators', async () => {
            const generators: Record<string, string> = {}
            for (const type of this.spec.generators) {
                await tui.section(`Generating ${type} test cases generator`, async () => {
                    const statement = this.problemStatement
                    const promptPath = join(projectDir(), 'assets', 'prompts', 'io', 'generators', `${type}.md`)
                    const promptTemplate = await readText(promptPath)
                    const prompt = Handlebars.compile(promptTemplate)({ statement })
                    const answer = cleanMarkdownCodeString(await this.bot.complete(prompt))
                    generators[type] = answer
                    this.bot.forgetLastInteraction()
                })
            }
            return generators
        })
    }


    async generateReadme(): Promise<string> {
        return tui.section('Generating README.md', async () => {
            const llmEntries: LlmUsageEntry[] = await this.jutge.instructor.jutgeai.getLlmUsage()

            const total = {
                inputTokens: 0,
                outputTokens: 0,
                duration: 0,
                priceEurTax: 0,
                wattHours: 0,
                co2Grams: 0,
                trees: 0,
                brainHours: 0,
                carKm: 0,
                waterLiters: 0,
            }
            for (const entry of llmEntries) {
                if (entry.label === this.label) {
                    const estimation = await llmEstimates(entry.input_tokens, entry.output_tokens, entry.model)
                    total.inputTokens += entry.input_tokens
                    total.outputTokens += entry.output_tokens
                    total.duration += entry.duration
                    total.priceEurTax += estimation.priceEurTax
                    total.wattHours += estimation.wattHours
                    total.co2Grams += estimation.co2Grams
                    total.trees += estimation.trees
                    total.brainHours += estimation.brainHours
                    total.carKm += estimation.carKm
                    total.waterLiters += estimation.waterLiters
                }
            }

            const readme = `
# Problem information

This programming problem for Jutge.org was generated by Jutge<sup>AI</sup> through the Jutge.org API using ${this.model} and a prompt by ${this.spec.author}.

**Warning**: This problem may contain inaccuracies or errors. Review the problem statements, test cases, and solutions carefully before using them in a real setting. Output tests and statement PDFs have not been generated, use \`jutge-make-problem\` to generate them.

## Author

${this.spec.author}

## Problem title

${this.spec.title}

## Problem description

${this.spec.description}

## Generated solutions

- ${proglangNames[this.spec.golden_proglang]} (golden solution)
${listify(this.spec.more_proglangs.map((proglang) => proglangNames[proglang]))}

## Generated languages

- ${languageNames[this.spec.original_language]} (original)
${listify(this.spec.more_languages.map((language) => languageNames[language]))}

## Generated test case generators

${listify(this.spec.generators)}

## Problem specification

\`\`\`yaml
${YAML.stringify(this.spec, null, 4)}
\`\`\`

## Audit information

Chat label: ${this.label}

## Cost of LLM usage

- Total duration:               ${dayjs.duration(total.duration * 1000).format('HH:mm:ss')} 
- Total input tokens:           ${total.inputTokens}
- Total output tokens:          ${total.outputTokens}
- Model:                        ${this.model}

## Estimated cost of LLM usage

The following items are **estimations** from token counts and used models.

- Total cost incl taxes:        ${total.priceEurTax.toFixed(6)} €
- Water usage:                  ${total.waterLiters.toFixed(6)} l
- Energy consumption:           ${total.wattHours.toFixed(6)} Wh
- CO₂ emissions:                ${total.co2Grams.toFixed(6)} g CO₂
- Equivalent trees:             ${total.trees.toFixed(6)} trees
- Equivalent human brain time:  ${dayjs.duration(total.brainHours * 1000 * 3600).format('HH:mm:ss')} 
- Equivalent car distance:      ${total.carKm.toFixed(6)} km

`
            return readme
        })
    }


    async save(path: string): Promise<void> {
        await tui.section(`Saving problem to ${path}`, async () => {
            await mkdir(path, { recursive: true })
            await writeTextInDir(path, `problem.${this.spec.original_language}.tex`, this.problemStatement)

            const yml = {
                title: this.spec.title,
                author: this.spec.author,
                email: this.spec.email,
                model: this.model,
            }
            await writeYamlInDir(path, `problem.${this.spec.original_language}.yml`, yml)

            for (const [lang, translation] of Object.entries(this.problemMoreStatements)) {
                await writeTextInDir(path, `problem.${lang}.tex`, translation)
                const yml = {
                    title: getTitleFromStatement(translation) || this.spec.title,
                    translator: this.spec.author,
                    translator_email: this.spec.email,
                    original_language: this.spec.original_language,
                    model: this.model,
                }
                await writeYamlInDir(path, `problem.${lang}.yml`, yml)
            }

            await writeTextInDir(path, 'sample-1.inp', this.problemSampleTests1)
            await writeTextInDir(path, 'sample-2.inp', this.problemSampleTests2)

            await writeTextInDir(path, 'test-1.inp', this.problemPrivateTests1)
            await writeTextInDir(path, 'test-2.inp', this.problemPrivateTests2)

            for (const [proglang, solution] of Object.entries(this.problemMoreSolutions)) {
                const ext = proglang
                await writeTextInDir(path, `solution.${ext}`, solution)
            }

            for (const [type, code] of Object.entries(this.problemGenerators)) {
                await writeTextInDir(path, `generate-${type}.py`, code)
            }

            const handlerYml: any = {
                handler: 'std',
                solution: proglangNames[this.spec.golden_proglang],
            }
            await writeYamlInDir(path, 'handler.yml', handlerYml)

            await writeTextInDir(path, 'README.md', this.problemReadme)
        })
    }
}


async function getPromptForProglang(proglang: string): Promise<string> {
    const location = join(projectDir(), 'assets', 'prompts', 'io', 'proglangs', `${proglang}.md`)
    if (await exists(location)) {
        return await readText(location)
    } else {
        tui.warning(`Prompt for ${proglang} not found at ${location}`)
        return ''
    }
}