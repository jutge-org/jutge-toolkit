import path from 'path'
import fs from 'fs/promises'
import { execa } from 'execa'
import Handlebars from 'handlebars'
import { imageSizeFromFile } from 'image-size/fromFile'
import chalk from 'chalk'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'
import tui from './tui'
import { filesAreEqual, fileSize, isDirectoryInDir, projectDir, readText, toolkitPrefix, writeText } from './utils'
import * as doctor from './doctor'
import { compilersProbesByExtension, getCompilerByExtension, getCompilerById } from '../compilers'
import type { Compiler } from '../compilers/base'
import type { AbstractProblem, Problem } from './new-problem'
import type { StatementInfoOriginal, StatementInfoTranslation } from './types'
import { languageNames, proglangExtensions } from './data'

const latexDir = path.join(projectDir(), 'assets', 'latex')

function shouldMake(tasks: string[], task: string): boolean {
    return tasks.includes('all') || tasks.includes(task)
}

export async function makeStd(aproblem: AbstractProblem, problem_nm: string, tasks: string[]) {
    //

    tui.action(`Creating work directory`)
    const workDir = path.join(aproblem.dir, toolkitPrefix() + '-make')
    await fs.mkdir(workDir, { recursive: true })
    tui.directory(workDir)

    if (aproblem.structure === 'flat') {
        await makeStdFlat(aproblem, problem_nm, tasks, workDir)
    } else {
        await makeStdShallow(aproblem, problem_nm, tasks, workDir)
    }
}

async function makeStdFlat(aproblem: AbstractProblem, problem_nm: string, tasks: string[], workDir: string) {
    await tui.section(`Making problem`, async () => {
        if (shouldMake(tasks, 'exe')) {
            await makeGoldenExecutable(aproblem, aproblem.originalProblem)
        }
        if (shouldMake(tasks, 'cor')) {
            await makeCorrectOutputs(aproblem, aproblem.originalProblem)
        }
        for (const problem of Object.values(aproblem.problems)) {
            if (shouldMake(tasks, 'pdf')) {
                await makePdfStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'html')) {
                await makeHtmlStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'md')) {
                await makeMarkdownStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'txt')) {
                await makeTextStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'short.html')) {
                await makeShortHtmlStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'short.md')) {
                await makeShortMarkdownStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'short.txt')) {
                await makeShortTextStatement(aproblem, problem, problem_nm, workDir)
            }
        }
    })
}

async function makeStdShallow(aproblem: AbstractProblem, problem_nm: string, tasks: string[], workDir: string) {
    for (const problem of Object.values(aproblem.problems)) {
        await tui.section(`Making problem for ${languageNames[problem.lang]}`, async () => {
            if (shouldMake(tasks, 'exe')) {
                await makeGoldenExecutable(aproblem, problem)
            }
            if (shouldMake(tasks, 'cor')) {
                await makeCorrectOutputs(aproblem, problem)
            }
            if (shouldMake(tasks, 'pdf')) {
                await makePdfStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'html')) {
                await makeHtmlStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'md')) {
                await makeMarkdownStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'txt')) {
                await makeTextStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'short.html')) {
                await makeShortHtmlStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'short.md')) {
                await makeShortMarkdownStatement(aproblem, problem, problem_nm, workDir)
            }
            if (shouldMake(tasks, 'short.txt')) {
                await makeShortTextStatement(aproblem, problem, problem_nm, workDir)
            }
        })
    }
}

