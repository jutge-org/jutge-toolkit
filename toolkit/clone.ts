import { Command } from '@commander-js/extra-typings'
import { createProblemWithTemplate } from '../lib/create-with-template'

export const cloneCmd = new Command('clone')
    .description('Clone a template into a new problem')

    .argument('[template]', 'template to use (empty to interactive selection)')
    .option('-d, --directory <path>', 'output directory', 'new-problem.pbm')

    .action(async (template, { directory }) => {
        await createProblemWithTemplate(directory, template)
    })
