import type { AbstractProblem } from './new-problem'
import tui from './tui'
import { nothing } from './utils'

export async function makeQuiz(aproblem: AbstractProblem, problem_nm: string, tasks: string[]) {
    //

    await nothing()
    tui.warning('Nothing to do for quiz problems')
}
