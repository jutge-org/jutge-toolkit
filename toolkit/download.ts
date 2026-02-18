import { Command } from '@commander-js/extra-typings'
import { downloadProblem } from '../lib/download'

export const downloadCmd = new Command('download')
    .summary('Download a problem from Jutge.org')

    .argument('<problem_nm>', 'problem to download')
    .option('-d, --directory <path>', 'output directory (default: <problem_nm>.pbm)')

    .action(async (problem_nm, { directory }) => {
        const outDir = directory ?? `${problem_nm}.pbm`
        if (!outDir.endsWith('.pbm')) {
            throw new Error('Output directory must end with .pbm')
        }
        await downloadProblem(problem_nm, outDir)
    })
