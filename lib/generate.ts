import { exists } from 'fs/promises'
import Handlebars from 'handlebars'
import { join } from 'path'
import { cleanMardownCodeString, complete } from './aiclient'
import { languageKeys, languageNames, proglangExtensions, proglangKeys, proglangNames } from './data'
import { getPromptForProglang, getTitleFromStatement } from './helpers'
import type { JutgeApiClient } from './jutge_api_client'
import type { Problem } from './problem'
import { settings } from './settings'
import tui from './tui'
import { projectDir, readText, readTextInDir, stripLaTeX, writeTextInDir, writeYamlInDir } from './utils'

export async function generateStatementFromSolution(
    jutge: JutgeApiClient,
    model: string,
    problem: Problem,
    proglang: string,
    language: string,
    userPrompt?: string,
) {
    if (!proglangKeys.includes(proglang)) {
        throw new Error(`Programming language ${proglang} is not supported`)
    }
    if (!languageKeys.includes(language)) {
        throw new Error(`Language ${language} is not supported`)
    }
    const solutionFile = `solution.${proglang}`
    if (!problem.solutions.includes(solutionFile)) {
        throw new Error(`Solution ${solutionFile} not found in problem`)
    }

    const solutionSource = await readTextInDir(problem.directory, solutionFile)
    const latexExample = await readText(join(projectDir(), 'assets', 'prompts', 'examples', 'statement.tex'))
    const statementCoda = await readText(join(projectDir(), 'assets', 'prompts', 'examples', 'statement-coda.tex'))
    const userPromptTemplate = await readText(
        join(projectDir(), 'assets', 'prompts', 'creators', 'create-statement-from-solution.tpl.txt'),
    )

    const langName = languageNames[language]
    const proglangName = proglangNames[proglang]

    const systemPrompt = `You write the statement of a programming problem in ${langName}.

The statement must be written in LaTeX, using these predefined macros: \\Problem{title}, \\Statement, \\Input, \\Output, \\Observation, \\Sample.
Use LaTeX math syntax for formulas and variables. Use dollars for inline maths and \\[ and \\] for display maths.
Do not add input/output test cases in the statement. Separate paragraphs by a blank line and \\medskip macro.
Write in the style of programming contests like the ACM ICPC or Jutge.org.
Output only the LaTeX statement, no markdown code fence or explanation.

Here is an example of the structure and macros to follow:

${latexExample}`

    const userPromptText = Handlebars.compile(userPromptTemplate)({
        langName,
        userPrompt: userPrompt ?? '',
        proglangName,
        solutionSource,
    })

    await tui.section(`Generating statement in ${langName} from ${solutionFile}`, async () => {
        const answer = cleanMardownCodeString(
            await complete(jutge, model, 'generate-statement-from-solution', systemPrompt, userPromptText),
        )
        const statement = answer + statementCoda
        await writeTextInDir(problem.directory, `problem.${language}.tex`, statement)
        tui.success(`Created problem.${language}.tex`)
        tui.warning('Please review the generated statement')
    })
}

export async function addStatementTranslation(jutge: JutgeApiClient, model: string, problem: Problem, language: string) {
    const original = problem.originalLanguage

    if (!original) {
        throw new Error('Original language not set, cannot generate translations')
    }
    if (language === original) {
        throw new Error(`Language ${language} is the original language`)
    }
    if (problem.languages.includes(language)) {
        throw new Error(`Language ${language} already exists`)
    }
    if (!languageKeys.includes(language)) {
        throw new Error(`Language ${language} is not supported`)
    }

    const statememt = await readTextInDir(problem.directory, `problem.${original}.tex`)

    await tui.section(`Translating from ${languageNames[original]} to ${languageNames[language]}`, async () => {
        const prompt = `
Translate the given problem statement to ${languageNames[language]}.

The translation must be accurate and use proper technical terminology.
Maintain the LaTeX formatting and macros.
The texts that the program must read and write should not be translated.
    `

        const answer = cleanMardownCodeString(await complete(jutge, model, "add-statement-translation", prompt, statememt))

        const info = {
            title: getTitleFromStatement(answer) || 'Error translating title',
            translator: settings.name,
            translator_email: settings.email,
            model,
        }
        await writeTextInDir(problem.directory, `problem.${language}.tex`, answer)
        await writeYamlInDir(problem.directory, `problem.${language}.yml`, info)

        tui.success(`Translation completed: files problem.${language}.tex and problem.${language}.yml created`)
        tui.warning(`Please review the generated translation`)
    })
}

