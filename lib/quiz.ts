import { execa } from 'execa'
import path from 'node:path'
import { shuffle } from 'radash'
import { ZodError } from 'zod'
import { fromError } from 'zod-validation-error'
import tui from './tui'
import { QuizFillInItem, QuizRoot, QuizRootQuestion, QuizzFillIn, QuizzMatching, QuizzMultipleChoice, QuizzOpenQuestion, QuizzOrdering, QuizzQuestion, QuizzSingleChoice } from './types'
import { existsInDir, projectDir, readTextInDir, readYamlInDir } from './utils'

export async function lintQuiz(directory: string) {
    let quizRoot: QuizRoot = {} as QuizRoot
    await tui.section(`Linting ${tui.hyperlink(directory, 'quiz.yml')}`, async () => {
        try {
            const quizData = await readYamlInDir(directory, 'quiz.yml')
            quizRoot = QuizRoot.parse(quizData)
            tui.success(`quiz.yml seems valid`)
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
        }
    })
    if (!quizRoot.questions) return

    for (const [index, question] of quizRoot.questions.entries()) {
        const file = `${question.file}.yml`
        await tui.section(`Linting ${tui.hyperlink(directory, file)}`, async () => {
            try {
                const questionData = await readYamlInDir(directory, file)
                const questionParsed = QuizzQuestion.parse(questionData)
                tui.success(`${file} seems valid`)
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
            }
        })
    }
}

// TODO: no seed in Math.random???

export async function runQuiz(directory: string, seed: number): Promise<any> {
    if (!await existsInDir(directory, 'quiz.yml')) {
        throw new Error(`File quiz.yml not found in ${directory}`)
    }
    const quizData = await readYamlInDir(directory, 'quiz.yml')
    const quiz = QuizRoot.parse(quizData)
    if (quiz.shuffle) {
        shuffle(quiz.questions)
    }
    const output: any = {
        title: quiz.title,
        statement: quiz.statement,
        shuffle: quiz.shuffle,
        seed,
        'time-generation': new Date().toISOString(),
        questions: [],
    }

    for (const questionItem of quiz.questions) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        output.questions.push(await makeQuestion(directory, questionItem, seed))
    }
    return output
}

async function makeQuestion(directory: string, item: QuizRootQuestion, seed: number): Promise<any> {
    console.error(`Making question ${item.file}`)
    if (!await existsInDir(directory, `${item.file}.yml`)) {
        throw new Error(`File ${item.file}.yml not found in ${directory}`)
    }
    const questionData = await readYamlInDir(directory, `${item.file}.yml`)
    const question = QuizzQuestion.parse(questionData)

    let variables: Record<string, any> = {}
    if (await existsInDir(directory, `${item.file}.py`)) {
        const code = await readTextInDir(directory, `${item.file}.py`)
        variables = await execPythonCode(code, seed)
    }

    return {
        title: item.title,
        file: item.file,
        score: item.score,
        points: 0,
        q: makeQuestionData(question, variables),
        a: {},
    }
}

function makeQuestionData(question: QuizzQuestion, variables: Record<string, any>): QuizzQuestion {
    if (question.type === 'FillIn') return makeFillInQuestionData(question, variables)
    if (question.type === 'Ordering') return makeOrderingQuestionData(question, variables)
    if (question.type === 'Matching') return makeMatchingQuestionData(question, variables)
    if (question.type === 'SingleChoice') return makeSingleChoiceQuestionData(question, variables)
    if (question.type === 'MultipleChoice') return makeMultipleChoiceQuestionData(question, variables)
    if (question.type === 'OpenQuestion') return makeOpenQuestionData(question, variables)
    throw new Error(`Unknown question type: ${(question as any).type}`)
}

function makeFillInQuestionData(question: QuizzFillIn, variables: Record<string, any>): QuizzQuestion {
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

function makeOrderingQuestionData(question: QuizzOrdering, variables: Record<string, any>): QuizzQuestion & { items_rand: string[] } {
    const items = question.items.map((item: string) => substitute(item, variables))
    let items_rand = [...items]
    if (question.shuffle) items_rand = shuffle(items_rand)

    return {
        ...question,
        items,
        items_rand,
        text: substitute(question.text, variables),
    }
}

function makeMatchingQuestionData(question: QuizzMatching, variables: Record<string, any>): QuizzQuestion & { left_rand: string[]; right_rand: string[] } {
    const left = question.left.map((item: string) => substitute(item, variables))
    const right = question.right.map((item: string) => substitute(item, variables))
    let left_rand = [...left]
    let right_rand = [...right]
    if (question.shuffle) {
        left_rand = shuffle(left_rand)
        right_rand = shuffle(right_rand)
    }

    return {
        ...question,
        left,
        right,
        left_rand,
        right_rand,
        text: substitute(question.text, variables),
    }
}

function makeSingleChoiceQuestionData(question: QuizzSingleChoice, variables: Record<string, any>): QuizzQuestion {
    let choices = question.choices.map((item) => ({
        ...item,
        text: substitute(item.text, variables),
    }))
    if (question.shuffle) choices = shuffle(choices)

    return {
        ...question,
        choices,
        text: substitute(question.text, variables),
    }
}

function makeMultipleChoiceQuestionData(question: QuizzMultipleChoice, variables: Record<string, any>): QuizzQuestion {
    let choices = question.choices.map((item) => ({
        ...item,
        text: substitute(item.text, variables),
    }))
    if (question.shuffle) choices = shuffle(choices)

    return {
        ...question,
        choices,
        text: substitute(question.text, variables),
    }
}

function makeOpenQuestionData(question: QuizzOpenQuestion, variables: Record<string, any>): QuizzQuestion {
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
