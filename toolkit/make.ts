import { Command } from '@commander-js/extra-typings'
import { loadAbstractProblem } from '../lib/new-problem'
import tui from '../lib/tui'
import { make } from '../lib/make'

export const makeCmd = new Command('make')
    .description('Make problem')

    .argument('[tasks...]', 'tasks to make: all|exe|cor|pdf|txt|md|html|short.txt|short.md|short.html', ['all'])
    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-p, --problem_nm <problem_nm>', 'problem nm', 'DRAFT')

    .action(async (tasks, { directory, problem_nm }) => {
        if (tasks.length === 0) {
            tasks = ['all']
        }
        if (tasks.includes('all') && tasks.length > 1) {
            throw new Error("When 'all' is specified, no other tasks should be provided")
        }
        if (
            !tasks.every((t) =>
                ['all', 'exe', 'cor', 'pdf', 'txt', 'md', 'html', 'short.txt', 'short.md', 'short.html'].includes(t),
            )
        ) {
            throw new Error('Tasks must be one of: all, exe, cor, pdf, txt, md, html, short.txt, short.md, short.html')
        }

        tui.title(`Making problem`)
        const aproblem = await loadAbstractProblem(directory)
        await make(aproblem, problem_nm, tasks)
    })