export async function addAlternativeSolution(jutge: JutgeApiClient, model: string, problem: Problem, extension: string) {
    if (!problem.goldenSolution) {
        throw new Error('No golden solution defined')
    }
    const originalExtension = problem.goldenSolution.split('.').pop()
    if (!originalExtension) {
        throw new Error('Invalid golden solution filename')
    }
    if (!proglangKeys.includes(extension)) {
        throw new Error(`Extension ${extension} is not supported`)
    }
    if (problem.solutions.includes(`solution.${extension}`)) {
        throw new Error(`Solution already exists`)
    }
    const proglang = proglangNames[extension]

    if (!proglang) {
        throw new Error(`Programming language for extension ${extension} not found`)
    }

    const originalProglang = proglangNames[originalExtension]

    const goldenSource = await readTextInDir(problem.directory, problem.goldenSolution)

    const proglangPrompt = await getPromptForProglang(proglang)

    const prompt = `
Convert the given program in ${originalProglang} to ${proglang}.

The translation must be accurate and follow the structure and logic of the original program.
Each function should have a documentation comment explaining its purpose, parameters, and return values.

If some function in the original program is not defined, do not define it in the translated program either.

Your program should start with a comment line saying 'Generated by ${model}'.

${proglangPrompt}
    `

    const answer = cleanMardownCodeString(await complete(jutge, model, "add-alternative-solution", prompt, goldenSource))

    await writeTextInDir(problem.directory, `solution.${extension}`, answer)

    tui.success(`solution.${extension} created`)
    tui.warning(`Please review the generated solution`)
}

// TODO: check this function
export async function addMainFile(jutge: JutgeApiClient, model: string, problem: Problem, proglang: string) {
    if (!problem.goldenSolution) {
        throw new Error('No golden solution defined')
    }

    const originalExtension = problem.goldenSolution.split('.').pop()
    if (!originalExtension) {
        throw new Error('Invalid golden solution filename')
    }
    const originalProglang = proglangNames[originalExtension]

    const goldenSource = await readTextInDir(problem.directory, `main.${originalExtension}`)

    await tui.section(`Converting main.${originalExtension} to ${proglang}`, async () => {
        const proglangPrompt = await getPromptForProglang(proglang)

        const prompt = `
Convert the given program in ${originalProglang} to ${proglang}.

The translation must be accurate and follow the structure and logic of the original program.

If some function in the original program is not defined, do not define it in the translated program either.

Your program should start with a comment line saying 'Generated by ${model}'.

${proglangPrompt}
    `

        const answer = cleanMardownCodeString(await complete(jutge, model, "add-main-file", prompt, goldenSource))

        await writeTextInDir(problem.directory, `main.${proglangExtensions[proglang]}`, answer)

        tui.success(`main.${proglang} created`)
        tui.warning(`Please review the generated file`)
    })
}

export async function generateTestCasesGenerator(
    jutge: JutgeApiClient,
    model: string,
    problem: Problem,
    output: string, // file to create (template with {{type}})
    type: 'random' | 'hard' | 'efficiency',
) {
    const outputPath = Handlebars.compile(output)({ type })
    await tui.section(`Generating test cases generator ${outputPath}`, async () => {
        const statement = await getStatementAsText(problem)
        const promptPath = join(projectDir(), 'assets', 'prompts', 'generators', `${type}.md`)
        const promptTemplate = await readText(promptPath)
        const prompt = Handlebars.compile(promptTemplate)({ statement })
        const answer = cleanMardownCodeString(await complete(jutge, model, "generate-test-cases-generator", prompt, prompt))
        await writeTextInDir(problem.directory, outputPath, answer)
        tui.success(`Test cases generator ${outputPath} generated`)
        tui.warning(`Please review the generated test cases generator`)
    })
}

// TODO: move into problem?
export async function getStatementAsText(problem: Problem): Promise<string> {
    const original = problem.originalLanguage
    if (!original) throw new Error('Original language not set')
    if (await exists(join(problem.directory, `problem.${original}.txt`))) {
        const text = await readTextInDir(problem.directory, `problem.${original}.txt`)
        return text
    } else {
        const latex = await readTextInDir(problem.directory, `problem.${original}.tex`)
        const text = stripLaTeX(latex)
        return text
    }
}
