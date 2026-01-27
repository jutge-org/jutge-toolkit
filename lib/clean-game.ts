import path from 'path'
import { execa } from 'execa'
import { languageNames } from './data'
import type { AbstractProblem } from './new-problem'
import tui from './tui'

export async function cleanGame(aproblem: AbstractProblem, force: boolean, all: boolean) {
    //

    if (aproblem.structure === 'flat') {
        throw new Error('Flat structure is not supported for games')
    }

    for (const problem of Object.values(aproblem.problems)) {
        await tui.section(`Cleaning game for ${languageNames[problem.lang]}`, async () => {
            await tui.section(`Cleaning Runner in ${tui.hyperlink(problem.dir, 'Runner')}`, async () => {
                tui.command('make clean')
                const { exitCode } = await execa({
                    stdout: 'inherit',
                    stderr: 'inherit',
                    cwd: path.join(problem.dir, 'Runner'),
                })`make clean`
                if (exitCode === 0) {
                    tui.success('make completed successfully')
                } else {
                    tui.error('make failed')
                    throw new Error('make failed')
                }
            })

            await tui.section(`Cleaning Doc in ${tui.hyperlink(problem.dir, 'Doc')}`, async () => {
                tui.command('make clean')
                const { exitCode } = await execa({
                    stdout: 'inherit',
                    stderr: 'inherit',
                    cwd: path.join(problem.dir, 'Doc'),
                })`make clean`
                if (exitCode === 0) {
                    tui.success('make completed successfully')
                } else {
                    tui.error('make failed')
                    throw new Error('make failed')
                }
            })
        })
    }
}
