import { execa } from 'execa'
import path from 'node:path'
import { shuffle } from 'radash'
import type { z } from 'zod'
import { ZodError } from 'zod'
import { fromError } from 'zod-validation-error'
import tui from './tui'
import { QuizFillInItem, QuizRoot, QuizRootQuestion, QuizzFillIn, QuizzMatching, QuizzMultipleChoice, QuizzOpenQuestion, QuizzOrdering, QuizzQuestion, QuizzSingleChoice } from './types'
import { existsInDir, projectDir, readTextInDir, readYamlInDir } from './utils'

/** Output shape for a single question in a quiz run. */
export interface QuizQuestionOutput {
    title: string
    file: string
    score: number
    points: number
    question: QuizzQuestion
    answer: Record<string, unknown>
}

/** Output shape of runQuiz (serialized as JSON/YAML). */
export interface QuizRunOutput {
    title: string
    statement: string
    shuffle: boolean
    seed: number
    'time-generation': string
    questions: QuizQuestionOutput[]
}

function assertNever(value: never): never {
    throw new Error(`Unknown question type: ${String(value)}`)
}

/**
 * Lints a YAML file in the given directory with the given Zod schema.
 * Reports validation errors via tui and does not throw.
 */
async function lintYamlInDir<T>(
    directory: string,
    filename: string,
    schema: z.ZodType<T>,
): Promise<T | null> {
    try {
        const data = await readYamlInDir(directory, filename)
        const parsed = schema.parse(data)
        tui.success(`${filename} seems valid`)
        return parsed
    } catch (error) {
        if (error instanceof Error) {
            if (error instanceof ZodError) {
                tui.error(fromError(error).toString())
            } else {
                tui.error(error.message)
            }
        } else {
            tui.error(String(error))
        }
        return null
    }
}

/**
 * Lints the quiz root (quiz.yml) and all question YAML files in the given directory.
 */
export async function lintQuiz(directory: string): Promise<void> {
    let quizRoot: QuizRoot | null = null
    await tui.section(`Linting ${tui.hyperlink(directory, 'quiz.yml')}`, async () => {
        quizRoot = await lintYamlInDir(directory, 'quiz.yml', QuizRoot)

        for (const question of quizRoot?.questions ?? []) {
            const file = `${question.file}.yml`
            await tui.section(`Linting ${tui.hyperlink(directory, file)}`, async () => {
                await lintYamlInDir(directory, file, QuizzQuestion)
            })
        }
    })
}

/**
 * Shuffle uses the global RNG (radash/shuffle), so question order is not reproducible for a given seed.
 * Reproducible ordering would require a seeded RNG passed into shuffle.
 */

/**
 * Loads and runs a quiz from the given directory with the given seed.
 * Parses quiz.yml, optionally shuffles questions, and builds each question with variable substitution.
 *
 * @param directory - Path to the quiz directory (containing quiz.yml and question files).
 * @param seed - Random seed for Python variable generation and (if implemented) reproducible shuffle.
 * @returns The quiz run output (title, statement, questions with substituted variables).
 * @throws If quiz.yml is missing or invalid, or if a question file is missing.
 */
export async function runQuiz(directory: string, seed: number): Promise<QuizRunOutput> {
    if (!(await existsInDir(directory, 'quiz.yml'))) {
        throw new Error(`File quiz.yml not found in ${directory}`)
    }
    const quizData = await readYamlInDir(directory, 'quiz.yml')
    const quiz = QuizRoot.parse(quizData)
    if (quiz.shuffle) {
        shuffle(quiz.questions)
    }
    const output: QuizRunOutput = {
        title: quiz.title,
        statement: quiz.statement,
        shuffle: quiz.shuffle,
        seed,
        'time-generation': new Date().toISOString(),
        questions: [],
    }

    for (const questionItem of quiz.questions) {
        output.questions.push(await buildQuestionOutput(directory, questionItem, seed))
    }
    return output
}

async function buildQuestionOutput(
    directory: string,
    item: QuizRootQuestion,
    seed: number,
): Promise<QuizQuestionOutput> {
    tui.gray(`Making question ${item.file}`)
    if (!(await existsInDir(directory, `${item.file}.yml`))) {
        throw new Error(`File ${item.file}.yml not found in ${directory}`)
    }
    const questionData = await readYamlInDir(directory, `${item.file}.yml`)
    const question = QuizzQuestion.parse(questionData)

    let variables: Record<string, unknown> = {}
    if (await existsInDir(directory, `${item.file}.py`)) {
        const code = await readTextInDir(directory, `${item.file}.py`)
        variables = (await execPythonCode(code, seed)) as Record<string, unknown>
    }

    return {
        title: item.title,
        file: item.file,
        score: item.score,
        points: 0,
        question: applyVariablesToQuestion(question, variables),
        answer: {},
    }
}

