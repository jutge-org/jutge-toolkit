import { ZodError } from 'zod'
import tui from './tui'
import { QuizRoot, QuizRootQuestion, QuizzQuestion } from './types'
import { projectDir, readTextInDir, readYamlInDir } from './utils'
import { fromError } from 'zod-validation-error'
import { shuffle } from 'radash'
import { execa } from 'execa'
import { stdin } from 'node:process'
import path from 'node:path'
import { text } from 'node:stream/consumers'

// TODO: check points add to 100?

export async function validateQuiz(directory: string) {
    let quizRoot: QuizRoot = {} as QuizRoot
    await tui.section(`Validating ${tui.hyperlink(directory, 'quiz.yml')}`, async () => {
        try {
            const quizData = await readYamlInDir(directory, 'quiz.yml')
            quizRoot = QuizRoot.parse(quizData)
            tui.success(`quiz.yml is valid`)
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
        await tui.section(`Validating ${tui.hyperlink(directory, file)}`, async () => {
            try {
                const questionData = await readYamlInDir(directory, file)
                const questionParsed = QuizzQuestion.parse(questionData)
                tui.success(`${file} is valid`)
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

export async function makeQuiz(directory: string, seed: number) {
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
    console.log(JSON.stringify(output, null, 4))
}

async function makeQuestion(directory: string, item: QuizRootQuestion, seed: number): Promise<any> {
    const questionData = await readYamlInDir(directory, `${item.file}.yml`)
    const question = QuizzQuestion.parse(questionData)
    const code = await readTextInDir(directory, `${item.file}.py`)
    const variables = await execPythonCode(code)

    return {
        title: item.title,
        file: item.file,
        score: item.score,
        points: 0,
        q: makeQuestionData(question, variables, seed),
        a: {},
    }
}

function makeQuestionData(question: QuizzQuestion, variables: Record<string, any>, seed: number): QuizQuestion {
    // TODO: acabar
    return {
        ...question,
        text: substitute(question.text, variables),
    }
}

/**
 * Executes the given Python code and returns the resulting global variables as a Record.
 */
export async function execPythonCode(code: string): Promise<Record<string, any>> {
    const pyexec = path.join(projectDir(), 'assets', 'python', 'pyexec.py')
    const { exitCode, stdout } = await execa({
        reject: false,
        input: code,
        stderr: 'inherit',
    })`python3 ${pyexec}`
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
