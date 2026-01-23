import os from 'os'
import dayjs from 'dayjs'
import { rings } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import { execa } from 'execa'
import { cp, exists, glob, mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { invert } from 'radash'
import tui from '../lib/tui'
import { existsInDir, nanoid8, nothing, readText, readYaml, toolkitPrefix, writeText, writeYaml } from '../lib/utils'
import { createZipFromFiles, type FileToArchive } from './zip-creation'
import tree from 'tree-node-cli'
import { QuizRoot, type ProblemInfo } from './types'
import { packageJson } from './versions'

export class Previewer {
    // directory containing the problem to preview
    directory: string
    // problem name
    problem_nm: string
    // workspace directory to prepare the problem in
    workspace: string

    workDir: string
    exportDir: string
    exportDirLang: string = 'to-be-set'

    // this will be set in the languages loop
    workDirLang: string = 'to-be-set'
    problem_id: string = 'to-be-set'

    // detected languages
    languages: string[] = []
    // detected original language
    original_language: string = ''
    // problem.yml for each language
    problem_ymls: Record<string, any> = {}
    // handler.yml for each language
    handlers: Record<string, any> = {}
    // author name (to be read)
    author: string = ''
    // author email (to be read)
    author_email: string = ''
    // type of problem
    problem_type: 'std' | 'game' | 'quiz' = 'std' // 'circuits' and 'graphics' are 'std' type

    constructor(directory: string, problem_nm: string) {
        this.directory = directory
        this.problem_nm = problem_nm
        this.workspace = join(directory, toolkitPrefix() + '-preview', nanoid8())
        this.workDir = join(this.workspace, 'work')
        this.exportDir = join(this.workspace, 'export', this.problem_nm)
    }

    async prepare() {
        await this.createWorkspace()
        await this.separateByLanguages()
        await this.readMetadata()

        for (const language of this.languages) {
            await tui.section(`Processing language ${language}`, async () => {
                await this.setLanguage(language)
                if (this.problem_type === 'std') {
                    await this.prepareLanguage_Std(language)
                } else if (this.problem_type === 'game') {
                    await this.prepareLanguage_Game(language)
                } else if (this.problem_type === 'quiz') {
                    await this.prepareLanguage_Quizz(language)
                } else {
                    throw new Error(`Unknown problem type: ${this.problem_type as string}`)
                }
            })
        }
        await this.exportFirstToSolve()
        await this.exportInformationYml()
        await this.exportReadMd()

        await tui.section(`Summary`, async () => {
            const readme = join(this.exportDir, 'README.md')
            tui.success('README.md content:')
            await tui.markdown(await readText(readme))
            tui.success('Preview directory:')
            tui.print(tree(this.exportDir))
        })
        tui.success(`Preview directory in ${tui.hyperlink(this.exportDir)}`)
    }

    async prepareLanguage_Std(language: string) {
        await this.prepareStatements_Std(language)
        await this.computeCodeMetrics(language)
        await this.exportProblemFiles_Std(language)
        await this.exportAwards(language)
        await this.prepareStatementsExport(language)
        await this.exportZip_Std(language)
    }

    async prepareLanguage_Game(language: string) {
        await this.prepareStatements_Game(language)
        await this.computeCodeMetrics(language)
        await this.exportProblemFiles_Game(language)
        await this.exportAwards(language)
        await this.prepareStatementsExport(language)
        await this.exportZip_Game(language)
        await this.exportViewer(language)
    }

    async prepareLanguage_Quizz(language: string) {
        await this.exportQuiz(language)
    }

    async setLanguage(language: string) {
        this.workDirLang = join(this.workDir, language)
        this.problem_id = `${this.problem_nm}_${language}`
        this.exportDirLang = join(this.exportDir, language)
        await mkdir(this.exportDirLang, { recursive: true })
    }

    private async createWorkspace() {
        await tui.section(`Creating workspace ${this.workspace}`, async () => {
            if (await exists(this.workspace)) {
                throw new Error(`Workspace directory ${this.workspace} already exists`)
            }
            await mkdir(this.workspace, { recursive: true })
            await mkdir(this.workDir, { recursive: true })
            await mkdir(this.exportDir, { recursive: true })
            tui.directory(this.workspace)
        })
    }

    private doNotCopy(filename: string, language: string) {
        if (filename === 'problem.yml') return true
        if (filename.startsWith(toolkitPrefix())) return true
        const match = filename.match(/^problem\.([a-z][a-z])\.[a-z]*$/)
        if (match && match[1] !== language) return true
        if (filename === `problem.${language}.pdf`) return true // TODO: because some problems may already have a problem.xx.pdf
        return false
    }

    private async separateByLanguages() {
        await tui.section('Detecting if there are language folders or not', async () => {
            const detector = await Array.fromAsync(glob('handler.yml', { cwd: this.directory }))
            if (detector.length === 0) {
                await this.separateByLanguagesWithFolders()
            } else {
                await this.separateByLanguagesWithoutFolders()
            }
        })
    }

    private async separateByLanguagesWithoutFolders() {
        await tui.section('Separating problem by languages without folders', async () => {
            // get all languages
            const ymls = await Array.fromAsync(glob('problem.[a-z][a-z].yml', { cwd: this.directory }))
            const languages = ymls.map((yml) => {
                const match = yml.match(/^problem\.([a-z][a-z])\.yml$/)
                if (!match) {
                    throw new Error(`Unexpected yml file name: ${yml}`)
                }
                return match[1]!
            })
            this.languages = languages

            // for each language, create a directory and copy files
            for (const language of languages) {
                const langDir = join(this.workDir, language)
                await mkdir(langDir, { recursive: true })
                const files = await Array.fromAsync(glob(`*`, { cwd: this.directory }))
                for (const file of files) {
                    if (this.doNotCopy(file, language)) continue
                    await cp(join(this.directory, file), join(langDir, file), { recursive: true })
                }
            }
            tui.success(`Found languages: ${languages.join(', ')}`)
        })
    }

    private async separateByLanguagesWithFolders() {
        await tui.section('Separating problem by languages with folders', async () => {
            // get all languages
            const languages = await Array.fromAsync(glob('[a-z][a-z]', { cwd: this.directory }))
            this.languages = languages

            // for each language, create a directory and copy files
            for (const language of languages) {
                const incommingPbmDirWithLang = join(this.directory, language)
                const langDir = join(this.workDir, language)
                await mkdir(langDir, { recursive: true })
                const files = await Array.fromAsync(glob(`*`, { cwd: incommingPbmDirWithLang }))
                for (const file of files) {
                    if (this.doNotCopy(file, language)) continue
                    await cp(join(incommingPbmDirWithLang, file), join(langDir, file), { recursive: true })
                }
            }
            tui.success(`Found languages: ${languages.join(', ')}`)
        })
    }

    private async readMetadata() {
        await tui.section('Reading problem metadata', async () => {
            // read problem_ymls
            for (const language of this.languages) {
                const path = join(this.workDir, language, `problem.${language}.yml`)
                this.problem_ymls[language] = await readYaml(path)
            }

            // read handlers
            for (const language of this.languages) {
                const path = join(this.workDir, language, `handler.yml`)
                this.handlers[language] = await readYaml(path)
            }

            // find original language
            for (const language of this.languages) {
                const data = this.problem_ymls[language]
                if (data.author) this.author = data.author
                if (data.author) this.original_language = language
                if (data.email) this.author_email = data.email
            }
            if (!this.original_language) throw new Error(`Original language not found in problem.<lang>.yml files`)

            // find problem type
            const originalHandler = this.handlers[this.original_language]
            if (originalHandler.handler === 'game') this.problem_type = 'game'
            else if (originalHandler.handler === 'quiz') this.problem_type = 'quiz'
            else this.problem_type = 'std'

            tui.success(`Problem type: ${this.problem_type}`)
            tui.success(`Original language: ${this.original_language}`)
            tui.success(`Author: ${this.author} <${this.author_email}>`)
        })
    }

    private async findGoldenSolution(language: string) {
        return await tui.section('Finding golden solution', async () => {
            const handler = this.handlers[language].handler
            const compilers = this.handlers[language].compilers || '' // this is only one string!

            let goldenSolution: string

            if (handler === 'circuits') {
                goldenSolution = 'solution.v'
            } else if (compilers === 'RunPython') {
                goldenSolution = 'solution.py'
            } else if (compilers === 'RunHaskell' || compilers === 'GHC') {
                goldenSolution = 'solution.hs'
            } else if (compilers === 'RunClojure' || compilers === 'Clojure') {
                goldenSolution = 'solution.clj'
            } else {
                const solutionProglang = this.handlers[language].solution || 'C++'
                const extension = proglangExtensions[solutionProglang]
                if (!extension) {
                    throw new Error(`Unknown programming language ${solutionProglang} for solution`)
                }
                const goldenSolutionPath = join(this.workDir, language, `solution.${extension}`)
                const fileExists = await exists(goldenSolutionPath)
                if (!fileExists) {
                    throw new Error(`Golden solution file ${goldenSolutionPath} not found`)
                }
                goldenSolution = `solution.${extension}`
            }

            tui.success(`Golden solution: ${goldenSolution}`)
            return goldenSolution
        })
    }

    private async prepareStatements_Std(language: string) {
        await tui.section('Preparing standard statements', async () => {
            const dir = join(this.workDir, language)

            tui.command(`jtk make pdf html md txt --problem_nm ${this.problem_nm}`)
            await execa({
                cwd: dir,
                stdout: 'inherit',
                stderr: 'inherit',
            })`jtk make pdf html md txt --problem_nm ${this.problem_nm}`

            await rm(join(dir, 'jtk-pdf'), { recursive: true, force: true })
            await rm(join(dir, 'jtk-text'), { recursive: true, force: true })

            tui.success('Generated statements')
        })
    }

    private async prepareStatements_Game(language: string) {
        await tui.section('Preparing game statements', async () => {
            const dir = join(this.workDirLang, 'Doc')

            await tui.section('Generating PDF with xelatex', async () => {
                tui.command('xelatex -interaction=nonstopmode -file-line-error main.tex')
                await execa({ cwd: dir })`xelatex -interaction=nonstopmode -file-line-error main.tex`
                await execa({ cwd: dir })`xelatex -interaction=nonstopmode -file-line-error main.tex`
                await cp(join(dir, 'main.pdf'), join(this.workDirLang, `problem.${language}.pdf`))
                tui.success(`Generated ${tui.hyperlink(this.workDirLang, `problem.${language}.pdf`)}`)
            })

            // games have short statements equal to full statements

            await tui.section('Generating TXT with pandoc', async () => {
                tui.command('pandoc --quiet main.tex --to plain --output main.txt')
                await execa({ cwd: dir })`pandoc --quiet main.tex --to plain --output main.txt`
                await cp(join(dir, 'main.txt'), join(this.workDirLang, `problem.${language}.txt`))
                tui.success(`Generated ${tui.hyperlink(this.workDirLang, `problem.${language}.txt`)}`)
                await cp(join(dir, 'main.txt'), join(this.workDirLang, `problem.${language}.short.txt`))
                tui.success(`Generated ${tui.hyperlink(this.workDirLang, `problem.${language}.short.txt`)}`)
            })

            await tui.section('Generating Markdown with pandoc', async () => {
                tui.command('pandoc --quiet main.tex --to markdown --to markdown-header_attributes --output main.md')
                await execa({
                    cwd: dir,
                })`pandoc --quiet main.tex --to markdown --to markdown-header_attributes --output main.md`
                await cp(join(dir, 'main.md'), join(this.workDirLang, `problem.${language}.md`))
                tui.success(`Generated ${tui.hyperlink(this.workDirLang, `problem.${language}.md`)}`)
                await cp(join(dir, 'main.md'), join(this.workDirLang, `problem.${language}.short.md`))
                tui.success(`Generated ${tui.hyperlink(this.workDirLang, `problem.${language}.short.md`)}`)
            })

            await tui.section('Generating HTML with pandoc', async () => {
                tui.command(
                    'pandoc --quiet main.tex --to html --mathml --embed-resources --standalone --output main.html',
                )
                await execa({
                    cwd: dir,
                })`pandoc --quiet main.tex --to html --mathml --embed-resources --standalone --output main.html`
                await cp(join(dir, 'main.html'), join(this.workDirLang, `problem.${language}.html`))
                tui.success(`Generated ${tui.hyperlink(this.workDirLang, `problem.${language}.html`)}`)
                await cp(join(dir, 'main.html'), join(this.workDirLang, `problem.${language}.short.html`))
                tui.success(`Generated ${tui.hyperlink(this.workDirLang, `problem.${language}.short.html`)}`)
            })
        })
    }

    private async computeCodeMetrics(language: string) {
        if (this.problem_type !== 'std') {
            await tui.section('Skipping code metrics', async () => {
                await nothing()
                tui.warning('Code metrics not applicable for this problem type')
            })
            return
        }

        await tui.section('Computing code metrics', async () => {
            const golden_solution = await this.findGoldenSolution(language)
            tui.command(`jutge-code-metrics ${golden_solution}`)
            const { stdout } = await execa({ cwd: this.workDirLang })`jutge-code-metrics ${golden_solution}`
            await writeText(join(this.exportDirLang, `code-metrics.json`), stdout)
            tui.success(`Generated ${tui.hyperlink(this.exportDirLang, `code-metrics.json`)}`)
        })
    }

    private async exportProblemFiles_Std(language: string) {
        const accept = (filename: string) => {
            // general
            if (filename === 'handler.yml') return true
            for (const ext of ['inp', 'cor', 'ops']) {
                if (filename.endsWith(`.${ext}`)) return true
            }
            for (const extension of extensions) {
                if (filename === `solution.${extension}`) return true
                if (filename === `main.${extension}`) return true
            }

            return false
        }

        const dst = join(this.exportDirLang, `problem.pbm`)
        await mkdir(dst, { recursive: true })
        const files = await Array.fromAsync(glob('*', { cwd: this.workDirLang }))
        let count = 0
        for (const file of files) {
            if (accept(file)) {
                await cp(join(this.workDirLang, file), join(dst, file))
                count++
            }
        }
        tui.success(`Exported ${count} files to ${tui.hyperlink(this.exportDirLang, `problem.pbm`)}`)
    }

    private async exportProblemFiles_Game(language: string) {
        const accept = (filename: string) => {
            // general
            if (filename === 'handler.yml') return true
            if (filename === 'Makefile') return true
            if (filename === 'README.txt') return true
            if (filename === 'README.md') return true
            if (filename.endsWith('.cc')) return true
            if (filename.endsWith('.hh')) return true
            if (filename.endsWith('.cnf')) return true

            return false
        }

        const src = join(this.workDirLang, 'Runner')
        const dst = join(this.exportDirLang, `problem.pbm`)
        await mkdir(dst, { recursive: true })
        const files = await Array.fromAsync(glob('*', { cwd: src }))
        let count = 0
        for (const file of files) {
            if (accept(file)) {
                await cp(join(src, file), join(dst, file))
                count++
            }
        }
        tui.success(`Exported ${count} files to ${tui.hyperlink(this.exportDirLang, 'problem.pbm')}`)
    }

    private async exportAwards(language: string) {
        await tui.section('Exporting awards', async () => {
            // we overwrite all awards without language suffix
            let count = 0
            for (const file of ['award.png', 'award.txt']) {
                if (await existsInDir(this.workDirLang, file)) {
                    await cp(join(this.workDirLang, file), join(this.exportDir, file))
                    count++
                }
            }
            if (count > 0) {
                tui.success(`Exported ${count} award file(s)`)
            } else {
                tui.warning('No award files found')
            }
        })
    }

    private async prepareStatementsExport(language: string) {
        await tui.section('Exporting statements', async () => {
            let count = 0
            for (const extension of ['pdf', 'html', 'md', 'txt', 'yml', 'short.html', 'short.md', 'short.txt']) {
                const srcFile = `problem.${language}.${extension}`
                const dstFile = `problem.${extension}`
                if (await existsInDir(this.workDirLang, srcFile)) {
                    await cp(join(this.workDirLang, srcFile), join(this.exportDirLang, dstFile))
                    count++
                }
            }
            tui.success(`Exported ${count} statement file(s)`)
        })
    }

    private async exportFirstToSolve() {
        await tui.section('Exporting first-to-solve avatar', async () => {
            const path = join(this.exportDir, 'first-to-solve.svg')
            const avatar = createAvatar(rings, { seed: this.problem_nm })
            const svg = avatar.toString()
            await writeText(path, svg)
            tui.success(`Generated ${tui.hyperlink(this.exportDir, 'first-to-solve.svg')}`)
        })
    }

    private async exportZip_Std(language: string) {
        const accept = (filename: string) => {
            // general
            for (const extension of ['pdf', 'html', 'md', 'txt']) {
                if (filename === `problem.${language}.${extension}`) return true
            }
            for (const extension of extensions) {
                if (filename === `main.${extension}`) return true
                if (filename === `code.${extension}`) return true
            }
            if (/^(sample|public).*\.(inp|cor)$/.test(filename)) return true

            return false
        }

        const filesToZip: FileToArchive[] = []
        const files = await Array.fromAsync(glob('*', { cwd: this.workDirLang }))
        for (const file of files) {
            if (accept(file)) {
                filesToZip.push({
                    sourcePath: join(this.workDirLang, file),
                    archivePath: join(`${this.problem_id}`, file),
                })
            }
        }

        await createZipFromFiles(filesToZip, join(this.exportDirLang, `problem.zip`))
        tui.success(`Created ${tui.hyperlink(this.exportDirLang, `problem.zip`)} with ${filesToZip.length} files`)
    }

    private async exportZip_Game(language: string) {
        const hideList = (this.handlers[this.original_language].game.hide || ['AIDummy.cc']) as string[]
        const accept = (filename: string) => {
            if (filename.endsWith('.cc') || filename.endsWith('.hh')) {
                return !hideList.includes(filename)
            }
            if (filename.endsWith('.cnf')) return true
            if (filename == 'Makefile') return true
            if (filename == 'README.txt') return true
            if (filename == 'README.md') return true

            return false
        }

        const filesToZip: FileToArchive[] = []

        // statements
        for (const extension of ['pdf', 'html', 'md', 'txt', 'short.html', 'short.md', 'short.txt']) {
            const file = `problem.${language}.${extension}`
            if (await existsInDir(this.workDirLang, file)) {
                filesToZip.push({
                    sourcePath: join(this.workDirLang, file),
                    archivePath: join(`${this.problem_id}`, file),
                })
            }
        }

        // runner files
        {
            const src = join(this.workDirLang, 'Runner')
            const files = await Array.fromAsync(glob('*', { cwd: src }))
            for (const file of files) {
                if (accept(file)) {
                    filesToZip.push({
                        sourcePath: join(src, file),
                        archivePath: join(`${this.problem_id}`, 'src', file),
                    })
                }
            }
        }

        // Objects
        {
            const src = join(this.workDirLang, 'Obj')
            const files = await Array.fromAsync(glob('*.o.*', { cwd: src }))
            for (const file of files) {
                filesToZip.push({
                    sourcePath: join(src, file),
                    archivePath: join(`${this.problem_id}`, 'src', file),
                })
            }
        }

        // viewer
        {
            const src = join(this.workDirLang, 'Viewer')
            const files = await Array.fromAsync(glob('**/*', { cwd: src }))
            for (const file of files) {
                filesToZip.push({
                    sourcePath: join(src, file),
                    archivePath: join(`${this.problem_id}`, 'src', 'Viewer', file),
                })
            }
        }

        await createZipFromFiles(filesToZip, join(this.exportDirLang, `problem.zip`))
        tui.success(`Created ${tui.hyperlink(this.exportDirLang, `problem.zip`)} with ${filesToZip.length} files`)
    }

    private async exportViewer(language: string) {
        await tui.section('Exporting viewer', async () => {
            await cp(join(this.workDirLang, 'Viewer'), join(this.exportDirLang, `viewer`), {
                recursive: true,
            })
            tui.success(`Exported ${tui.hyperlink(this.exportDirLang, `viewer`)}`)
        })
    }

    private async exportQuiz(language: string) {
        await tui.section('Exporting quiz', async () => {
            const quiz = QuizRoot.parse(await readYaml(join(this.workDirLang, 'quiz.yml')))
            const dstDir = join(this.exportDirLang, `quiz.pbm`)
            await mkdir(dstDir, { recursive: true })

            await writeYaml(join(dstDir, 'quiz.yml'), quiz)

            for (const question of quiz.questions) {
                {
                    const src = join(this.workDirLang, `${question.file}.yml`)
                    const dstFile = join(dstDir, `${question.file}.yml`)
                    if (await exists(src)) {
                        await cp(src, dstFile)
                    } else {
                        throw new Error(`Quiz question file ${question.file}.yml not found`)
                    }
                }
                {
                    const src = join(this.workDirLang, `${question.file}.py`)
                    const dstFile = join(dstDir, `${question.file}.py`)
                    if (await exists(src)) {
                        await cp(src, dstFile)
                    }
                }
            }

            tui.success(`Exported ${tui.hyperlink(this.exportDirLang, `quiz`)}`)
        })
    }

    private async exportInformationYml() {
        await tui.section('Exporting information.yml', async () => {
            const info = {
                problem_nm: this.problem_nm,
                languages: this.languages,
                original_language: this.original_language,
                author: this.author,
                author_email: this.author_email,
                problems: this.problem_ymls,
                handlers: this.handlers,
            }

            const infoFile = join(this.exportDir, 'information.yml')
            await writeYaml(infoFile, info)
            tui.success(`Generated ${tui.hyperlink(this.exportDir, 'information.yml')}`)
        })
    }

    private async exportReadMd() {
        await tui.section('Exporting README.md', async () => {
            const version = packageJson.version

            let translations = this.languages
                .map((language) => {
                    const data = this.problem_ymls[language]
                    const title = data.title
                    let item = `- *${language}*: ${title}\n`
                    if (language !== this.original_language) {
                        item += `  ${this.problem_ymls[language].translator} <${this.problem_ymls[language].translator_email}>`
                    } else {
                        item = ''
                    }
                    return item
                })
                .join('\n')

            if (translations.trim()) {
                translations = `## Translations\n\n${translations}`
            }

            const original = this.languages
                .map((language) => {
                    const data = this.problem_ymls[language]
                    const title = data.title
                    let item = `- *${language}*: ${title}\n`
                    if (language !== this.original_language) {
                        item = ''
                    } else {
                        item += `  ${this.problem_ymls[language].author} <${this.problem_ymls[language].email}>`
                    }
                    return item
                })
                .join('\n')

            const text = `
# Preview of problem ${this.problem_nm}

This is the README file for the preview of the problem **${this.problem_nm}** for [Jutge.org](https://jutge.org).

## Author

**${this.author}** <${this.author_email}>

## Original language

${original}

${translations}

## Meta

Type: ${this.problem_type}
Handler: ${this.handlers[this.original_language].handler}
Generated at: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
Generated by: ${os.userInfo().username} using Jutge Toolkit ${version}
Generated on: ${os.hostname()} (${os.type()} ${os.platform()} ${os.release()} ${os.arch()})


© Jutge.org, 2006-${dayjs().year()}
https://jutge.org

`

            const path = join(this.exportDir, 'README.md')
            await writeFile(path, text)
            tui.success(`Generated ${tui.hyperlink(this.exportDir, 'README.md')}`)
        })
    }
}

// TODO!
export const proglangNames: Record<string, string> = {
    c: 'C',
    cc: 'C++',
    py: 'Python3',
    hs: 'Haskell',
    clj: 'Clojure',
    java: 'Java',
    rs: 'Rust',
    v: 'Verilog',
}

// TODO!
export const proglangExtensions: Record<string, string> = invert(proglangNames)

const extensions = Object.keys(proglangNames)
