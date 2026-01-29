import chalk from 'chalk'
import { execa } from 'execa'
import { cp, exists, glob, mkdir, rename, rm } from 'fs/promises'
import Handlebars from 'handlebars'
import { imageSizeFromFile } from 'image-size/fromFile'
import { basename, dirname, join, normalize, resolve } from 'path'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'
import { compilersProbesByExtension, getCompilerByExtension, getCompilerById } from '../compilers'
import type { Compiler } from '../compilers/base'
import tui from '../lib/tui'
import {
    existsInDir,
    filesAreEqual,
    fileSize,
    isDirectoryInDir,
    nanoid8,
    nothing,
    projectDir,
    readText,
    toolkitPrefix,
    writeText
} from '../lib/utils'
import { languageNames } from './data'
import * as doctor from './doctor'
import { newProblem, Problem } from './problem'

const latexDir = join(projectDir(), 'assets', 'latex')

export async function newMaker(directory: string, problem_nm: string): Promise<Maker> {
    const problem = await newProblem(directory)
    return new Maker(problem, problem_nm)
}

type ExecutionResult = {
    testcase: string
    time: number
    inputSize: number
    outputSize: number
    error: boolean
}

export class Maker {
    problem: Problem
    problem_nm: string

    public constructor(problem: Problem, problem_nm: string) {
        this.problem = problem
        this.problem_nm = problem_nm
    }

    async showDirectory() {
        await tui.section('Directory', async () => {
            await nothing()
            tui.directory(resolve(this.problem.directory))
            const fullPath = normalize(resolve(this.problem.directory))
            if (!fullPath.endsWith('.pbm')) {
                const lastPath = basename(fullPath)
                const butLastPath = dirname(fullPath)

                if (!Object.keys(languageNames).includes(lastPath) || !butLastPath.endsWith('.pbm')) {
                    throw new Error(
                        'The problem directory should end with .pbm or be a language id inside a .pbm directory',
                    )
                }
            }
        })
    }

    public async makeProblem() {
        if (this.problem.handler.handler === 'game') {
            return await this.makeGameProblem()
        } else if (this.problem.handler.handler === 'quiz') {
            return await this.makeQuizProblem()
        } else {
            await this.makeTarFiles()
            await this.makeGoldenExecutable()
            await this.makeCorrectOutputs()
            await this.checkSolutions()
            await this.makePdfStatements()
            await this.makeFullTextualStatements()
            await this.makeShortTextualStatements()
        }
    }

    async makeQuizProblem() {
        // nothing, but could check that everything is OK
    }