async function makePdfStatement(aproblem: AbstractProblem, problem: Problem, problem_nm: string, workDir: string) {
    //

    const lang = problem.lang
    const tmpDir = path.join(workDir, lang)
    await fs.mkdir(tmpDir, { recursive: true })

    const date = new Date().toISOString()
    const year = new Date().getFullYear()
    const author = (aproblem.originalProblem.statementInfo as StatementInfoOriginal).author || 'Unknown'
    const translator = (problem.statementInfo as StatementInfoTranslation).translator || 'Unknown'

    const [samples1c, samples2c] = await makeSamples(problem, tmpDir, lang)

    const rootTemplate = await readText(path.join(latexDir, 'root-pdf.tpl.tex'))

    // because Handlebars escapes curly braces, we need to define a helper to help latex macros
    Handlebars.registerHelper('curly', function (value) {
        return '{' + value + '}'
    })

    const root = Handlebars.compile(rootTemplate)({
        language: lang,
        jutgeLanguage: `jutge.${lang}`,
        id: `${problem_nm}\\_${lang}`,
        samples1c,
        samples2c,
        author,
        translator,
        date,
        year,
    })

    // copy files to tmpDir
    // TODO: only copy needed files
    for await (const entry of fs.glob('*', { cwd: problem.dir })) {
        if (
            entry.startsWith(toolkitPrefix()) ||
            entry.endsWith('.exe') ||
            entry.endsWith('.html') ||
            entry.endsWith('.md') ||
            entry.endsWith('.txt') ||
            (await isDirectoryInDir(problem.dir, entry))
        ) {
            continue
        }
        await fs.cp(path.join(problem.dir, entry), path.join(tmpDir, entry))
    }

    // hack for problems that already have original pdf (CodeWars)
    if (await fs.exists(path.join(tmpDir, `original.${lang}.pdf`))) {
        tui.warning(`Found original.${lang}.pdf`)
        await fs.cp(path.join(tmpDir, `original.${lang}.pdf`), path.join(problem.dir, `problem.${lang}.pdf`))
        return
    }

    // write root.tex
    await writeText(path.join(tmpDir, 'root.tex'), root)

    // tweak the tex file
    const tex1 = await readText(path.join(tmpDir, `problem.${lang}.tex`))
    const tex2 = tex1
        .replace(/\\begin{htmlonly}[\s\S]*?\\end{htmlonly}/g, '')
        .replace(/\\begin{latexonly}/g, '')
        .replace(/\\end{latexonly}/g, '')
        .replace(/\.eps}/g, '}')
    await writeText(path.join(tmpDir, `problem.${lang}.tex`), tex2)

    // copy style files
    await copyStyleFiles(tmpDir, lang)

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
        await fs.cp(path.join(tmpDir, 'root.pdf'), path.join(problem.dir, `problem.${lang}.pdf`))
        tui.success(
            `Generated ${tui.hyperlink(problem.dir, `problem.${lang}.pdf`)} see ${tui.hyperlink(tmpDir, `root.log`)}`,
        )
    } catch (e) {
        tui.error(`Error in LaTeX: ${tui.hyperlink(tmpDir, `root.log`)}`)
    }
}

type PreparedTexResult = {
    tmpDir: string
    lang: string
}

async function prepareTexForPandoc(
    aproblem: AbstractProblem,
    problem: Problem,
    problem_nm: string,
    workDir: string,
): Promise<PreparedTexResult | null> {
    //

    const lang = problem.lang
    const tmpDir = path.join(workDir, lang)
    await fs.mkdir(tmpDir, { recursive: true })

    const date = new Date().toISOString()
    const year = new Date().getFullYear()
    const author = (aproblem.originalProblem.statementInfo as StatementInfoOriginal).author || 'Unknown'
    const translator = (problem.statementInfo as StatementInfoTranslation).translator || 'Unknown'

    const [samples1c, samples2c] = await makeSamples(problem, tmpDir, lang)

    const rootTemplate = await readText(path.join(latexDir, 'root-pdf.tpl.tex'))

    // because Handlebars escapes curly braces, we need to define a helper to help latex macros
    Handlebars.registerHelper('curly', function (value) {
        return '{' + value + '}'
    })

    const root = Handlebars.compile(rootTemplate)({
        language: lang,
        jutgeLanguage: `jutge.${lang}`,
        id: `${problem_nm}\\_${lang}`,
        samples1c,
        samples2c,
        author,
        translator,
        date,
        year,
    })

    // copy files to tmpDir
    // TODO: only copy needed files
    for await (const entry of fs.glob('*', { cwd: problem.dir })) {
        if (
            entry.startsWith(toolkitPrefix()) ||
            entry.endsWith('.exe') ||
            entry.endsWith('.html') ||
            entry.endsWith('.md') ||
            entry.endsWith('.txt') ||
            (await isDirectoryInDir(problem.dir, entry))
        ) {
            continue
        }
        await fs.cp(path.join(problem.dir, entry), path.join(tmpDir, entry))
    }

    // write root.tex
    await writeText(path.join(tmpDir, 'root.tex'), root)

    // tweak the tex file for pandoc generation (remove latexonly, keep htmlonly content)
    const tex1 = await readText(path.join(tmpDir, `problem.${lang}.tex`))
    const tex2 = tex1
        .replace(/\\begin{latexonly}[\s\S]*?\\end{latexonly}/g, '')
        .replace(/\\begin{htmlonly}/g, '')
        .replace(/\\end{htmlonly}/g, '')
        .replace(/\.eps}/g, '}')
    await writeText(path.join(tmpDir, `problem.${lang}.tex`), tex2)

    // copy style files
    await copyStyleFiles(tmpDir, lang)

    return { tmpDir, lang }
}

