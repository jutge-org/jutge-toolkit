import { execa } from 'execa'
import fs from 'fs/promises'
import path from 'path'
import { languageNames } from './data'
import type { AbstractProblem, Problem } from './new-problem'
import tui from './tui'
import { toolkitPrefix } from './utils'

function shouldMake(tasks: string[], task: string): boolean {
    return tasks.includes('all') || tasks.includes(task)
}

export async function makeGame(aproblem: AbstractProblem, problem_nm: string, tasks: string[]) {
    //

    if (aproblem.structure === 'flat') {
        throw new Error('Flat structure is not supported for games')
    }

    for (const problem of Object.values(aproblem.problems)) {
        await tui.section(`Making problem for ${languageNames[problem.lang]}`, async () => {
            if (shouldMake(tasks, 'exe')) {
                await makeRunner(aproblem, problem)
            }
            if (shouldMake(tasks, 'pdf')) {
                await makeDoc(aproblem, problem)
            }
        })
    }
}

async function makeRunner(aproblem: AbstractProblem, problem: Problem) {
    const runnerDir = path.join(problem.dir, 'Runner')
    await tui.section(`Compiling files in ${tui.hyperlink(problem.dir, 'Runner')}`, async () => {
        tui.command('make all')
        const { exitCode } = await execa({
            stdout: 'inherit',
            stderr: 'inherit',
            cwd: runnerDir,
        })`make all`
        if (exitCode === 0) {
            tui.success('make completed successfully')
        } else {
            tui.error('make failed')
            throw new Error('make failed')
        }
    })
}

async function makeDoc(aproblem: AbstractProblem, problem: Problem) {
    const docDir = path.join(problem.dir, 'Doc')
    await tui.section(`Creating documentation in ${tui.hyperlink(problem.dir, 'Doc')}`, async () => {
        tui.command('make all')
        const { exitCode } = await execa({
            stderr: 'inherit',
            cwd: docDir,
        })`make all`
        if (exitCode === 0) {
            tui.success('make completed successfully')
        } else {
            tui.error('make failed')
            throw new Error('make failed')
        }
    })
}
