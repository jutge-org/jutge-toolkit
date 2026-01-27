import type { AbstractProblem } from './new-problem'
import { cleanStd } from './clean-std'
import { cleanGame } from './clean-game'
import { cleanQuiz } from './clean-quiz'

export async function clean(aproblem: AbstractProblem, force: boolean, all: boolean) {
    if (aproblem.type === 'std') {
        await cleanStd(aproblem, force, all)
    } else if (aproblem.type === 'game') {
        await cleanGame(aproblem, force, all)
    } else if (aproblem.type === 'quiz') {
        await cleanQuiz(aproblem, force, all)
    }
}