async function prepareTexForPandocShort(
    aproblem: AbstractProblem,
    problem: Problem,
    problem_nm: string,
    workDir: string,
): Promise<PreparedTexResult | null> {
    //

    const lang = problem.lang
    const tmpDir = path.join(workDir, lang)
    await fs.mkdir(tmpDir, { recursive: true })

    const date = new Date().toISOString()
    const year = new Date().getFullYear()
    const author = (aproblem.originalProblem.statementInfo as StatementInfoOriginal).author || 'Unknown'
    const translator = (problem.statementInfo as StatementInfoTranslation).translator || 'Unknown'

    const rootTemplate = await readText(path.join(latexDir, 'root-text-short.tpl.tex'))

    // because Handlebars escapes curly braces, we need to define a helper to help latex macros
    Handlebars.registerHelper('curly', function (value) {
        return '{' + value + '}'
    })

    const root = Handlebars.compile(rootTemplate)({
        language: lang,
        jutgeLanguage: `jutge.${lang}`,
        id: `${problem_nm}\\_${lang}`,
        author,
        translator,
        date,
        year,
    })

    // copy files to tmpDir
    // TODO: only copy needed files
    for await (const entry of fs.glob('*', { cwd: problem.dir })) {
        if (
            entry.startsWith(toolkitPrefix()) ||
            entry.endsWith('.exe') ||
            entry.endsWith('.html') ||
            entry.endsWith('.md') ||
            entry.endsWith('.txt') ||
            (await isDirectoryInDir(problem.dir, entry))
        ) {
            continue
        }
        await fs.cp(path.join(problem.dir, entry), path.join(tmpDir, entry))
    }

    // write root.tex
    await writeText(path.join(tmpDir, 'root.tex'), root)

    // tweak the tex file for pandoc generation (remove latexonly, keep htmlonly content, remove minipage)
    const tex1 = await readText(path.join(tmpDir, `problem.${lang}.tex`))
    const tex2 = tex1
        .replace(/\\begin{latexonly}[\s\S]*?\\end{latexonly}/g, '')
        .replace(/\\begin{htmlonly}/g, '')
        .replace(/\\end{htmlonly}/g, '')
        .replace(/\\begin{minipage}/g, '')
        .replace(/\\end{minipage}/g, '')
        .replace(/\.eps}/g, '}')
    await writeText(path.join(tmpDir, `problem.${lang}.tex`), tex2)

    // copy style files
    await copyStyleFiles(tmpDir, lang)

    return { tmpDir, lang }
}

async function makeHtmlStatement(aproblem: AbstractProblem, problem: Problem, problem_nm: string, workDir: string) {
    //

    const prepared = await prepareTexForPandoc(aproblem, problem, problem_nm, workDir)
    if (!prepared) {
        return
    }

    const { tmpDir, lang } = prepared

    // check pandoc engine
    if (!(await doctor.probePandoc())) {
        tui.error('pandoc with lua support not found')
        return
    }

    // html
    try {
        tui.command('pandoc --quiet root.tex --to html --mathml --embed-resources --output root.html')
        await execa({
            cwd: tmpDir,
        })`pandoc --quiet root.tex --to html --mathml --embed-resources --output root.html`
        await fs.cp(path.join(tmpDir, 'root.html'), path.join(problem.dir, `problem.${lang}.html`))
        tui.success(`Generated ${tui.hyperlink(problem.dir, `problem.${lang}.html`)}`)
    } catch (e) {
        tui.error(`Error in pandoc: ${e instanceof Error ? e.message : String(e)}`)
    }
}

