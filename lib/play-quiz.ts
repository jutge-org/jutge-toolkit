/**
 * Quiz test: interactive run of a quiz from a run output (or generated on the fly).
 * Displays questions via tui, collects answers via @inquirer/prompts, grades and shows results.
 */

import { checkbox, confirm, input, select } from '@inquirer/prompts'
import { readFile, writeFile } from 'fs/promises'
import { random } from 'radash'
import type { QuizQuestionOutput, QuizRunOutput } from './quiz'
import { runQuiz } from './quiz'
import tui from './tui'
import type {
    QuizzMatching,
    QuizzOrdering
} from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** User or correct answer; shape depends on question type. */
export type QuizAnswer =
    | Record<string, string>
    | string[]
    | number
    | number[]
    | string

/** Per-question result: user answer, correct answer, score, and emoji (e.g. ✅/❌). */
export interface QuizQuestionResult {
    userAnswer: QuizAnswer
    correctAnswer: QuizAnswer
    score: number
    emoji: string
}

/** Keyed by question file; written to --output when provided. */
export type QuizTestOutput = Record<string, QuizQuestionResult>

// ---------------------------------------------------------------------------
// Load input
// ---------------------------------------------------------------------------

/**
 * Loads quiz test input: from file if path given, otherwise runs the quiz with runQuiz(directory, seed).
 */
export async function loadQuizTestInput(
    inputPath: string | undefined,
    directory: string,
    seed?: number,
): Promise<QuizRunOutput> {
    if (inputPath !== undefined) {
        const raw = await readFile(inputPath, 'utf8')
        return JSON.parse(raw) as QuizRunOutput
    }
    const seedValue = seed ?? random(1000000, 9999999)
    return await runQuiz(directory, seedValue)
}

// ---------------------------------------------------------------------------
// Extract correct answers from question data (for grading and display)
// ---------------------------------------------------------------------------

function getCorrectAnswer(q: QuizQuestionOutput): QuizAnswer {
    const question = q.question
    switch (question.type) {
        case 'FillIn': {
            const out: Record<string, string> = {}
            for (const [key, item] of Object.entries(question.items)) {
                out[key] = item.correct
            }
            return out
        }
        case 'Ordering': {
            return [...question.items]
        }
        case 'Matching': {
            const qm = question as QuizzMatching & { left_rand?: string[]; right_rand?: string[] }
            const pairs: Record<string, string> = {}
            for (let i = 0; i < qm.left.length; i++) {
                const a = qm.left[i]
                const b = qm.right[i]
                if (a !== undefined && b !== undefined) {
                    pairs[a] = b
                }
            }
            return pairs
        }
        case 'SingleChoice': {
            const idx = question.choices.findIndex((c) => c.correct)
            return idx >= 0 ? idx : 0
        }
        case 'MultipleChoice': {
            return question.choices.map((c, i) => (c.correct ? i : -1)).filter((i) => i >= 0)
        }
        case 'OpenQuestion':
            return ''
        default:
            return ''
    }
}

// ---------------------------------------------------------------------------
// Display question (tui.markdown / tui.yaml)
// ---------------------------------------------------------------------------

async function displayQuestionStatement(q: QuizQuestionOutput): Promise<void> {
    await tui.markdown(q.question.text)
}

/** Escapes special regex characters in a string for use in RegExp. */
function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Returns context with each fill-in item key wrapped in markdown bold. */
function contextWithBoldKeys(context: string, keys: string[]): string {
    let out = context
    for (const key of [...keys].sort((a, b) => b.length - a.length)) {
        if (!key) continue
        const re = new RegExp('\\b' + escapeRegex(key) + '\\b', 'g')
        out = out.replace(re, '**$&**')
    }
    return out
}