    async makeGameProblem() {
        // TODO: decide whether to clean or not

        const docDir = join(this.problem.directory, 'Doc')
        await tui.section(`Creating documentation in ${tui.hyperlink(this.problem.directory, 'Doc')}`, async () => {
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

        const runnerDir = join(this.problem.directory, 'Runner')
        await tui.section(`Compiling files in ${tui.hyperlink(this.problem.directory, 'Runner')}`, async () => {
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

        const publicDir = join(this.problem.directory, 'Public')
        await tui.section(`Preparing files in ${tui.hyperlink(this.problem.directory, 'Public')}`, async () => {
            await rm(publicDir, { recursive: true, force: true })
            await mkdir(publicDir, { recursive: true })
            const published = []
            const hidden = []
            const patterns = ['README.{txt,md}', 'Makefile', '*.cc', '*.hh', '*.cnf']
            for (const pattern of patterns) {
                const files = await Array.fromAsync(glob(pattern, { cwd: runnerDir }))
                for (const file of files.sort()) {
                    const sourcePath = join(runnerDir, file)
                    const destPath = join(publicDir, file)
                    if (this.problem.handler.game?.hide.includes(file)) {
                        hidden.push(file)
                    } else {
                        published.push(file)
                        await cp(sourcePath, destPath)
                    }
                }
            }
            tui.success(`Published files: ${published.join(' ')}`)
            tui.warning(`Hidden files: ${hidden.join(' ')}`)
        })
    }

    public async makeExecutable(program: string) {
        if (this.problem.handler.handler !== 'circuits') {
            const extension = program.split('.').pop()!
            const probe = compilersProbesByExtension[extension]
            if (!probe) {
                throw new Error(`No compiler found for .${extension} files`)
            }
            if (!(await probe())) {
                throw new Error(`Compiler for .${extension} files is not available`)
            }
        }

        const compiler = this.selectCompiler()
        const newProgram = `${toolkitPrefix()}-${program}`
        await tui.section(
            `Copying ${tui.hyperlink(this.problem.directory, program)} to ${tui.hyperlink(this.problem.directory, newProgram)}`,
            async () => {
                await cp(join(this.problem.directory, program), join(this.problem.directory, newProgram))
            },
        )
        await tui.section(
            `Compiling ${tui.hyperlink(this.problem.directory, newProgram)} with ${compiler.name()} (${this.problem.handler.source_modifier})`,
            async () => {
                try {
                    let outputPath: string
                    if (this.problem.handler.source_modifier === 'none') {
                        outputPath = await compiler.compileNormal(
                            this.problem.handler,
                            this.problem.directory,
                            newProgram,
                        )
                    } else if (this.problem.handler.source_modifier === 'no_main') {
                        outputPath = await compiler.compileWithMain(
                            this.problem.handler,
                            this.problem.directory,
                            newProgram,
                        )
                    } else {
                        throw new Error(`Unknown source modifier: ${this.problem.handler.source_modifier as string}`)
                    }
                    if (!(await exists(join(this.problem.directory, outputPath)))) {
                        throw new Error(`Compilation failed for ${newProgram}`)
                    }
                    tui.success(`Compiled ${newProgram} to ${outputPath}`)
                } catch (error) {
                    throw new Error(`Compilation failed ${error as any}`)
                }
            },
        )
    }

    public async makeExecutables() {
        await tui.section('Compiling solutions', async () => {
            for (const solution of this.problem.solutions) {
                await this.makeExecutable(solution)
            }
        })
    }

    public async makeGoldenExecutable() {
        await tui.section(
            `Compiling golden solution from ${tui.hyperlink(this.problem.directory, this.problem.goldenSolution!)}`,
            async () => {
                if (!this.problem.goldenSolution) {
                    throw new Error('Golden solution not set')
                }
                await this.makeExecutable(this.problem.goldenSolution)
            },
        )
    }

    public async checkSolutions() {
        for (const solution of this.problem.solutions) {
            if (solution !== this.problem.goldenSolution) {
                await this.verifyCandidate(solution)
            }
        }
    }

    async makeCorrectOutput(testcase: string, compiler: Compiler, sourcePath: string): Promise<ExecutionResult> {
        return await this.runTestcase(
            testcase,
            `${testcase}.inp`,
            `${testcase}.cor`,
            compiler,
            toolkitPrefix() + '-' + sourcePath,
        )
    }

    async runTestcase(
        testcase: string,
        input: string,
        output: string,
        compiler: Compiler,
        sourcePath: string,
    ): Promise<ExecutionResult> {
        let error = false
        const start = Date.now()
        try {
            await compiler.execute(this.problem.handler, this.problem.directory, sourcePath, input, output)
        } catch (e) {
            tui.error(`Execution failed for testcase '${testcase}'`)
            error = true
        }
        const end = Date.now()
        const time = end - start

        if (this.problem.handler.handler === 'graphic') {
            await rename(join(this.problem.directory, 'output.png'), join(this.problem.directory, output))
        }

        const inputSize = await fileSize(join(this.problem.directory, input))
        const outputSize = await fileSize(join(this.problem.directory, output))

        return { testcase, error, time, inputSize, outputSize }
    }

    selectCompiler(): Compiler {
        if (this.problem.handler.compilers === 'PRO2') {
            return getCompilerById('PRO2')
        } else if (this.problem.handler.compilers === 'RunPython') {
            return getCompilerById('RunPython')
        } else if (this.problem.handler.compilers === 'RunHaskell') {
            return getCompilerById('RunHaskell')
        } else if (this.problem.handler.compilers === 'RunClojure') {
            return getCompilerById('RunClojure')
        } else {
            const extension = this.problem.goldenSolution!.split('.').pop()!
            return getCompilerByExtension(extension)
        }
    }

    public async makeCorrectOutputs() {
        const compiler = this.selectCompiler()
        await tui.section(`Making correct outputs with golden solution`, async () => {
            await tui.section(`Using ${compiler.name()}`, async () => {
                const results: ExecutionResult[] = []

                for (const testcase of this.problem.testcases) {
                    results.push(await this.makeCorrectOutput(testcase, compiler, this.problem.goldenSolution!))
                }

                tui.print()
                tui.print(`testcase           time      input     output`)
                for (const result of results) {
                    const time = prettyMs(result.time)
                    const inputSize = prettyBytes(result.inputSize).replace(' ', '')
                    const outputSize = prettyBytes(result.outputSize).replace(' ', '')
                    tui.print(
                        (result.error ? chalk.red : chalk.green)(
                            `${result.testcase.padEnd(12)} ${time.padStart(10)} ${inputSize.padStart(10)} ${outputSize.padStart(
                                10,
                            )}`,
                        ),
                    )
                }

                const errors = results.filter((result) => result.error).length
                if (errors > 0) {
                    tui.print()
                    throw new Error(`${errors} errors occurred while making correct answers`)
                }
            })
        })
    }

    public async makePdfStatements() {
        await tui.section('Making PDF statements', async () => {
            const tmpDirBase = join(this.problem.directory, toolkitPrefix() + '-pdf', nanoid8())
            await mkdir(tmpDirBase, { recursive: true })
            await tui.section('Creating working directory', async () => {
                await nothing()
                tui.directory(tmpDirBase)
            })
            for (const language of this.problem.languages) {
                if (
                    this.problem.structure === 'multi' ||
                    (this.problem.structure === 'single' && language === this.problem.language)
                ) {
                    await tui.section(`Making PDF statement for ${languageNames[language]}`, async () => {
                        await this.makePdfStatement(tmpDirBase, language)
                    })
                }
            }
        })
    }

    async makeSamples(tmpDir: string, language: string): Promise<[string, string]> {
        const graphic = this.problem.handler.handler === 'graphic'
        const samples1col: string[] = []
        const samples2col: string[] = []
        let index = 1
        for (const testcase of this.problem.testcases) {
            if (testcase.startsWith('sample')) {
                let size = ''
                if (graphic) {
                    await cp(join(this.problem.directory, `${testcase}.cor`), join(tmpDir, `${testcase}.cor.png`))
                    const dimensions = await imageSizeFromFile(join(tmpDir, `${testcase}.cor.png`))
                    size = `(${dimensions.width}$\\times$${dimensions.height})`
                }
                samples1col.push(`\n\\SampleOneColInputOutput[${size}]{${testcase}}{${index}}\n`)
                samples2col.push(`\n\\SampleTwoColInputOutput[${size}]{${testcase}}{${index}}\n`)
                index++
            }
        }
        return [samples1col.join('\n'), samples2col.join('\n')]
    }

    async makePdfStatement(tmpDirBase: string, language: string) {
        const tmpDir = join(tmpDirBase, language)
        await mkdir(tmpDir)

        const date = new Date().toISOString()
        const year = new Date().getFullYear()
        const author = this.problem.problemLangYmls[this.problem.originalLanguage!].author || 'Unknown'
        const authorEmail = this.problem.problemLangYmls[this.problem.originalLanguage!].author_email || 'unknown email'
        const translator = this.problem.problemLangYmls[language].translator || ''

        const [samples1c, samples2c] = await this.makeSamples(tmpDir, language)

        const rootTemplate = await readText(join(latexDir, 'root-pdf.tpl.tex'))

        // because Handlebars escapes curly braces, we need to define a helper to help latex macros
        Handlebars.registerHelper('curly', function (value) {
            return '{' + value + '}'
        })

        const root = Handlebars.compile(rootTemplate)({
            language,
            jutgeLanguage: `jutge.${language}`,
            id: `${this.problem_nm}\\_${language}`,
            samples1c,
            samples2c,
            author,
            translator,
            date,
            year,
        })

        // copy files to tmpDir
        // TODO: only copy needed files
        for await (const entry of glob('*', { cwd: this.problem.directory })) {
            if (
                entry.startsWith(toolkitPrefix()) ||
                entry.endsWith('.exe') ||
                entry.endsWith('.html') ||
                entry.endsWith('.md') ||
                entry.endsWith('.txt') ||
                (await isDirectoryInDir(this.problem.directory, entry))
            ) {
                continue
            }
            await cp(join(this.problem.directory, entry), join(tmpDir, entry))
        }

        // hack for problems that already have original pdf (CodeWars)
        if (await exists(join(tmpDir, `original.${language}.pdf`))) {
            tui.warning(`Found original.${language}.pdf`)
            await cp(join(tmpDir, `original.${language}.pdf`), join(this.problem.directory, `problem.${language}.pdf`))
            return
        }

        // write root.tex
        await writeText(join(tmpDir, 'root.tex'), root)

        // tweak the tex file
        const tex1 = await readText(join(tmpDir, `problem.${language}.tex`))
        const tex2 = tex1
            .replace(/\\begin{htmlonly}[\s\S]*?\\end{htmlonly}/g, '')
            .replace(/\\begin{latexonly}/g, '')
            .replace(/\\end{latexonly}/g, '')
            .replace(/\.eps}/g, '}')
        await writeText(join(tmpDir, `problem.${language}.tex`), tex2)

        // copy style files
        await this.copyStyleFiles(tmpDir, language)

        // check latex engine
        if (!(await doctor.probeXeLaTeX())) {
            tui.error('xelatex not found')
            return
        }

        // latex
        try {
            tui.command('xelatex -interaction=nonstopmode -file-line-error root.tex')
            await execa({
                stderr: 'inherit',
                // stdout: 'inherit',
                cwd: tmpDir,
            })`xelatex -interaction=nonstopmode -file-line-error root.tex`
            await cp(join(tmpDir, 'root.pdf'), join(this.problem.directory, `problem.${language}.pdf`))
            tui.success(
                `Generated ${tui.hyperlink(this.problem.directory, `problem.${language}.pdf`)} see ${tui.hyperlink(tmpDir, `root.log`)}`,
            )
        } catch (e) {
            tui.error(`Error in LaTeX: ${tui.hyperlink(tmpDir, `root.log`)}`)
        }
    }

    async copyStyleFiles(tmpDir: string, language: string) {
        const cpSty = async (path: string) => {
            const source = join(projectDir(), 'assets', 'sty', path)
            await cp(source, join(tmpDir, path))
        }
        await cpSty('picins.sty')
        await cpSty('jutge.sty')
        if (language === 'ca') await cpSty('jutge.ca.sty')
        if (language === 'es') await cpSty('jutge.es.sty')
        if (language === 'en') await cpSty('jutge.en.sty')
        if (language === 'fr') await cpSty('jutge.fr.sty')
        if (language === 'de') await cpSty('jutge.de.sty')
    }

    public async makeFullTextualStatements(tasks: Array<'txt' | 'html' | 'md'> = ['txt', 'html', 'md']) {
        await this.makeTextualStatements(tasks, 'full')
    }

    public async makeShortTextualStatements(tasks: Array<'txt' | 'html' | 'md'> = ['txt', 'html', 'md']) {
        await this.makeTextualStatements(tasks, 'short')
    }

    public async makeTextualStatements(
        tasks: Array<'txt' | 'html' | 'md'> = ['txt', 'html', 'md'],
        type: 'full' | 'short',
    ) {
        await tui.section(`Making textual statements (${type})`, async () => {
            const tmpDirBase = join(this.problem.directory, toolkitPrefix() + '-text', nanoid8())
            await mkdir(tmpDirBase, { recursive: true })
            await tui.section('Creating working directory', async () => {
                await nothing()
                tui.directory(tmpDirBase)
            })
            try {
                for (const language of this.problem.languages) {
                    if (
                        this.problem.structure === 'multi' ||
                        (this.problem.structure === 'single' && language === this.problem.language)
                    ) {
                        await tui.section(
                            `Making ${type} textual statements for ${languageNames[language]}`,
                            async () => {
                                await this.makeTextualStatement(tmpDirBase, language, tasks, type)
                            },
                        )
                    }
                }
            } finally {
                // do not clean up because of hyperlinks
            }
        })
    }

    async makeTextualStatement(
        tmpDirBase: string,
        language: string,
        tasks: Array<'txt' | 'html' | 'md'>,
        type: 'full' | 'short',
    ) {
        const tmpDir = join(tmpDirBase, language)
        await mkdir(tmpDir)

        const date = new Date().toISOString()
        const year = new Date().getFullYear()
        const author = this.problem.problemLangYmls[language].author || 'Unknown'
        const authorEmail = this.problem.problemLangYmls[language].author_email || 'unknown email'
        const translator = this.problem.problemLangYmls[language].translator || ''

        const rootTemplate = await readText(join(latexDir, `root-text-${type}.tpl.tex`))

        // because Handlebars escapes curly braces, we need to define a helper to help latex macros
        Handlebars.registerHelper('curly', function (value) {
            return '{' + value + '}'
        })

        const root = Handlebars.compile(rootTemplate)({
            language,
            jutgeLanguage: `jutge.${language}`,
            id: `${this.problem_nm}\\_${language}`,
            year,
            author,
            translator,
            date,
        })

        // copy files to tmpDir
        // TODO: only copy needed files
        for await (const entry of glob('*', { cwd: this.problem.directory })) {
            if (
                entry.startsWith(toolkitPrefix()) ||
                entry.endsWith('.exe') ||
                entry.endsWith('.html') ||
                entry.endsWith('.md') ||
                entry.endsWith('.txt') ||
                (await isDirectoryInDir(this.problem.directory, entry))
            ) {
                continue
            }
            await cp(join(this.problem.directory, entry), join(tmpDir, entry))
        }

        // hack for problems that already have original pdf (CodeWars)
        if (await exists(join(tmpDir, `original.${language}.pdf`))) {
            tui.warning(`Found original.${language}.pdf`)
            return
        }

        const filename = type === 'full' ? `problem.${language}` : `problem.${language}.short`

        // write root.tex
        await writeText(join(tmpDir, 'root.tex'), root)

        // tweak the tex file
        const tex1 = await readText(join(tmpDir, `problem.${language}.tex`))
        const tex2 = tex1
            .replace(/\\begin{latexonly}[\s\S]*?\\end{latexonly}/g, '')
            .replace(/\\begin{htmlonly}/g, '')
            .replace(/\\end{htmlonly}/g, '')
            .replace(/\\begin{minipage}/g, '')
            .replace(/\\end{minipage}/g, '')
        await writeText(join(tmpDir, `problem.${language}.tex`), tex2)

        // copy style files
        await this.copyStyleFiles(tmpDir, language)

        // check pandoc engine
        if (!(await doctor.probePandoc())) {
            tui.error('pandoc with lua support not found')
            return
        }

        // create lua files
        const luaSource = join(projectDir(), 'assets', 'lua', 'fixCodeBlocks.lua')
        await cp(luaSource, join(tmpDir, 'fixCodeBlocks.lua'))

        // txt
        if (tasks.includes('txt')) {
            try {
                tui.command('pandoc --quiet root.tex --to plain --output root.txt')
                await execa({ cwd: tmpDir })`pandoc --quiet root.tex --to plain --output root.txt`
                await cp(join(tmpDir, 'root.txt'), join(this.problem.directory, `${filename}.txt`))
                tui.success('Generated ' + tui.hyperlink(this.problem.directory, `${filename}.txt`))
            } catch (e) {
                tui.error(`pandoc error: ${e instanceof Error ? e.message : 'unknown error'}`)
            }
        }

        // md
        if (tasks.includes('md')) {
            try {
                tui.command(
                    'pandoc --quiet root.tex --to markdown --to markdown-header_attributes --lua-filter=fixCodeBlocks.lua --output root.md',
                )
                await execa({
                    cwd: tmpDir,
                })`pandoc --quiet root.tex --to markdown --to markdown-header_attributes --lua-filter=fixCodeBlocks.lua --output root.md`
                await cp(join(tmpDir, 'root.md'), join(this.problem.directory, `${filename}.md`))
                tui.success('Generated ' + tui.hyperlink(this.problem.directory, `${filename}.md`))
            } catch (e) {
                tui.error(`pandoc error: ${e instanceof Error ? e.message : 'unknown error'}`)
            }
        }

        // html
        if (tasks.includes('html')) {
            try {
                tui.command('pandoc --quiet root.tex --to html --mathml --embed-resources --output root.html')
                await execa({
                    cwd: tmpDir,
                })`pandoc --quiet root.tex --to html --mathml --embed-resources --output root.html`
                await cp(join(tmpDir, 'root.html'), join(this.problem.directory, `${filename}.html`))
                tui.success('Generated ' + tui.hyperlink(this.problem.directory, `${filename}.html`))
            } catch (e) {
                tui.error(`pandoc error: ${e instanceof Error ? e.message : 'unknown error'}`)
            }
        }
    }

    public async verifyCandidate(program: string) {
        await tui.section(`Verifying ${program}`, async () => {
            const extension = program.split('.').pop()!

            const probe = compilersProbesByExtension[extension]
            if (!probe) {
                throw new Error(`No compiler found for .${extension} files`)
            }
            if (!(await probe())) {
                tui.warning(`Compiler for .${extension} files is not available, skipping verification of ${program}`)
                return
            }

            const compiler = getCompilerByExtension(extension)
            const newProgram = `${toolkitPrefix()}-${program}`

            await tui.section(
                `Copying ${tui.hyperlink(this.problem.directory, program)} to ${tui.hyperlink(this.problem.directory, newProgram)}`,
                async () => {
                    await cp(join(this.problem.directory, program), join(this.problem.directory, newProgram))
                },
            )

            await tui.section(
                `Using compiler ${compiler.name()} to compile ${tui.hyperlink(this.problem.directory, newProgram)}`,
                async () => {
                    try {
                        let outputPath: string
                        if (this.problem.handler.source_modifier === 'none') {
                            outputPath = await compiler.compileNormal(
                                this.problem.handler,
                                this.problem.directory,
                                newProgram,
                            )
                        } else if (this.problem.handler.source_modifier === 'no_main') {
                            outputPath = await compiler.compileWithMain(
                                this.problem.handler,
                                this.problem.directory,
                                newProgram,
                            )
                        } else {
                            throw new Error(
                                `Unknown source modifier: ${this.problem.handler.source_modifier as string}`,
                            )
                        }
                        if (!(await exists(join(this.problem.directory, outputPath)))) {
                            throw new Error(`Compilation failed for ${newProgram}`)
                        }
                        tui.success(`Compiled ${newProgram} to ${outputPath}`)
                    } catch (error) {
                        throw new Error(`Compilation failed: ${error as any}`)
                    }
                },
            )

            const results: ExecutionResult[] = []
            await tui.section('Executing testcases', async () => {
                for (const testcase of this.problem.testcases) {
                    results.push(
                        await this.runTestcase(
                            testcase,
                            `${testcase}.inp`,
                            `${toolkitPrefix()}-${testcase}.${extension}.out`,
                            compiler,
                            newProgram,
                        ),
                    )
                }

                tui.print()
                tui.print(`testcase           time     status`)
                let errors = 0
                for (const result of results) {
                    const status = result.error
                        ? 'EE'
                        : (await filesAreEqual(
                                join(this.problem.directory, `${result.testcase}.cor`),
                                join(this.problem.directory, `${toolkitPrefix()}-${result.testcase}.${extension}.out`),
                            ))
                          ? 'OK'
                          : 'WA'
                    const time = prettyMs(result.time)
                    tui.print(
                        (status !== 'OK' ? chalk.red : chalk.green)(
                            `${result.testcase.padEnd(12)} ${time.padStart(10)} ${status.padStart(10)}`,
                        ),
                    )
                    if (status !== 'OK') errors++
                }
                tui.print()

                if (errors) {
                    tui.error(`${errors} errors found for ${program}`)
                } else {
                    tui.success(`All testcases passed successfully for ${program}`)
                }
            })
        })
    }


    public async makeTarFiles() {
        const { handler, directory } = this.problem
        const { compilers } = handler

        //
        // NOTE(pauek): In 'MakePRO2' and 'PRO2' compilers we have to
        // create '.tar' files as well as copy them later
        //
        if (compilers === 'PRO2' || compilers === 'MakePRO2') {
            await tui.section('Making `.tar` files', async () => {
                // Create 'public.tar', 'private.tar' and 'solution.tar'
                for (const dir of ['public', 'private', 'solution']) {
                    if (await existsInDir(directory, dir)) {
                        const { exitCode } = await execa({
                            reject: false,
                            stderr: 'inherit',
                            stdout: 'inherit',
                            cwd: join(directory, dir),
                        })`tar cf ../${dir}.tar .`
    
                        if (exitCode !== 0) {
                            console.log(exitCode)
                            throw new Error(`Error making ${dir}.tar`)
                        }
    
                        tui.success(`Created ${tui.hyperlink(directory, `${dir}.tar`)}`)
                    }
                }
            })
        }

        // Other compilers do not need .tar files presumably
    }
}