async function makeMarkdownStatement(aproblem: AbstractProblem, problem: Problem, problem_nm: string, workDir: string) {
    //

    const prepared = await prepareTexForPandoc(aproblem, problem, problem_nm, workDir)
    if (!prepared) {
        return
    }

    const { tmpDir, lang } = prepared

    // check pandoc engine
    if (!(await doctor.probePandoc())) {
        tui.error('pandoc with lua support not found')
        return
    }

    // create lua files
    const luaSource = path.join(projectDir(), 'assets', 'lua', 'fixCodeBlocks.lua')
    await fs.cp(luaSource, path.join(tmpDir, 'fixCodeBlocks.lua'))

    // markdown
    try {
        tui.command(
            'pandoc --quiet root.tex --to markdown --to markdown-header_attributes --lua-filter=fixCodeBlocks.lua --output root.md',
        )
        await execa({
            cwd: tmpDir,
        })`pandoc --quiet root.tex --to markdown --to markdown-header_attributes --lua-filter=fixCodeBlocks.lua --output root.md`
        await fs.cp(path.join(tmpDir, 'root.md'), path.join(problem.dir, `problem.${lang}.md`))
        tui.success(`Generated ${tui.hyperlink(problem.dir, `problem.${lang}.md`)}`)
    } catch (e) {
        tui.error(`Error in pandoc: ${e instanceof Error ? e.message : String(e)}`)
    }
}

async function makeTextStatement(aproblem: AbstractProblem, problem: Problem, problem_nm: string, workDir: string) {
    //

    const prepared = await prepareTexForPandoc(aproblem, problem, problem_nm, workDir)
    if (!prepared) {
        return
    }

    const { tmpDir, lang } = prepared

    // check pandoc engine
    if (!(await doctor.probePandoc())) {
        tui.error('pandoc with lua support not found')
        return
    }

    // text
    try {
        tui.command('pandoc --quiet root.tex --to plain --output root.txt')
        await execa({
            cwd: tmpDir,
        })`pandoc --quiet root.tex --to plain --output root.txt`
        await fs.cp(path.join(tmpDir, 'root.txt'), path.join(problem.dir, `problem.${lang}.txt`))
        tui.success(`Generated ${tui.hyperlink(problem.dir, `problem.${lang}.txt`)}`)
    } catch (e) {
        tui.error(`Error in pandoc: ${e instanceof Error ? e.message : String(e)}`)
    }
}

async function makeShortHtmlStatement(
    aproblem: AbstractProblem,
    problem: Problem,
    problem_nm: string,
    workDir: string,
) {
    //

    const prepared = await prepareTexForPandocShort(aproblem, problem, problem_nm, workDir)
    if (!prepared) {
        return
    }

    const { tmpDir, lang } = prepared

    // check pandoc engine
    if (!(await doctor.probePandoc())) {
        tui.error('pandoc with lua support not found')
        return
    }

    // html
    try {
        tui.command('pandoc --quiet root.tex --to html --mathml --embed-resources --output root.html')
        await execa({
            cwd: tmpDir,
        })`pandoc --quiet root.tex --to html --mathml --embed-resources --output root.html`
        await fs.cp(path.join(tmpDir, 'root.html'), path.join(problem.dir, `problem.${lang}.short.html`))
        tui.success(`Generated ${tui.hyperlink(problem.dir, `problem.${lang}.short.html`)}`)
    } catch (e) {
        tui.error(`Error in pandoc: ${e instanceof Error ? e.message : String(e)}`)
    }
}

async function makeShortMarkdownStatement(
    aproblem: AbstractProblem,
    problem: Problem,
    problem_nm: string,
    workDir: string,
) {
    //

    const prepared = await prepareTexForPandocShort(aproblem, problem, problem_nm, workDir)
    if (!prepared) {
        return
    }

    const { tmpDir, lang } = prepared

    // check pandoc engine
    if (!(await doctor.probePandoc())) {
        tui.error('pandoc with lua support not found')
        return
    }

    // create lua files
    const luaSource = path.join(projectDir(), 'assets', 'lua', 'fixCodeBlocks.lua')
    await fs.cp(luaSource, path.join(tmpDir, 'fixCodeBlocks.lua'))

    // markdown
    try {
        tui.command(
            'pandoc --quiet root.tex --to markdown --to markdown-header_attributes --lua-filter=fixCodeBlocks.lua --output root.md',
        )
        await execa({
            cwd: tmpDir,
        })`pandoc --quiet root.tex --to markdown --to markdown-header_attributes --lua-filter=fixCodeBlocks.lua --output root.md`
        await fs.cp(path.join(tmpDir, 'root.md'), path.join(problem.dir, `problem.${lang}.short.md`))
        tui.success(`Generated ${tui.hyperlink(problem.dir, `problem.${lang}.short.md`)}`)
    } catch (e) {
        tui.error(`Error in pandoc: ${e instanceof Error ? e.message : String(e)}`)
    }
}

