import { Command } from '@commander-js/extra-typings'
import { createProblemWithJutgeAI } from '../lib/create-with-jutgeai'
import { createProblemWithTemplate } from '../lib/create-with-template'
import { settings } from '../lib/settings'

export const createCmd = new Command('create')
    .description('Create a new problem')

    .action(() => {
        createCmd.help()
    })

createCmd
    .command('with-template')
    .description('Create a problem with a template')

    .argument('[template]', 'template to use (empty to interactive selection)')
    .option('-d, --directory <path>', 'output directory', 'new-problem.pbm')

    .action(async (template, { directory }) => {
        await createProblemWithTemplate(directory, template)
    })

createCmd
    .command('with-ai')
    .description('Create a problem with JutgeAI')

    .option('-d, --directory <path>', 'output directory', 'new-problem.pbm')
    .option('-i, --input <path>', 'input specification file')
    .option('-o, --output <path>', 'output specification file')
    .option('-n, --do-not-ask', 'do not ask interactively if --input given', false)
    .option('-m, --model <model>', 'AI model to use', settings.defaultModel)

    .action(async ({ input, output, directory, model, doNotAsk }) => {
        await createProblemWithJutgeAI(model, directory, input, output, doNotAsk)
    })
