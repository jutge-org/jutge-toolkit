import { Command } from '@commander-js/extra-typings'
import { Previewer } from '../lib/previewer'

export const previewCmd = new Command('preview')
    .summary('Preview problem staged in Jutge.org')

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-p, --problem_nm <problem_nm>', 'problem_nm', 'DRAFT')

    .action(async ({ directory, problem_nm }) => {
        const previewer = new Previewer(directory, problem_nm)
        await previewer.prepare()
    })