async function makeShortTextStatement(
    aproblem: AbstractProblem,
    problem: Problem,
    problem_nm: string,
    workDir: string,
) {
    //

    const prepared = await prepareTexForPandocShort(aproblem, problem, problem_nm, workDir)
    if (!prepared) {
        return
    }

    const { tmpDir, lang } = prepared

    // check pandoc engine
    if (!(await doctor.probePandoc())) {
        tui.error('pandoc with lua support not found')
        return
    }

    // text
    try {
        tui.command('pandoc --quiet root.tex --to plain --output root.txt')
        await execa({
            cwd: tmpDir,
        })`pandoc --quiet root.tex --to plain --output root.txt`
        await fs.cp(path.join(tmpDir, 'root.txt'), path.join(problem.dir, `problem.${lang}.short.txt`))
        tui.success(`Generated ${tui.hyperlink(problem.dir, `problem.${lang}.short.txt`)}`)
    } catch (e) {
        tui.error(`Error in pandoc: ${e instanceof Error ? e.message : String(e)}`)
    }
}

async function makeSamples(problem: Problem, tmpDir: string, language: string): Promise<[string, string]> {
    const graphic = problem.handlerInfo.handler === 'graphic'
    const samples1col: string[] = []
    const samples2col: string[] = []
    let index = 1
    for (const testcase of problem.testcases) {
        if (testcase.startsWith('sample')) {
            let size = ''
            if (graphic) {
                await fs.cp(path.join(problem.dir, `${testcase}.cor`), path.join(tmpDir, `${testcase}.cor.png`))
                const dimensions = await imageSizeFromFile(path.join(tmpDir, `${testcase}.cor.png`))
                size = `(${dimensions.width}$\\times$${dimensions.height})`
            }
            samples1col.push(`\n\\SampleOneColInputOutput[${size}]{${testcase}}{${index}}\n`)
            samples2col.push(`\n\\SampleTwoColInputOutput[${size}]{${testcase}}{${index}}\n`)
            index++
        }
    }
    return [samples1col.join('\n'), samples2col.join('\n')]
}

async function copyStyleFiles(tmpDir: string, language: string) {
    const cpSty = async (p: string) => {
        const source = path.join(projectDir(), 'assets', 'sty', p)
        await fs.cp(source, path.join(tmpDir, p))
    }
    await cpSty('picins.sty')
    await cpSty('jutge.sty')
    if (language === 'ca') await cpSty('jutge.ca.sty')
    if (language === 'es') await cpSty('jutge.es.sty')
    if (language === 'en') await cpSty('jutge.en.sty')
    if (language === 'fr') await cpSty('jutge.fr.sty')
    if (language === 'de') await cpSty('jutge.de.sty')
}

type ExecutionResult = {
    testcase: string
    time: number
    inputSize: number
    outputSize: number
    error: boolean
}

async function findSolutions(problem: Problem): Promise<string[]> {
    const { proglangNames } = await import('./data')
    const comaSeparatedExtensions = Object.keys(proglangNames).join(',')
    const files = await Array.fromAsync(fs.glob(`solution.{${comaSeparatedExtensions}}`, { cwd: problem.dir }))
    return files.sort()
}

async function findGoldenSolution(problem: Problem): Promise<string | null> {
    const handler = problem.handlerInfo.handler
    const compilers = problem.handlerInfo.compilers

    if (handler === 'circuits') {
        return 'solution.v'
    } else if (compilers === 'RunPython') {
        return 'solution.py'
    } else if (compilers === 'RunHaskell' || compilers === 'GHC') {
        return 'solution.hs'
    } else if (compilers === 'RunClojure' || compilers === 'Clojure') {
        return 'solution.clj'
    } else if (compilers === 'PRO2') {
        return 'solution.cc'
    } else {
        const solutionProglang = problem.handlerInfo.solution
        if (!solutionProglang) {
            return 'solution.cc'
        }
        const extension = proglangExtensions[solutionProglang]
        if (!extension) {
            throw new Error(`Unknown programming language ${solutionProglang} for solution`)
        }
        const goldenSolutionPath = path.join(problem.dir, `solution.${extension}`)
        const fileExists = await fs.exists(goldenSolutionPath)
        if (!fileExists) {
            throw new Error(`Golden solution file ${goldenSolutionPath} not found`)
        }
        return `solution.${extension}`
    }
}

