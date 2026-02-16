import { Command } from '@commander-js/extra-typings'
import chokidar from 'chokidar'
import { basename, dirname, join, resolve } from 'path'
import { findRealDirectories } from '../lib/helpers'
import { lintDirectories } from '../lib/lint'
import { printLintResults } from './lint'
import { newMaker, type Maker } from '../lib/maker'
import type { Problem } from '../lib/problem'
import tui from '../lib/tui'
import { nothing, projectDir } from '../lib/utils'
import chalk from 'chalk'
import ora from 'ora'

const WATCH_DEBOUNCE_MS = 300

export const makeCmd = new Command('make')
    .description('Make problem')

    .argument('[tasks...]', 'tasks to make: all|info|exe|cor|pdf|txt|md|html', ['all'])
    .option('-d, --directories <directories...>', 'problem directories', ['.'])
    .option('-i, --ignore-errors', 'ignore errors on a directory and continue processing', false)
    .option('-e, --only-errors', 'only show errors at the final summary', false)
    .option('-p, --problem_nm <problem_nm>', 'problem nm', 'DRAFT')
    .option('-w, --watch', 'watch for changes and rebuild incrementally (under development)', false)

    .action(async (tasks, { directories, ignoreErrors, onlyErrors, problem_nm, watch }) => {
        if (watch) {
            tasks = ['all']
        }
        if (tasks.length === 0) {
            tasks = ['all']
        }
        if (tasks.includes('all') && tasks.length > 1) {
            throw new Error("When 'all' is specified, no other tasks should be provided")
        }
        if (!tasks.every((t) => ['all', 'info', 'exe', 'cor', 'pdf', 'txt', 'md', 'html'].includes(t))) {
            throw new Error('Tasks must be one of: all, info, exe, cor, pdf, txt, md, html')
        }

        tui.print()
        await tui.image(join(projectDir(), 'assets', 'images', 'jutge-toolkit.png'), 8, 4)

        const errors: Record<string, string> = {} // directory -> error message

        const realDirectories = await findRealDirectories(directories)

        if (watch && realDirectories.length > 1) {
            tui.warning('With --watch only the first directory is watched')
        }
        const watchDirectory = watch && realDirectories.length > 0 ? realDirectories[0]! : null

        for (const directory of realDirectories) {
            if (watch && directory !== watchDirectory) continue

            try {
                tui.title(`Making problem in directory ${tui.hyperlink(directory, resolve(directory))}`)

                const maker = await newMaker(directory, problem_nm)

                if (watch) {
                    const handler = maker.problem.handler.handler
                    if (handler === 'quiz' || handler === 'game') {
                        tui.warning('--watch has no effect for quiz or game problems')
                        await maker.makeProblem()
                        continue
                    }
                }

                if (!watch) {
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
                            await maker.makeFullTextualStatements(
                                tasks.filter((t) => ['txt', 'html', 'md'].includes(t)) as Array<'txt' | 'html' | 'md'>,
                            )
                            await maker.makeShortTextualStatements(
                                tasks.filter((t) => ['txt', 'html', 'md'].includes(t)) as Array<'txt' | 'html' | 'md'>,
                            )
                        }
                    }
                }

                if (watch && directory === watchDirectory) {
                    await runWatch(maker)
                    return
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
            tui.print()
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

async function runWatch(maker: Maker): Promise<void> {
    const directory = maker.problem.directory
    const goldenSolution = maker.problem.goldenSolution

    const pending = {
        inp: new Set<string>(),
        golden: false,
        alternatives: new Set<string>(),
        statementTex: false,
        ymlSchema: false,
        changedPaths: new Set<string>(),
    }
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let running = false
    let idleSpinner: ReturnType<typeof ora> | null = null

    function stopIdleSpinner() {
        if (idleSpinner) {
            idleSpinner.stop()
            idleSpinner = null
        }
    }

    function scheduleRun() {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
            void flush()
        }, WATCH_DEBOUNCE_MS)
    }

    async function flush() {
        debounceTimer = null
        stopIdleSpinner()
        if (
            running ||
            (pending.inp.size === 0 &&
                !pending.golden &&
                pending.alternatives.size === 0 &&
                !pending.statementTex &&
                !pending.ymlSchema)
        ) {
            await printIdleMessage()
            return
        }
        const inp = new Set(pending.inp)
        const golden = pending.golden
        const alternatives = new Set(pending.alternatives)
        const statementTex = pending.statementTex
        const ymlSchema = pending.ymlSchema
        const changedPaths = new Set(pending.changedPaths)
        pending.inp.clear()
        pending.golden = false
        pending.alternatives.clear()
        pending.statementTex = false
        pending.ymlSchema = false
        pending.changedPaths.clear()
        running = true
        try {
            if (changedPaths.size > 0) {
                tui.print()
                tui.print(chalk.gray('Changed:') + ' ' + [...changedPaths].sort().join(', '))
                tui.print()
            }
            if (ymlSchema) {
                const results = await lintDirectories([directory])
                if (results.length > 0) {
                    await printLintResults(results, [directory])
                }
            }
            const problem: Problem = maker.problem
            await (problem.reloadTestcases as () => Promise<void>)()
            await (problem.reloadSolutions as () => Promise<void>)()
            if (golden && problem.goldenSolution) {
                await maker.makeGoldenExecutable()
                await maker.makeCorrectOutputs()
                await maker.remakeStatements()
                return
            }
            const currentGolden = problem.goldenSolution
            for (const testcase of inp) {
                try {
                    await maker.makeCorrectOutputForTestcase(testcase)
                } catch (e) {
                    tui.error(e instanceof Error ? e.message : String(e))
                }
            }
            const hasSampleInp = [...inp].some((t) => t.includes('sample'))
            if (hasSampleInp && inp.size > 0) {
                await maker.remakeStatements()
            }
            for (const program of alternatives) {
                if (program === currentGolden) continue
                try {
                    await maker.verifyCandidate(program)
                } catch (e) {
                    tui.error(e instanceof Error ? e.message : String(e))
                }
            }
            if (inp.size > 0 && currentGolden) {
                const changedTestcases = [...inp]
                for (const solution of problem.solutions) {
                    if (solution === currentGolden) continue
                    try {
                        await maker.verifyCandidate(solution, changedTestcases, { skipCompile: true })
                    } catch (e) {
                        tui.error(e instanceof Error ? e.message : String(e))
                    }
                }
            }
            if (statementTex) {
                await maker.remakeStatements()
            }
        } finally {
            running = false
            await printIdleMessage()
        }
    }

    async function printIdleMessage() {
        tui.print()
        await tui.section(`Watching ${directory}`, async () => {
            await nothing()
            tui.print('╭───╮ ╭───╮ ╭───╮ ')
            tui.print('│ ' + chalk.bold('A') + ' │ │ ' + chalk.bold('L') + ' │ │ ' + chalk.bold('Q') + ' │ ')
            tui.print('╰───╯ ╰───╯ ╰───╯ ')
            tui.print('  ♻️     🔍    🔚')
            tui.print(' ' + chalk.blue('All') + '  ' + chalk.blue('Lint') + '   ' + chalk.blue('Quit') + ' ')
            tui.print('')
        })
        idleSpinner = ora({
            text: 'Watching for changes or keypress...',
        }).start()
    }

    const watchDir = resolve(directory)
    const watcher = chokidar.watch(watchDir, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 100 },
    })

    function onFileEvent(path: string) {
        const parent = resolve(dirname(path))
        if (parent !== watchDir) return
        const name = basename(path)
        pending.changedPaths.add(path)
        if (name.endsWith('.inp')) {
            pending.inp.add(name.replace(/\.inp$/, ''))
        } else if (goldenSolution && name === goldenSolution) {
            pending.golden = true
        } else if (name.startsWith('solution.')) {
            if (name === goldenSolution) {
                pending.golden = true
            } else {
                pending.alternatives.add(name)
            }
        } else if (/^problem\.\w+\.tex$/.test(name)) {
            pending.statementTex = true
        } else if (
            name === 'handler.yml' ||
            name === 'problem.yml' ||
            /^problem\.\w+\.yml$/.test(name)
        ) {
            pending.ymlSchema = true
        }
        scheduleRun()
    }

    watcher.on('add', onFileEvent)
    watcher.on('change', onFileEvent)

    await printIdleMessage()

    await new Promise<void>((resolveExit, rejectExit) => {
        const onKey = (key: Buffer | string) => {
            const k = typeof key === 'string' ? key : key.toString()
            if (k === 'q' || k === 'Q' || k === '\x03') {
                cleanup()
                tui.print()
                tui.success('Watch stopped')
                resolveExit()
                return
            }
            if (k === 'a' || k === 'A') {
                stopIdleSpinner()
                if (debounceTimer) {
                    clearTimeout(debounceTimer)
                    debounceTimer = null
                }
                pending.inp.clear()
                pending.golden = false
                pending.alternatives.clear()
                pending.statementTex = false
                pending.ymlSchema = false
                pending.changedPaths.clear()
                void (async () => {
                    running = true
                    try {
                        await maker.makeProblem()
                    } catch (e) {
                        tui.error(e instanceof Error ? e.message : String(e))
                    } finally {
                        running = false
                        await printIdleMessage()
                    }
                })()
            }
            if (k === 'l' || k === 'L') {
                stopIdleSpinner()
                void (async () => {
                    running = true
                    try {
                        const results = await lintDirectories([directory])
                        if (results.length === 0) {
                            tui.warning('No problem directories found (looked for handler.yml in the given path(s)).')
                        } else {
                            await printLintResults(results, [directory])
                        }
                    } catch (e) {
                        tui.error(e instanceof Error ? e.message : String(e))
                    } finally {
                        running = false
                        await printIdleMessage()
                    }
                })()
            }
        }

        function cleanup() {
            stopIdleSpinner()
            void watcher.close()
            process.stdin.removeListener('data', onKey)
            if (typeof process.stdin.setRawMode === 'function') {
                process.stdin.setRawMode(false)
            }
            process.stdin.pause()
        }

        process.stdin.resume()
        if (typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(true)
        }
        process.stdin.on('data', (key) => {
            onKey(key)
        })
        process.on('SIGINT', () => {
            cleanup()
            tui.print()
            tui.success('Watch stopped')
            resolveExit()
        })
    })
}