/** Show extra context before the prompt when needed (e.g. fill-in: context; ordering: list). */
async function displayQuestionDetails(q: QuizQuestionOutput): Promise<void> {
    const question = q.question
    if (question.type === 'FillIn' && question.context) {
        const keys = Object.keys(question.items)
        const context = contextWithBoldKeys(question.context, keys)
        await tui.markdown(context)
    }
    if (question.type === 'Ordering') {
        const ord = question as QuizzOrdering & { items_rand?: string[] }
        const list = ord.items_rand ?? ord.items
        tui.yaml({ [ord.label]: list })
    }
}

// ---------------------------------------------------------------------------
// Prompt user for answer (per question type)
// ---------------------------------------------------------------------------

async function promptForAnswer(
    q: QuizQuestionOutput,
    defaults?: QuizAnswer,
): Promise<QuizAnswer> {
    const question = q.question
    switch (question.type) {
        case 'FillIn': {
            const out: Record<string, string> = {}
            const def = defaults as Record<string, string> | undefined
            for (const key of Object.keys(question.items)) {
                const item = question.items[key]
                if (!item) continue
                if (item.options && item.options.length > 0) {
                    const defaultIdx = item.options.indexOf(def?.[key] ?? '')
                    const idx = await select({
                        message: `${key}:`,
                        choices: item.options.map((opt, i) => ({
                            name: opt,
                            value: i,
                        })),
                        default: defaultIdx >= 0 ? defaultIdx : 0,
                    })
                    out[key] = item.options[idx] ?? ''
                } else {
                    const val = await input({
                        message: `${key}:`,
                        default: def?.[key],
                    })
                    out[key] = val
                }
            }
            return out
        }
        case 'Ordering': {
            const ord = question as QuizzOrdering & { items_rand?: string[] }
            const list = ord.items_rand ?? ord.items
            const def = (defaults as string[] | undefined) ?? []
            const ordered: string[] = []
            const remaining = [...list]
            for (let i = 0; i < list.length; i++) {
                const defaultVal = def[i] ?? remaining[0] ?? ''
                const choices = remaining.map((s) => ({ name: s, value: s }))
                const chosen = await select({
                    message: `Position ${i + 1}:`,
                    choices,
                    default: defaultVal,
                })
                ordered.push(chosen)
                remaining.splice(remaining.indexOf(chosen), 1)
            }
            return ordered
        }
        case 'Matching': {
            const m = question as QuizzMatching & { left_rand?: string[]; right_rand?: string[] }
            const left = m.left_rand ?? m.left
            const right = m.right_rand ?? m.right
            const def = (defaults as Record<string, string> | undefined) ?? {}
            const pairs: number[] = []
            const usedRight = new Set<number>()
            for (let i = 0; i < left.length; i++) {
                const leftItem = left[i]
                if (leftItem === undefined) continue
                const defaultRight = def[leftItem]
                const defaultIdx = defaultRight ? right.indexOf(defaultRight) : -1
                const choices = right
                    .map((r, j) => ({ name: r, value: j }))
                    .filter((c) => !usedRight.has(c.value))
                const defaultChoice =
                    defaultIdx >= 0 && !usedRight.has(defaultIdx) ? defaultIdx : choices[0]?.value ?? 0
                const j = await select({
                    message: `Match "${leftItem}" to:`,
                    choices,
                    default: defaultChoice,
                })
                usedRight.add(j)
                pairs.push(j)
            }
            return pairs
        }
        case 'SingleChoice': {
            const def = defaults as number | undefined
            const idx = await select({
                message: 'Choose one:',
                choices: question.choices.map((c, i) => ({ name: c.text, value: i })),
                default: typeof def === 'number' && def >= 0 ? def : 0,
            })
            return idx
        }
        case 'MultipleChoice': {
            const def = (defaults as number[] | undefined) ?? []
            const selected = await checkbox({
                message: 'Choose all that apply:',
                choices: question.choices.map((c, i) => ({
                    name: c.text,
                    value: i,
                    checked: def.includes(i),
                })),
            })
            return selected
        }
        case 'OpenQuestion': {
            const def = (defaults as string) ?? ''
            const defaultVal = def || (question.placeholder ?? '')
            const text = await input({
                message: 'Your answer:',
                default: defaultVal,
            })
            return text
        }
        default:
            return ''
    }
}

