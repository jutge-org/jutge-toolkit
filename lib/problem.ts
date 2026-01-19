// TODO: add AbstractProblem class that has child Problems (and they an have AbstractProblem as parent)

import { exists, glob } from 'fs/promises'
import { imageSizeFromFile } from 'image-size/fromFile'
import { basename, join, normalize, sep } from 'path'
import tui from './tui'
import { nothing, readYamlInDir } from './utils'
import { languageNames } from './data'
import { Handler, ProblemInfo, Scores } from './types'

export async function newProblem(directory: string): Promise<Problem> {
    const problem = new Problem(directory)
    await problem.load()
    return problem
}

// TODO: find better names for 'multi' and 'single'
export type Structure = 'multi' | 'single'

export class Problem {
    directory: string
    structure: Structure = 'multi'
    language: string | null = null
    handler!: Handler
    languages: string[] = []
    originalLanguage: string | null = null
    problemYml: ProblemInfo | null = null // TODO: use this field
    problemLangYmls: Record<string, any> = {}
    solutions: string[] = []
    goldenSolution: string | null = null
    testcases: string[] = []

    constructor(directory: string) {
        if (directory === '.' || directory === './' || !directory) {
            this.directory = normalize(process.cwd())
        } else {
            this.directory = normalize(join(directory, '.'))
        }
    }

    public async load() {
        await tui.section(`Loading problem from ${this.directory}`, async () => {
            await this.loadStructure()
            await this.loadLanguages()
            await this.loadHandler()
            await this.loadProblemYml()
            await this.loadOriginalLanguage()
            if (this.handler.handler !== 'game') {
                await this.loadSolutions()
                await this.loadGoldenSolution()
                await this.loadTestcases()
                await this.loadScores()
            }
            await this.loadAwards()
        })

        let errors = false
        if (!this.originalLanguage) {
            tui.error('No original language found')
            errors = true
        }
        if (!this.goldenSolution && this.handler.handler !== 'game') {
            tui.error('No golden solution found')
            errors = true
        }
        if (errors) {
            throw new Error('Inspection failed due to errors')
        }
    }

    private async loadStructure() {
        await tui.section('Determining structure', async () => {
            await nothing()
            if (this.directory.endsWith('.pbm')) {
                this.structure = 'multi'
            } else {
                this.structure = 'single'
            }
            console.log(this.structure)
        })
    }

    private async loadLanguages() {
        await tui.section('Loading languages', async () => {
            if (this.structure === 'multi') {
                await this.loadLanguagesMulti()
            } else {
                await this.loadLanguagesSingle()
            }
        })
    }

    private async loadLanguagesMulti() {
        const files = await Array.fromAsync(glob('problem.*.yml', { cwd: this.directory }))
        const languages = files
            .map((file) => {
                const match = file.match(/problem\.(.+)\.yml/)
                return match ? match[1] : null
            })
            .filter((language) => language && language in languageNames)
        this.languages = languages as string[]
        tui.yaml(this.languages)

        for (const language of this.languages) {
            await tui.section(`Loading problem.${language}.yml`, async () => {
                this.problemLangYmls[language] = await readYamlInDir(this.directory, `problem.${language}.yml`)
                tui.yaml(this.problemLangYmls[language])
            })
        }
    }

    private async loadLanguagesSingle() {
        for (const language of Object.keys(languageNames)) {
            const name = join(this.directory, '..', language, `problem.${language}.yml`)
            if (await exists(name)) {
                this.languages.push(language)
            }
        }
        tui.yaml(this.languages)

        for (const language of this.languages) {
            await tui.section(`Loading ..${sep}${language}${sep}problem.${language}.yml`, async () => {
                this.problemLangYmls[language] = await readYamlInDir(
                    join(this.directory, '..', language),
                    `problem.${language}.yml`,
                )
                tui.yaml(this.problemLangYmls[language])
            })
        }

        this.language = basename(this.directory)
    }