function applyVariablesToQuestion(
    question: QuizzQuestion,
    variables: Record<string, unknown>,
): QuizzQuestion {
    switch (question.type) {
        case 'FillIn':
            return makeFillInQuestionData(question, variables)
        case 'Ordering':
            return makeOrderingQuestionData(question, variables)
        case 'Matching':
            return makeMatchingQuestionData(question, variables)
        case 'SingleChoice':
            return makeSingleChoiceQuestionData(question, variables)
        case 'MultipleChoice':
            return makeMultipleChoiceQuestionData(question, variables)
        case 'OpenQuestion':
            return makeOpenQuestionData(question, variables)
        default:
            return assertNever(question)
    }
}

function makeFillInQuestionData(question: QuizzFillIn, variables: Record<string, unknown>): QuizzQuestion {
    const items: Record<string, QuizFillInItem> = {}
    for (const [key, item] of Object.entries(question.items)) {
        items[key] = {
            ...item,
            correct: substitute(item.correct, variables),
            options: item.options?.map((option: string) => substitute(option, variables)),
        }
    }
    return {
        ...question,
        items,
        text: substitute(question.text, variables),
    }
}

function makeOrderingQuestionData(question: QuizzOrdering, variables: Record<string, unknown>): QuizzQuestion & { items_rand: string[] } {
    const items = question.items.map((item: string) => substitute(item, variables))
    const items_rand = question.shuffle ? shuffle([...items]) : [...items]
    return {
        ...question,
        items,
        items_rand,
        text: substitute(question.text, variables),
    }
}

function makeMatchingQuestionData(question: QuizzMatching, variables: Record<string, unknown>): QuizzQuestion & { left_rand: string[]; right_rand: string[] } {
    const left = question.left.map((item: string) => substitute(item, variables))
    const right = question.right.map((item: string) => substitute(item, variables))
    const left_rand = question.shuffle ? shuffle([...left]) : [...left]
    const right_rand = question.shuffle ? shuffle([...right]) : [...right]
    return {
        ...question,
        left,
        right,
        left_rand,
        right_rand,
        text: substitute(question.text, variables),
    }
}

function processChoicesWithVariables<T extends { text: string }>(
    choices: T[],
    variables: Record<string, unknown>,
    shuffleChoices: boolean,
): T[] {
    const processed = choices.map((item) => ({
        ...item,
        text: substitute(item.text, variables),
    }))
    return shuffleChoices ? shuffle(processed) : processed
}

function makeSingleChoiceQuestionData(question: QuizzSingleChoice, variables: Record<string, unknown>): QuizzQuestion {
    const choices = processChoicesWithVariables(question.choices, variables, question.shuffle)
    return {
        ...question,
        choices,
        text: substitute(question.text, variables),
    }
}

function makeMultipleChoiceQuestionData(question: QuizzMultipleChoice, variables: Record<string, unknown>): QuizzQuestion {
    const choices = processChoicesWithVariables(question.choices, variables, question.shuffle)
    return {
        ...question,
        choices,
        text: substitute(question.text, variables),
    }
}

function makeOpenQuestionData(question: QuizzOpenQuestion, variables: Record<string, unknown>): QuizzQuestion {
    return {
        ...question,
        text: substitute(question.text, variables),
        placeholder: substitute(question.placeholder, variables),
    }
}

/**
 * Executes the given Python code and returns the resulting global variables as a Record.
 * Warning: no sandboxing is applied to the code.
 */
export async function execPythonCode(code: string, seed: number): Promise<Record<string, any>> {
    const pyexec = path.join(projectDir(), 'assets', 'python', 'pyexec.py')
    const { exitCode, stdout } = await execa({
        reject: false,
        input: code,
        stderr: 'inherit',
    })`python3 ${pyexec} ${seed}`
    if (exitCode !== 0) {
        throw new Error(`Python execution failed for ${pyexec} ${seed}`)
    }
    return JSON.parse(stdout) as Record<string, any>
}

/**
 * Substitutes variables in the given template string with their corresponding values from the values object.
 */
function substitute(template: string, values: Record<string, any>): string {
    /* 
        Example:

        const template = "Hello, $name! You have ${count} messages.";
        const result = substitute(template, { name: "Alice", count: 5 });
        Output: "Hello, Alice! You have 5 messages."
    */
    return template.replace(/\$\{?(\w+)\}?/g, (match, key) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return key in values ? values[key] : match
    })
}
