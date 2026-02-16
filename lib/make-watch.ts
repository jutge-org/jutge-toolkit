import chokidar from 'chokidar'
import { basename, join, resolve, sep } from 'path'
import { newMaker } from './maker'
import tui from './tui'
import { toolkitPrefix } from './utils'

function isSampleTestcase(testcase: string): boolean {
    return testcase.startsWith('sample')
}

const statementRebuildDebounceMs = 300

/**
 * Run make in watch mode for one problem directory.
 * Does nothing and returns immediately for 'game' and 'quiz' problems.
 */
export async function runWatch(directory: string, problem_nm: string): Promise<void> {
    const maker = await newMaker(directory, problem_nm)
    const { problem } = maker

    if (problem.handler.handler === 'game' || problem.handler.handler === 'quiz') {
        tui.warning(`--watch does nothing for ${problem.handler.handler} problems`)
        return
    }

    tui.title('[watch] Initial full make')
    try {
        await maker.makeProblem()
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        tui.error(`[watch] Initial make failed: ${msg}`)
        return
    }

    tui.print()
    tui.success('Initial make completed.')
    const watchDir = resolve(directory)
    let statementRebuildTimer: ReturnType<typeof setTimeout> | null = null
    let runPromise: Promise<void> = Promise.resolve()

    const printWatchingMessage = () => {
        tui.print()
        tui.title(`Watching for changes in ${tui.hyperlink(watchDir, watchDir)}`)
        tui.print('Press Control-C to stop.')
        tui.print()
    }

    const scheduleStatementRebuild = () => {
        if (statementRebuildTimer) clearTimeout(statementRebuildTimer)
        statementRebuildTimer = setTimeout(() => {
            statementRebuildTimer = null
            runPromise = runPromise.then(async () => {
                tui.print()
                tui.title(`[watch] Rebuilding statements (tex/sample change)`)
                try {
                    await maker.makePdfStatements()
                    await maker.makeFullTextualStatements(['txt', 'html', 'md'])
                    await maker.makeShortTextualStatements(['txt', 'html', 'md'])
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e)
                    tui.error(`[watch] Statements rebuild failed: ${msg}`)
                }
                printWatchingMessage()
            })
        }, statementRebuildDebounceMs)
    }

    const runSerial = (label: string, fn: () => Promise<void>) => {
        void (runPromise = runPromise.then(async () => {
            tui.print()
            tui.title(`[watch] ${label}`)
            try {
                await fn()
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e)
                tui.error(`[watch] ${label} failed: ${msg}`)
            }
            printWatchingMessage()
        }))
    }

    const watcher = chokidar.watch(watchDir, { ignoreInitial: true })

    watcher.on('add', (path) => handleChange(path))
    watcher.on('change', (path) => handleChange(path))

    function handleChange(path: string) {
        if (!path.startsWith(watchDir)) return
        const relativePath = path.slice(watchDir.length).replace(/^[/\\]/, '')
        if (relativePath.includes(sep)) return
        const name = basename(path)
        if (name.startsWith(toolkitPrefix() + '-')) return

        if (problem.solutions.some((s) => basename(s) === name)) {
            if (name === problem.goldenSolution) {
                runSerial('Golden solution changed: recompile and recompute correct outputs', async () => {
                    await maker.makeGoldenExecutable()
                    await maker.makeCorrectOutputs()
                })
            } else {
                runSerial(`Alternative solution ${name} changed: recompile and verify`, async () => {
                    await maker.makeExecutable(name)
                    await maker.verifyCandidate(name)
                })
            }
            return
        }

        if (path.endsWith('.inp')) {
            const testcase = name.replace(/\.inp$/, '')
            runSerial(`Input test ${name} changed: recompute .cor and alternative .out`, async () => {
                await problem.refreshTestcases()
                if (!problem.testcases.includes(testcase)) return
                await maker.makeCorrectOutputsForTestcases([testcase])
                await maker.runAlternativeOutputsForTestcases([testcase])
                if (isSampleTestcase(testcase)) {
                    scheduleStatementRebuild()
                }
            })
            return
        }

        if (path.endsWith('.cor')) {
            const testcase = name.replace(/\.cor$/, '')
            if (isSampleTestcase(testcase)) {
                scheduleStatementRebuild()
            }
            return
        }

        if (name.startsWith('problem.') && name.endsWith('.tex')) {
            scheduleStatementRebuild()
        }
    }

    printWatchingMessage()

    process.on('SIGINT', () => {
        tui.print()
        tui.success('Watch mode stopped.')
        process.exit(0)
    })

    // Keep the process alive; watcher runs until Ctrl-C
    return new Promise<void>(() => {})
}