// ---------------------------------------------------------------------------
// Grade answer
// ---------------------------------------------------------------------------

function gradeAnswer(q: QuizQuestionOutput, userAnswer: QuizAnswer): number {
    const correct = getCorrectAnswer(q)
    const question = q.question
    const maxPoints = q.score

    switch (question.type) {
        case 'FillIn': {
            const u = userAnswer as Record<string, string>
            const c = correct as Record<string, string>
            const keys = Object.keys(c)
            const firstKey = keys[0]
            let correctCount = 0
            const trim = (x: string) =>
                firstKey !== undefined && question.items[firstKey]?.trim !== false ? x.trim() : x
            const eq = (a: string, b: string) =>
                firstKey !== undefined && question.items[firstKey]?.ignorecase
                    ? trim(a).toLowerCase() === trim(b).toLowerCase()
                    : trim(a) === trim(b)
            for (const key of keys) {
                if (eq(u[key] ?? '', c[key] ?? '')) correctCount++
            }
            if (question.partial_answer) {
                return keys.length === 0 ? 0 : Math.round((maxPoints * correctCount) / keys.length)
            }
            return correctCount === keys.length ? maxPoints : 0
        }
        case 'Ordering': {
            const u = userAnswer as string[]
            const c = correct as string[]
            if (u.length !== c.length) return 0
            let correctCount = 0
            for (let i = 0; i < c.length; i++) {
                if (u[i] === c[i]) correctCount++
            }
            if (question.partial_answer) {
                return c.length === 0 ? 0 : Math.round((maxPoints * correctCount) / c.length)
            }
            return correctCount === c.length ? maxPoints : 0
        }
        case 'Matching': {
            const m = question as QuizzMatching & { left_rand?: string[]; right_rand?: string[] }
            const left = m.left_rand ?? m.left
            const right = m.right_rand ?? m.right
            const u = userAnswer as number[]
            let correctCount = 0
            for (let i = 0; i < left.length; i++) {
                const leftItem = left[i]
                const ui = u[i]
                if (
                    leftItem !== undefined &&
                    ui !== undefined &&
                    right[ui] === m.right[m.left.indexOf(leftItem)]
                )
                    correctCount++
            }
            if (question.partial_answer) {
                return left.length === 0 ? 0 : Math.round((maxPoints * correctCount) / left.length)
            }
            return correctCount === left.length ? maxPoints : 0
        }
        case 'SingleChoice': {
            const idx = userAnswer as number
            return question.choices[idx]?.correct ? maxPoints : 0
        }
        case 'MultipleChoice': {
            const selected = userAnswer as number[]
            const correctSet = new Set(
                question.choices.map((c, i) => (c.correct ? i : -1)).filter((i) => i >= 0),
            )
            if (question.partial_answer) {
                let score = 0
                for (const i of selected) {
                    if (correctSet.has(i)) score += maxPoints / correctSet.size
                }
                return Math.round(score)
            }
            if (selected.length !== correctSet.size) return 0
            return selected.every((i) => correctSet.has(i)) ? maxPoints : 0
        }
        case 'OpenQuestion':
            return maxPoints
        default:
            return 0
    }
}

/** Normalize correct answer for display (e.g. matching: show pairs, not indices). */
function correctAnswerForDisplay(q: QuizQuestionOutput): QuizAnswer {
    const question = q.question
    const correct = getCorrectAnswer(q)
    if (question.type === 'Matching') {
        const m = question as QuizzMatching & { left_rand?: string[]; right_rand?: string[] }
        const left = m.left_rand ?? m.left
        const right = m.right_rand ?? m.right
        const pairs = correct as Record<string, string>
        return left.map((l) => `${l} → ${pairs[l] ?? '?'}`)
    }
    if (question.type === 'SingleChoice') {
        const idx = correct as number
        return question.choices[idx]?.text ?? ''
    }
    if (question.type === 'MultipleChoice') {
        const indices = correct as number[]
        return indices.map((i) => question.choices[i]?.text ?? '').filter(Boolean)
    }
    return correct
}

