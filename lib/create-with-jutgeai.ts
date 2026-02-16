import * as prompts from '@inquirer/prompts'
import { exists, mkdir } from 'fs/promises'
import Handlebars from 'handlebars'
import checkboxPlus from 'inquirer-checkbox-plus-plus'
import { join } from 'path'
import tree from 'tree-node-cli'
import YAML from 'yaml'
import { ChatBot, cleanMardownCodeString, llmEstimates } from './aiclient'
import { languageNames, proglangNames } from './data'
import { getPromptForProglang, getTitleFromStatement } from './helpers'
import type { JutgeApiClient, LlmUsageEntry } from './jutge_api_client'
import { settings } from './settings'
import tui from './tui'
import { Specification } from './types'
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

interface CreatorPrompts {
    latexExample: string
    statementCoda: string
    systemPrompt: string
    statementPromptTemplate: string
    translationPromptTemplate: string
    solutionPromptTemplate: string
    sampleTestCasesPrompt: string
    privateTestCasesPrompt: string
}

let promptsCache: CreatorPrompts | null = null

async function loadPrompts(): Promise<CreatorPrompts> {
    if (promptsCache) return promptsCache
    const dir = join(projectDir(), 'assets', 'prompts')
    promptsCache = {
        latexExample: await readText(join(dir, 'examples', 'statement.tex')),
        statementCoda: await readText(join(dir, 'examples', 'statement-coda.tex')),
        systemPrompt: await readText(join(dir, 'creators', 'system-prompt.txt')),
        statementPromptTemplate: await readText(join(dir, 'creators', 'create-statement.tpl.txt')),
        translationPromptTemplate: await readText(join(dir, 'creators', 'create-translation.tpl.txt')),
        solutionPromptTemplate: await readText(join(dir, 'creators', 'create-solution.tpl.txt')),
        sampleTestCasesPrompt: await readText(join(dir, 'creators', 'sample-test-cases.txt')),
        privateTestCasesPrompt: await readText(join(dir, 'creators', 'private-test-cases.txt')),
    }
    return promptsCache
}

export async function createProblemWithJutgeAI(
    jutge: JutgeApiClient,
    model: string,
    directory: string,
    inputPath: string | undefined,
    outputPath: string | undefined,
    doNotAsk: boolean,
) {
    if (await exists(directory)) {
        throw new Error(`Directory ${directory} already exists`)
    }
    if (!directory.endsWith('.pbm')) {
        throw new Error('The output directory must end with .pbm')
    }

    const spec = await getSpecification(inputPath, outputPath, doNotAsk)
    const creatorPrompts = await loadPrompts()
    const generator = new ProblemGenerator(spec, jutge, model, directory, creatorPrompts)
    await generator.run()
    await generator.save(directory)
    await createGitIgnoreFile(directory)
    const readme = await readTextInDir(directory, 'README.md')
    await tui.markdown(readme)
    const treeFiles = tree(directory, { allFiles: true, dirsFirst: false })
    tui.print(treeFiles)
    tui.success(`Created problem ${tui.hyperlink(directory)}`)
}

