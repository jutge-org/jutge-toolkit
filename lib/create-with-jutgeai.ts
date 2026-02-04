import * as prompts from '@inquirer/prompts'
import { exists, mkdir } from 'fs/promises'
import Handlebars from 'handlebars'
import checkboxPlus from 'inquirer-checkbox-plus-plus'
import { join } from 'path'
import YAML from 'yaml'
import { ChatBot, cleanMardownCodeString, estimatePowerConsumption } from './aiclient'
import { languageNames, proglangNames } from './data'
import type { JutgeApiClient } from './jutge_api_client'
import { getPromptForProglang, getTitleFromStatement } from './helpers'
import { settings } from './settings'
import tui from './tui'
import { Specification } from './types'
import {
    createGitIgnoreFile,
    nothing,
    projectDir,
    readText,
    readYaml,
    writeTextInDir,
    writeYaml,
    writeYamlInDir,
} from './utils'
import tree from 'tree-node-cli'

const promptsDir = join(projectDir(), 'assets', 'prompts')

// TODO: make dynamic to speed up loading times
const latexExample = await readText(join(promptsDir, 'examples', 'statement.tex'))
const statementCoda = await readText(join(promptsDir, 'examples', 'statement-coda.tex'))
const systemPrompt = await readText(join(promptsDir, 'creators', 'system-prompt.txt'))
const statementPromptTemplate = await readText(join(promptsDir, 'creators', 'create-statement.tpl.txt'))
const translationPromptTemplate = await readText(join(promptsDir, 'creators', 'create-translation.tpl.txt'))
const solutionPromptTemplate = await readText(join(promptsDir, 'creators', 'create-solution.tpl.txt'))
const sampleTestCasesPrompt = await readText(join(promptsDir, 'creators', 'sample-test-cases.txt'))
const privateTestCasesPrompt = await readText(join(promptsDir, 'creators', 'private-test-cases.txt'))

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
    const generator = new ProblemGenerator(spec, jutge, model)
    await generator.run()
    await generator.save(directory)
    await createGitIgnoreFile(directory)
    tui.success(`Created problem ${tui.hyperlink(directory)}`)
    const treeFiles = tree(directory, { allFiles: true, dirsFirst: false })
    tui.print(treeFiles)
    tui.warning(`Estimated cost: 0.11 €`)
    tui.warning(`Estimated emissions: 0.000001 g CO₂`)
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

    constructor(info: Specification, jutge: JutgeApiClient, model: string) {
        this.model = model
        this.spec = info
        this.bot = new ChatBot(jutge, model, systemPrompt)
    }

    async generateStatement(): Promise<string> {
        return await tui.section(
            `Generating problem statement in ${languageNames[this.spec.original_language]}`,
            async () => {
                const statementPrompt = Handlebars.compile(statementPromptTemplate)({
                    language: languageNames[this.spec.original_language],
                    latexExample,
                    title: this.spec.title,
                    description: this.spec.description,
                })
                const answer = await this.bot.complete(statementPrompt)
                return cleanMardownCodeString(answer) + statementCoda
            },
        )
    }

    async generateSampleTests(): Promise<string> {
        return await tui.section('Generating sample test cases', async () => {
            const answer = await this.bot.complete(sampleTestCasesPrompt)
            return cleanMardownCodeString(answer)
        })
    }

    async generatePrivateTests(): Promise<string> {
        return await tui.section('Generating private test cases', async () => {
            const answer = await this.bot.complete(privateTestCasesPrompt)
            return cleanMardownCodeString(answer)
        })
    }

    async generateSolutions(): Promise<Record<string, string>> {
        return await tui.section('Generating solutions', async () => {
            const solutions: Record<string, string> = {}
            for (const proglang of this.spec.more_proglangs.concat([this.spec.golden_proglang]).reverse()) {
                await tui.section(`Generating solution in ${proglangNames[proglang]}`, async () => {
                    const proglangPrompt = await getPromptForProglang(proglang)
                    const solutionPrompt = Handlebars.compile(solutionPromptTemplate)({
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
                    const translationPrompt = Handlebars.compile(translationPromptTemplate)({
                        language: languageNames[language],
                    })
                    const answer = await this.bot.complete(translationPrompt)
                    translations[language] = cleanMardownCodeString(answer) + statementCoda
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
            await nothing()
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

## Model information

Model name: ${this.model}

## Estimated cost

TODO!

The following information is based on estimations from token counts and do not reflect the actual costs incurred. Using GPT-5 pricing as reference.

- Total input tokens:   ${this.bot.totalInputTokens}
- Total output tokens:  ${this.bot.totalOutputTokens}
- Total input cost:     ${this.bot.totalInputCost.toFixed(6)} USD
- Total output cost:    ${this.bot.totalOutputCost.toFixed(6)} USD
- Total estimated cost: ${(this.bot.totalInputCost + this.bot.totalOutputCost).toFixed(6)} USD
- Energy:               ${estimatePowerConsumption(this.bot.totalInputTokens, this.bot.totalOutputTokens).wattHours.toFixed(6)} Wh
- CO₂ emissions:        ${estimatePowerConsumption(this.bot.totalInputTokens, this.bot.totalOutputTokens).co2Grams.toFixed(6)} g CO₂

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
