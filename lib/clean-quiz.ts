import type { AbstractProblem } from './new-problem'
import tui from './tui'
import { nothing } from './utils'

export async function cleanQuiz(aproblem: AbstractProblem, force: boolean, all: boolean) {
    await nothing()
    tui.warning('Nothing to clean for quiz problems')
}
