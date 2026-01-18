import { Command } from '@commander-js/extra-typings'
import { join, resolve } from 'path'
import { findRealDirectories } from '../lib/helpers'
import { newMaker } from '../lib/maker'
import tui from '../lib/tui'
import { nothing, projectDir } from '../lib/utils'

export const makeCmd = new Command('make')
    .description('Make problem elements')

    .argument('[tasks...]', 'tasks to make: all|info|exe|cor|pdf|txt|md|html', ['all'])
    .option('-d, --directories <directories...>', 'problem directories', ['.'])
    .option('-i, --ignore-errors', 'ignore errors on a directory and continue processing', false)
    .option('-e, --only-errors', 'only show errors at the final summary', false)
    .option('-p, --problem_nm <problem_nm>', 'problem nm', 'DRAFT')

    .action(async (tasks, { directories, ignoreErrors, onlyErrors, problem_nm }) => {
        if (tasks.length === 0) {
            tasks = ['all']
        }
        if (tasks.includes('all') && tasks.length > 1) {
            throw new Error("When 'all' is specified, no other tasks should be provided")
        }
        if (!tasks.every((t) => ['all', 'info', 'exe', 'cor', 'pdf', 'txt', 'md', 'html'].includes(t))) {
            throw new Error('Tasks must be one of: all, info, exe, cor, pdf, txt, md, html')
        }

        console.log()
        await tui.image(join(projectDir(), 'assets', 'images', 'jutge-toolkit.png'), 8, 4)

        const errors: Record<string, string> = {} // directory -> error message

        const realDirectories = await findRealDirectories(directories)

        for (const directory of realDirectories) {
            try {
                tui.title(`Making problem in directory ${tui.hyperlink(directory, resolve(directory))}`)

                const maker = await newMaker(directory, problem_nm)

                // If tasks include 'all', run makeProblem
                if (tasks.includes('all')) {
                    await maker.makeProblem()
                } else {
                    // Run specific tasks
                    if (tasks.includes('info')) {
                        // already done in maker initialization
                    }
                    if (tasks.includes('exe')) {
                        await maker.makeExecutables()
                    }
                    if (tasks.includes('cor')) {
                        await maker.makeCorrectOutputs()
                    }
                    if (tasks.includes('pdf')) {
                        await maker.makePdfStatements()
                    }
                    if (tasks.includes('txt') || tasks.includes('html') || tasks.includes('md')) {
                        await maker.makeTextualStatements(
                            tasks.filter((t) => ['txt', 'html', 'md'].includes(t)) as Array<'txt' | 'html' | 'md'>,
                        )
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)

                if (ignoreErrors) {
                    errors[directory] = errorMessage
                    tui.error(`Error: ${errorMessage}`)
                } else {
                    throw error
                }
            }
            console.log()
        }

        tui.title('Summary')
        await tui.section('', async () => {
            await nothing()
            if (realDirectories.length === 0) {
                tui.warning('No problem directories found')
            }
            for (const directory of realDirectories) {
                if (errors[directory]) {
                    tui.directory(directory)
                    tui.error(`  ${errors[directory]}`)
                } else if (!onlyErrors) {
                    tui.directory(directory)
                    tui.success(`  No errors found`)
                }
            }
        })
    })
