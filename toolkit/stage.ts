import { Command } from '@commander-js/extra-typings'
import { Stager } from '../lib/stager'

export const stageCmd = new Command('stage')
    .summary('Stage problem')

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-p, --problem_nm <problem_nm>', 'problem_nm', 'DRAFT')

    .action(async ({ directory, problem_nm }) => {
        const stager = new Stager(directory, problem_nm)
        await stager.stage()
    })
