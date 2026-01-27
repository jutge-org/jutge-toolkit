import { Command } from '@commander-js/extra-typings'
import { stage } from '../lib/stage'
import tui from '../lib/tui'
import { loadAbstractProblem } from '../lib/new-problem'

export const stageCmd = new Command('stage')
    .summary('Stage problem')

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-p, --problem_nm <problem_nm>', 'problem_nm', 'DRAFT')

    .action(async ({ directory, problem_nm }) => {
        tui.title(`Staging problem`)
        const aproblem = await loadAbstractProblem(directory)
        await stage(aproblem, problem_nm)
    })
