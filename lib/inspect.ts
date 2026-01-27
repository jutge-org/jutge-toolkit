import type { AbstractProblem } from './new-problem'
import tui from './tui'
import { nothing } from './utils'

export async function inspect(aproblem: AbstractProblem) {
    await nothing()
    tui.yaml(aproblem)
}