function selectCompiler(problem: Problem, goldenSolution: string | null): Compiler {
    if (problem.handlerInfo.compilers === 'RunPython') {
        return getCompilerById('RunPython')
    } else if (problem.handlerInfo.compilers === 'RunHaskell') {
        return getCompilerById('RunHaskell')
    } else if (problem.handlerInfo.compilers === 'RunClojure') {
        return getCompilerById('RunClojure')
    } else {
        if (!goldenSolution) {
            throw new Error('Golden solution not set')
        }
        const extension = goldenSolution.split('.').pop()!
        return getCompilerByExtension(extension)
    }
}

async function makeExecutable(problem: Problem, program: string): Promise<void> {
    if (problem.handlerInfo.handler !== 'circuits') {
        const extension = program.split('.').pop()!
        const probe = compilersProbesByExtension[extension]
        if (!probe) {
            throw new Error(`No compiler found for .${extension} files`)
        }
        if (!(await probe())) {
            throw new Error(`Compiler for .${extension} files is not available`)
        }
    }

    let compiler: Compiler
    if (problem.handlerInfo.compilers === 'RunPython') {
        compiler = getCompilerById('RunPython')
    } else if (problem.handlerInfo.compilers === 'RunHaskell') {
        compiler = getCompilerById('RunHaskell')
    } else if (problem.handlerInfo.compilers === 'RunClojure') {
        compiler = getCompilerById('RunClojure')
    } else {
        const extension = program.split('.').pop()!
        compiler = getCompilerByExtension(extension)
    }

    const newProgram = `${toolkitPrefix()}-${program}`

    await tui.section(
        `Copying ${tui.hyperlink(problem.dir, program)} to ${tui.hyperlink(problem.dir, newProgram)}`,
        async () => {
            await fs.cp(path.join(problem.dir, program), path.join(problem.dir, newProgram))
        },
    )

    await tui.section(
        `Compiling ${tui.hyperlink(problem.dir, newProgram)} with ${compiler.name()} (${problem.handlerInfo.source_modifier})`,
        async () => {
            try {
                let outputPath: string
                if (problem.handlerInfo.source_modifier === 'none') {
                    outputPath = await compiler.compileNormal(problem.handlerInfo, problem.dir, newProgram)
                } else if (problem.handlerInfo.source_modifier === 'no_main') {
                    outputPath = await compiler.compileWithMain(problem.handlerInfo, problem.dir, newProgram)
                } else {
                    throw new Error(`Unknown source modifier: ${problem.handlerInfo.source_modifier as string}`)
                }
                if (!(await fs.exists(path.join(problem.dir, outputPath)))) {
                    throw new Error(`Compilation failed for ${newProgram}`)
                }
                tui.success(`Compiled ${newProgram} to ${outputPath}`)
            } catch (error) {
                throw new Error(`Compilation failed`)
            }
        },
    )
}

async function runTestcase(
    problem: Problem,
    testcase: string,
    input: string,
    output: string,
    compiler: Compiler,
    sourcePath: string,
): Promise<ExecutionResult> {
    let error = false
    const start = Date.now()
    try {
        await compiler.execute(problem.handlerInfo, problem.dir, sourcePath, input, output)
    } catch (e) {
        tui.error(`Execution failed for testcase '${testcase}'`)
        error = true
    }
    const end = Date.now()
    const time = end - start

    if (problem.handlerInfo.handler === 'graphic') {
        await fs.rename(path.join(problem.dir, 'output.png'), path.join(problem.dir, output))
    }

    const inputSize = await fileSize(path.join(problem.dir, input))
    const outputSize = await fileSize(path.join(problem.dir, output))

    return { testcase, error, time, inputSize, outputSize }
}

async function makeGoldenExecutable(aproblem: AbstractProblem, problem: Problem) {
    const goldenSolution = await findGoldenSolution(problem)
    if (!goldenSolution) {
        throw new Error('Golden solution not set')
    }

    await tui.section(`Compiling golden solution from ${tui.hyperlink(problem.dir, goldenSolution)}`, async () => {
        await makeExecutable(problem, goldenSolution)
    })
}

