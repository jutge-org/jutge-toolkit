import type { AbstractProblem } from './new-problem'
import { makeStd } from './make-std'
import { makeGame } from './make-game'
import { makeQuiz } from './make-quiz'

export async function make(aproblem: AbstractProblem, problem_nm: string, tasks: string[]) {
    if (aproblem.type === 'std') {
        await makeStd(aproblem, problem_nm, tasks)
    } else if (aproblem.type === 'game') {
        await makeGame(aproblem, problem_nm, tasks)
    } else if (aproblem.type === 'quiz') {
        await makeQuiz(aproblem, problem_nm, tasks)
    }
}