    private async loadHandler() {
        await tui.section('Loading handler.yml', async () => {
            const data = await readYamlInDir(this.directory, 'handler.yml')
            this.handler = Handler.parse(data)
            if (this.handler.source_modifier === 'structs') {
                tui.warning(
                    'source_modifier "structs" is deprecated, using "no_main" instead. please update handler.yml',
                )
                this.handler.source_modifier = 'no_main'
            }

            if (this.handler.handler === 'circuits') {
                this.handler.solution = 'Verilog'
            }

            tui.yaml(this.handler)

            if (this.handler.handler === 'quiz') {
                throw new Error('Handler "quiz" is not supported yet')
            }
        })
    }

    private async loadScores() {
        await tui.section('Loading scores.yml', async () => {
            if (await exists(join(this.directory, 'scores.yml'))) {
                const data = await readYamlInDir(this.directory, 'scores.yml')
                const scores = Scores.parse(data)
                tui.yaml(scores)
            } else {
                tui.print('scores.yml not defined')
            }
        })
    }

    private async loadProblemYml() {
        await tui.section('Loading problem.yml', async () => {
            if (await exists(join(this.directory, 'problem.yml'))) {
                const data = await readYamlInDir(this.directory, 'problem.yml')
                const problemInfo = ProblemInfo.parse(data)
                tui.yaml(problemInfo)
            } else {
                tui.print('problem.yml not defined')
            }
        })
    }

    private async loadOriginalLanguage() {
        await tui.section('Determining original language', async () => {
            await nothing()
            for (const language of this.languages) {
                if ('author' in this.problemLangYmls[language]) {
                    this.originalLanguage = language
                    break
                }
            }
            if (!this.originalLanguage) {
                throw new Error('No original language found (a language with an author field)')
            }
            tui.print(this.originalLanguage)
        })
    }

    private async loadSolutions() {
        await tui.section('Loading solutions', async () => {
            const { proglangNames } = await import('./data')
            const comaSeparatedExtensions = Object.keys(proglangNames).join(',')
            const files = await Array.fromAsync(glob(`solution.{${comaSeparatedExtensions}}`, { cwd: this.directory }))
            this.solutions = files.sort()
            tui.yaml(this.solutions)
            if (this.solutions.length === 0) throw new Error('No solutions found')
        })
    }

    private async loadGoldenSolution() {
        await tui.section('Determining golden solution', async () => {
            const { proglangExtensions } = await import('./data')

            if (this.handler.handler === 'circuits') {
                this.goldenSolution = 'solution.v'
            } else if (this.handler.compilers === 'RunPython') {
                this.goldenSolution = 'solution.py'
            } else if (this.handler.compilers === 'RunHaskell' || this.handler.compilers === 'GHC') {
                this.goldenSolution = 'solution.hs'
            } else if (this.handler.compilers === 'RunClojure' || this.handler.compilers === 'Clojure') {
                this.goldenSolution = 'solution.clj'
            } else {
                const solutionProglang = this.handler.solution
                const extension = proglangExtensions[solutionProglang]
                if (!extension) {
                    throw new Error(`Unknown programming language ${solutionProglang} for solution`)
                }
                const goldenSolutionPath = join(this.directory, `solution.${extension}`)
                const fileExists = await exists(goldenSolutionPath)
                if (!fileExists) {
                    throw new Error(`Golden solution file ${goldenSolutionPath} not found`)
                }
                this.goldenSolution = `solution.${extension}`
            }
            tui.print(this.goldenSolution)
        })
    }

    private async loadTestcases() {
        await tui.section('Loading testcases', async () => {
            const files = await Array.fromAsync(glob('*.inp', { cwd: this.directory }))
            this.testcases = files.map((file) => file.replace('.inp', '')).sort()
            tui.yaml(this.testcases)
        })
    }

    private async loadAwards() {
        await tui.section('Loading awards', async () => {
            if (await exists(join(this.directory, 'award.html'))) {
                tui.success(tui.hyperlink(this.directory, 'award.html') + ' found')
            } else {
                tui.warning('award.html not found')
            }

            if (await exists(join(this.directory, 'award.png'))) {
                tui.success(tui.hyperlink(this.directory, 'award.png') + ' found')
                const dimensions = await imageSizeFromFile(join(this.directory, 'award.png'))
                await tui.image(join(this.directory, 'award.png'), 6, 3)
                tui.print(`${dimensions.width}x${dimensions.height}`)
            } else {
                tui.warning('award.png not found')
            }
        })
    }
}