async function getSpecification(
    inputPath: string | undefined,
    outputPath: string | undefined,
    doNotAsk: boolean,
): Promise<Specification> {
    let spec: Specification
    if (inputPath) {
        let data: any
        spec = await tui.section(`Reading specification from ${inputPath}`, async () => {
            data = await readYaml(inputPath)
            return Specification.parse(data)
        })
        tui.yaml(spec)
    } else {
        doNotAsk = true
        spec = {
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
    }

    if (inputPath && doNotAsk) {
        return spec
    }

    while (true) {
        spec.title = await prompts.input({ message: 'Title:', default: spec.title, prefill: 'editable' })

        spec.description = await prompts.input({
            message: 'Description:',
            default: spec.description,
            prefill: 'editable',
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

    if (outputPath) {
        await writeYaml(outputPath, spec)
        tui.success(`Specification file written at ${tui.hyperlink(outputPath)}`)
    }

    return spec
}

class ProblemGenerator {
    private model: string
    private spec: Specification
    private bot: ChatBot
    private jutge: JutgeApiClient
    private label: string
    private dir: string
    private prompts: CreatorPrompts

    // generated problem parts
    private problemStatement: string = ''
    private problemMoreStatements: Record<string, string> = {}
    private problemMoreSolutions: Record<string, string> = {}
    private problemGenerators: Record<string, string> = {}
    private problemSampleTests1: string = ''
    private problemSampleTests2: string = ''
    private problemPrivateTests1: string = ''
    private problemPrivateTests2: string = ''
    private problemReadme: string = ''

    constructor(info: Specification, jutge: JutgeApiClient, model: string, dir: string, prompts: CreatorPrompts) {
        this.jutge = jutge
        this.model = model
        this.spec = info
        this.label = `create-problem-${nanoid12()}`
        this.prompts = prompts
        this.bot = new ChatBot(jutge, model, this.label, prompts.systemPrompt)
        this.dir = dir
    }

    async generateStatement(): Promise<string> {
        tui.print(`Chat label: ${this.label}`)
        return await tui.section(
            `Generating problem statement in ${languageNames[this.spec.original_language]}`,
            async () => {
                const statementPrompt = Handlebars.compile(this.prompts.statementPromptTemplate)({
                    language: languageNames[this.spec.original_language],
                    latexExample: this.prompts.latexExample,
                    title: this.spec.title,
                    description: this.spec.description,
                })
                const answer = await this.bot.complete(statementPrompt)
                return cleanMardownCodeString(answer) + this.prompts.statementCoda
            },
        )
    }

    async generateSampleTests(): Promise<string> {
        return await tui.section('Generating sample test cases', async () => {
            const answer = await this.bot.complete(this.prompts.sampleTestCasesPrompt)
            return cleanMardownCodeString(answer)
        })
    }

    async generatePrivateTests(): Promise<string> {
        return await tui.section('Generating private test cases', async () => {
            const answer = await this.bot.complete(this.prompts.privateTestCasesPrompt)
            return cleanMardownCodeString(answer)
        })
    }

    async generateSolutions(): Promise<Record<string, string>> {
        return await tui.section('Generating solutions', async () => {
            const solutions: Record<string, string> = {}
            for (const proglang of this.spec.more_proglangs.concat([this.spec.golden_proglang]).reverse()) {
                await tui.section(`Generating solution in ${proglangNames[proglang]}`, async () => {
                    const proglangPrompt = await getPromptForProglang(proglang)
                    const solutionPrompt = Handlebars.compile(this.prompts.solutionPromptTemplate)({
                        proglang: proglangNames[proglang],
                        proglangPrompt,
                    })
                    const answer = await this.bot.complete(solutionPrompt)
                    solutions[proglang] = cleanMardownCodeString(answer)
                    this.bot.forgetLastInteraction()
                })
            }
            return solutions
        })
    }

    async translateStatements(): Promise<Record<string, string>> {
        return await tui.section('Translating problem statements', async () => {
            const translations: Record<string, string> = {}
            for (const language of this.spec.more_languages.sort()) {
                await tui.section(`Translating to ${languageNames[language]}`, async () => {
                    const translationPrompt = Handlebars.compile(this.prompts.translationPromptTemplate)({
                        language: languageNames[language],
                    })
                    const answer = await this.bot.complete(translationPrompt)
                    translations[language] = cleanMardownCodeString(answer) + this.prompts.statementCoda
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
                    const promptPath = join(projectDir(), 'assets', 'prompts', 'generators', `${type}.md`)
                    const promptTemplate = await readText(promptPath)
                    const prompt = Handlebars.compile(promptTemplate)({ statement })
                    const answer = cleanMardownCodeString(await this.bot.complete(prompt))
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

The following informations are **estimations** from token counts and used models.

- Total cost incl taxes:        ${total.priceEurTax.toFixed(6)} €
- Water usage:                  ${total.waterLiters.toFixed(6)} l
- Energ consumption:            ${total.wattHours.toFixed(6)} Wh
- CO₂ emissions:                ${total.co2Grams.toFixed(6)} g CO₂
- Equivalent trees:             ${total.trees.toFixed(6)} trees
- Equivalent human brain time:  ${dayjs.duration(total.brainHours * 1000 * 3600).format('HH:mm:ss')} 
- Equivalent car distance:      ${total.carKm.toFixed(6)} km

`
            return readme
        })
    }

    async run() {
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
    }

    async save(path: string) {
        await tui.section(`Saving problem to ${path}`, async () => {
            await mkdir(path, { recursive: true })
            await writeTextInDir(path, 'problem.en.tex', this.problemStatement)

            const yml = {
                title: this.spec.title,
                author: this.spec.author,
                email: this.spec.email,
                model: this.model,
            }
            await writeYamlInDir(path, 'problem.en.yml', yml)

            for (const [lang, translation] of Object.entries(this.problemMoreStatements)) {
                await writeTextInDir(path, `problem.${lang}.tex`, translation)
                const yml = {
                    title: getTitleFromStatement(translation) || this.spec.title,
                    translator: this.spec.author,
                    translator_email: this.spec.email,
                    original_language: 'en',
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

function listify(items: (string | undefined)[]): string {
    if (items.length === 0) {
        return '<none>'
    }
    return items.map((item) => `- ${item}`).join('\n')
}