/** Normalize user answer for display (same as above for matching/single/multiple). */
function userAnswerForDisplay(q: QuizQuestionOutput, userAnswer: QuizAnswer): QuizAnswer {
    const question = q.question
    if (question.type === 'Matching') {
        const m = question as QuizzMatching & { left_rand?: string[]; right_rand?: string[] }
        const left = m.left_rand ?? m.left
        const right = m.right_rand ?? m.right
        const indices = userAnswer as number[]
        return left.map((l, i) => `${l} → ${right[indices[i] ?? 0] ?? '?'}`)
    }
    if (question.type === 'SingleChoice') {
        const idx = userAnswer as number
        return question.choices[idx]?.text ?? ''
    }
    if (question.type === 'MultipleChoice') {
        const indices = userAnswer as number[]
        return indices.map((i) => question.choices[i]?.text ?? '').filter(Boolean)
    }
    return userAnswer
}

// ---------------------------------------------------------------------------
// Main play flow
// ---------------------------------------------------------------------------

/**
 * Runs the interactive quiz test: display questions, collect answers, optional review,
 * then show results (user answer, correct answer, score per question and total).
 * Returns the result object to optionally write to --output.
 */
export async function playQuiz(input: QuizRunOutput): Promise<QuizTestOutput> {
    const results: QuizTestOutput = {}
    const userAnswers: Record<string, QuizAnswer> = {}

    const collectAnswers = async (defaults?: Record<string, QuizAnswer>) => {
        for (const q of input.questions) {
            tui.print("")
            await tui.section(`Question: ${q.title} (${q.file})`, async () => {
                await displayQuestionStatement(q)
                await displayQuestionDetails(q)
                const answer = await promptForAnswer(q, defaults?.[q.file])
                userAnswers[q.file] = answer
            })
        }
    }

    await tui.section(input.title, async () => {
        await tui.markdown(input.statement)
    })

    await collectAnswers()

    await tui.section('Review your answers', async () => {
        let wantReview = await confirm({
            message: 'Do you want to review your answers?',
            default: false,
        })
        while (wantReview) {
            await collectAnswers(userAnswers)
            wantReview = await confirm({
                message: 'Review again?',
                default: false,
            })
        }
    })

    let totalScore = 0
    const maxScore = input.questions.reduce((acc, q) => acc + q.score, 0)

    for (const q of input.questions) {
        const userAnswer = userAnswers[q.file]
        const correctAnswer = getCorrectAnswer(q)
        const score = gradeAnswer(q, userAnswer ?? '')
        totalScore += score
        const emoji = score >= q.score ? '✅' : '❌'
        results[q.file] = {
            userAnswer: userAnswer ?? '',
            correctAnswer,
            score,
            emoji,
        }
    }

    await tui.section('Results', () => {
        for (const q of input.questions) {
            const r = results[q.file]
            if (!r) continue
            const userD = userAnswerForDisplay(q, r.userAnswer)
            const correctD = correctAnswerForDisplay(q)
            tui.yaml({
                [q.file]: {
                    emoji: r.emoji,
                    userAnswer: userD,
                    correctAnswer: correctD,
                    score: r.score,
                },
            })
        }
        tui.yaml({
            totalScore,
            maxScore,
        })
        return Promise.resolve()
    })

    return results
}

/**
 * Writes the quiz test output (per-question results) to the given path.
 */
export async function writeQuizTestOutput(path: string, output: QuizTestOutput): Promise<void> {
    await writeFile(path, JSON.stringify(output, null, 2), 'utf8')
}