async function makeCorrectOutputs(aproblem: AbstractProblem, problem: Problem) {
    //

    const goldenSolution = await findGoldenSolution(problem)
    if (!goldenSolution) {
        throw new Error('Golden solution not set')
    }

    const compiler = selectCompiler(problem, goldenSolution)
    await tui.section(`Making correct outputs with golden solution`, async () => {
        await tui.section(`Using ${compiler.name()}`, async () => {
            const results: ExecutionResult[] = []

            for (const testcase of problem.testcases) {
                results.push(
                    await runTestcase(
                        problem,
                        testcase,
                        `${testcase}.inp`,
                        `${testcase}.cor`,
                        compiler,
                        `${toolkitPrefix()}-${goldenSolution}`,
                    ),
                )
            }

            console.log()
            console.log(`testcase           time      input     output`)
            for (const result of results) {
                const time = prettyMs(result.time)
                const inputSize = prettyBytes(result.inputSize).replace(' ', '')
                const outputSize = prettyBytes(result.outputSize).replace(' ', '')
                console.log(
                    (result.error ? chalk.red : chalk.green)(
                        `${result.testcase.padEnd(12)} ${time.padStart(10)} ${inputSize.padStart(10)} ${outputSize.padStart(
                            10,
                        )}`,
                    ),
                )
            }

            const errors = results.filter((result) => result.error).length
            if (errors > 0) {
                console.log()
                throw new Error(`${errors} errors occurred while making correct answers`)
            }
        })
    })
}

async function checkSolutions(aproblem: AbstractProblem, problem: Problem, problem_nm: string, workDir: string) {
    //

    const solutions = await findSolutions(problem)
    const goldenSolution = await findGoldenSolution(problem)

    for (const solution of solutions) {
        if (solution !== goldenSolution) {
            await verifyCandidate(aproblem, problem, problem_nm, workDir, solution)
        }
    }
}

async function verifyCandidate(
    aproblem: AbstractProblem,
    problem: Problem,
    problem_nm: string,
    workDir: string,
    program: string,
) {
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
            `Copying ${tui.hyperlink(problem.dir, program)} to ${tui.hyperlink(problem.dir, newProgram)}`,
            async () => {
                await fs.cp(path.join(problem.dir, program), path.join(problem.dir, newProgram))
            },
        )

        await tui.section(
            `Using compiler ${compiler.name()} to compile ${tui.hyperlink(problem.dir, newProgram)}`,
            async () => {
                try {
                    let outputPath: string
                    if (problem.handlerInfo.source_modifier === 'none') {
                        outputPath = await compiler.compileNormal(problem.handlerInfo, problem.dir, newProgram)
                    } else if (problem.handlerInfo.source_modifier === 'no_main') {
                        outputPath = await compiler.compileWithMain(problem.handlerInfo, problem.dir, newProgram)
                    } else {
                        throw new Error(`Unknown source modifier: ${problem.handlerInfo.source_modifier as string}`)
                    }
                    if (!(await fs.exists(path.join(problem.dir, outputPath)))) {
                        throw new Error(`Compilation failed for ${newProgram}`)
                    }
                    tui.success(`Compiled ${newProgram} to ${outputPath}`)
                } catch (error) {
                    throw new Error(`Compilation failed`)
                }
            },
        )

        const results: ExecutionResult[] = []
        await tui.section('Executing testcases', async () => {
            for (const testcase of problem.testcases) {
                results.push(
                    await runTestcase(
                        problem,
                        testcase,
                        `${testcase}.inp`,
                        `${toolkitPrefix()}-${testcase}.${extension}.out`,
                        compiler,
                        newProgram,
                    ),
                )
            }

            console.log()
            console.log(`testcase           time     status`)
            let errors = 0
            for (const result of results) {
                const status = result.error
                    ? 'EE'
                    : (await filesAreEqual(
                            path.join(problem.dir, `${result.testcase}.cor`),
                            path.join(problem.dir, `${toolkitPrefix()}-${result.testcase}.${extension}.out`),
                        ))
                      ? 'OK'
                      : 'WA'
                const time = prettyMs(result.time)
                console.log(
                    (status !== 'OK' ? chalk.red : chalk.green)(
                        `${result.testcase.padEnd(12)} ${time.padStart(10)} ${status.padStart(10)}`,
                    ),
                )
                if (status !== 'OK') errors++
            }
            console.log()

            if (errors) {
                tui.error(`${errors} errors found for ${program}`)
            } else {
                tui.success(`All testcases passed successfully for ${program}`)
            }
        })
    })
}
