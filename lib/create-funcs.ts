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
    nothing,
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
import { all } from 'radash'
import type { Scores } from './types'

dayjs.extend(duration)

// *******************************************************************************************************************
// exported main function
// *******************************************************************************************************************

export async function createFuncsProblem(
    jutge: JutgeApiClient,
    model: string,
    directory: string,
    inputPath: string | undefined,
    outputPath: string | undefined,
    doNotAsk: boolean,
) {
    const generator = new FuncsProblemGenerator({
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

const FuncsSpecification = z.object({
    title: z.string(),
    description: z.string(),
    specification: z.string(),
    author: z.string().default('Unknown'),
    email: z.string().default('unknown'),
    golden_proglang: z.string(),
    original_language: z.string(),
    more_languages: z.array(z.string()),
})

type FuncsSpecification = z.infer<typeof FuncsSpecification>

class FuncsProblemGenerator {
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
    proglang: string = ''
    problemStatement: string = ''
    problemMoreStatements: Record<string, string> = {}
    problemReadme: string = ''
    functions: string[] = []
    problemSampleTests: string = ''
    problemPrivateTests: Record<string, string> = {}
    problemSampleDt: string = ''
    solution: string = ''
    scores: Scores | undefined = undefined

    spec!: FuncsSpecification

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

    private async loadSpecificationCore<T>(options: {
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
        this.proglang = proglangNames[this.spec.golden_proglang]!
        if (this.proglang === 'GHC') this.proglang = 'Haskell' // hack

        await tui.section(`Generating problem with JutgeAI using ${this.model}`, async () => {
            this.functions = await this.generateFunctions()
            this.problemStatement = await this.generateStatement()
            await tui.section(`Generating testcases`, async () => {
                this.problemSampleTests = await this.generateSampleTests()
                this.problemPrivateTests = await this.generatePrivateTests()
            })
            if (this.proglang === 'Python3') {
                this.problemSampleDt = await this.generateSampleDt()
            }
            this.solution = await this.generateSolution() // forgotten inside
            this.problemMoreStatements = await this.generateTranslations()
            this.scores = await this.generateScores()
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

    async loadSpecification(): Promise<FuncsSpecification> {
        return this.loadSpecificationCore<FuncsSpecification>({
            loadOrCreateDefault: async () => {
                if (this.inputPath) {
                    const spec = await tui.section(`Reading specification from ${this.inputPath}`, async () =>
                        FuncsSpecification.parse(await readYaml(this.inputPath!)),
                    )
                    tui.yaml(spec)
                    return spec
                }
                this.doNotAsk = true
                return {
                    title: 'Your problem title',
                    description: 'Describe the problem here. Do not describe the functions yet.',
                    specification: 'Specify the functions of the problem here.',
                    author: settings.name || 'Your Name',
                    email: settings.email || 'email@example.com',
                    golden_proglang: 'py',
                    original_language: 'en',
                    more_languages: ['ca', 'es'],
                }
            },
            editSpec: async (spec) => {
                spec.title = await prompts.input({ message: 'Title:', default: spec.title, prefill: 'editable' })
                spec.description = await prompts.editor({
                    message: 'Theme:',
                    default: spec.description,
                    postfix: '.md',
                    waitForUserInput: false,
                })
                spec.specification = await prompts.editor({
                    message: 'Functions:',
                    default: spec.specification,
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
                    message: `Programming language:`,
                    choices: [
                        { value: 'py', name: 'Python' },
                        { value: 'hs', name: 'Haskell' },
                        { value: 'clj', name: 'Clojure' },
                    ],
                    default: spec.golden_proglang,
                })
            },
        })
    }

    async generateFunctions(): Promise<string[]> {
        return await tui.section('Extracting function names from specification', async () => {
            const prompt = `
                Extract the function names from the following specification.
                Only extract the function names, do not extract the function definitions, or signatures, or docstrings.
                Each function name should be on a separate line.
                Do not use markdown code blocks or markdown code fences.
            `
            const result = await complete(this.jutge, this.model, this.label, prompt, this.spec.specification)
            const functions = result
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            tui.yaml(functions)
            return functions
        })
    }

    async generateStatement(): Promise<string> {
        tui.print(`Chat label: ${this.label}`)
        return await tui.section(
            `Generating problem statement in ${languageNames[this.spec.original_language]}`,
            async () => {
                const [statementPromptTemplate, latexExample, statementCoda] = await all([
                    readText(promptsPath('funcs', 'creators', 'create-statement.tpl.txt')),
                    readText(promptsPath('funcs', 'examples', 'statement.tex')),
                    readText(promptsPath('funcs', 'examples', 'statement-coda.tex')),
                ])
                const funcsStatementPrompt = Handlebars.compile(statementPromptTemplate)({
                    language: languageNames[this.spec.original_language],
                    proglang: this.proglang,
                    latexExample,
                    title: this.spec.title,
                    theme: this.spec.description,
                    functions: this.spec.specification,
                })
                const answer = await this.bot.complete(funcsStatementPrompt)
                return cleanMarkdownCodeString(answer) + statementCoda.replace('\\Sample', '')
            },
        )
    }

    async generateTranslations(): Promise<Record<string, string>> {
        return await tui.section(`Translating statements`, async () => {
            const translations: Record<string, string> = {}
            for (const language of this.spec.more_languages.sort()) {
                await tui.section(`Translating to ${languageNames[language]}`, async () => {
                    const prompt = `
                            Translate the given problem statement to ${languageNames[language]}.

                            The translation must be accurate and use proper technical terminology.
                            Maintain the LaTeX formatting and macros.
                            The identifiers of functions and variables should not be translated.
                        `
                    const translation = cleanMarkdownCodeString(
                        await complete(this.jutge, this.model, this.label, prompt, this.problemStatement),
                    )

                    translations[language] = translation
                })
            }
            return translations
        })
    }

    async generateSampleTests(): Promise<string> {
        return await tui.section('Generating sample test cases', async () => {
            const sampleTestCasesPromptTemplate = await readText(
                promptsPath('funcs', 'creators', 'sample-test-cases.tpl.txt'),
            )
            const sampleTestCasesPrompt = Handlebars.compile(sampleTestCasesPromptTemplate)({
                functions: this.functions.join(', '),
                proglang: this.proglang,
            })
            const answer = await this.bot.complete(sampleTestCasesPrompt)
            return cleanMarkdownCodeString(answer)
        })
    }

    async generateSampleDt(): Promise<string> {
        return await tui.section('Generating sample.dt', async () => {
            const sampleDtPromptTemplate = await readText(promptsPath('funcs', 'creators', 'sample.dt.tpl.txt'))
            const sampleDtPrompt = Handlebars.compile(sampleDtPromptTemplate)({
                sampleTests: this.problemSampleTests,
            })
            const answer = await this.bot.complete(sampleDtPrompt)
            this.bot.forgetLastInteraction()
            return cleanMarkdownCodeString(answer)
        })
    }

    async generatePrivateTests(): Promise<Record<string, string>> {
        const privateTestCasesPromptTemplate = await readText(
            promptsPath('funcs', 'creators', 'private-test-cases.tpl.txt'),
        )
        const tests: Record<string, string> = {}
        return await tui.section('Generating private test cases', async () => {
            for (const func of this.functions) {
                await tui.section(`Generating private test case for ${func}`, async () => {
                    const privateTestCasesPrompt = Handlebars.compile(privateTestCasesPromptTemplate)({
                        function: func,
                        proglang: this.proglang,
                    })
                    const answer = await this.bot.complete(privateTestCasesPrompt)
                    tests[func] = cleanMarkdownCodeString(answer)
                })
            }
            return tests
        })
    }

    async generateSolution(): Promise<string> {
        const proglang = proglangNames[this.spec.golden_proglang]
        return await tui.section(`Generating solution in ${proglang}`, async () => {
            const [solutionPromptTemplate, proglangPrompt] = await Promise.all([
                readText(promptsPath('funcs', 'creators', 'create-solution.tpl.txt')),
                getPromptForProglang(this.spec.golden_proglang),
            ])
            const solutionPrompt = Handlebars.compile(solutionPromptTemplate)({
                proglang: proglang,
                functions: this.functions.join(', '),
                proglangPrompt,
            })
            const answer = await this.bot.complete(solutionPrompt)
            this.bot.forgetLastInteraction()
            return cleanMarkdownCodeString(answer)
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

## Problem specification

${this.spec.specification}

## Functions

${listify(this.functions)}

## Generated solutions

- ${proglangNames[this.spec.golden_proglang]} (golden solution)

## Generated languages

- ${languageNames[this.spec.original_language]} (original)
${listify(this.spec.more_languages.map((language) => languageNames[language]))}

## Scores YAML

\`\`\`yaml
${YAML.stringify(this.scores || 'None', null, 4)}
\`\`\`

## Problem specification YAML

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

    async generateScores(): Promise<Scores | undefined> {
        if (this.functions.length <= 1) return undefined
        return await tui.section('Generating scores', async () => {
            await nothing()
            const scores: Scores = []
            for (const func of this.functions) {
                scores.push({
                    part: func,
                    prefix: `test-${func}`,
                    points: 10,
                })
            }
            scores.push({
                part: 'samples',
                prefix: 'sample',
                points: 10,
            })
            return scores
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

            await writeTextInDir(path, `solution.${this.spec.golden_proglang}`, this.solution)

            await writeTextInDir(path, 'sample.inp', this.problemSampleTests)

            for (const [func, test] of Object.entries(this.problemPrivateTests)) {
                await writeTextInDir(path, `test-${func}.inp`, test)
            }

            if (this.scores) {
                await writeYamlInDir(path, 'scores.yml', this.scores)
            }

            if (this.proglang === 'Python3') {
                await writeTextInDir(path, 'sample.dt', this.problemSampleDt)
            }

            const compilers: Record<string, string> = {
                py: 'RunPython',
                hs: 'RunHaskell',
                clj: 'RunClojure',
            }

            const handlerYml: any = {
                handler: 'std',
                compilers: compilers[this.spec.golden_proglang],
            }
            await writeYamlInDir(path, 'handler.yml', handlerYml)

            await writeTextInDir(path, 'README.md', this.problemReadme)
        })
    }
}

async function getPromptForProglang(proglang: string): Promise<string> {
    const location = join(projectDir(), 'assets', 'prompts', 'funcs', 'proglangs', `${proglang}.md`)
    if (await exists(location)) {
        return await readText(location)
    } else {
        tui.warning(`Prompt for ${proglang} not found at ${location}`)
        return ''
    }
}
