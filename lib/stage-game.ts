import { execa } from 'execa'
import { cp, glob, mkdir } from 'fs/promises'
import { join } from 'path'
import type { StagingContext } from './stage-base'
import tui from './tui'
import { existsInDir } from './utils'
import { createZipFromFiles, type FileToArchive } from './zip-creation'

export async function prepareStatements_Game(context: StagingContext, language: string, workDirLang: string) {
    await tui.section('Preparing game statements', async () => {
        const dir = join(workDirLang, 'Doc')

        await tui.section('Generating PDF with xelatex', async () => {
            tui.command('xelatex -interaction=nonstopmode -file-line-error main.tex')
            await execa({ cwd: dir })`xelatex -interaction=nonstopmode -file-line-error main.tex`
            await execa({ cwd: dir })`xelatex -interaction=nonstopmode -file-line-error main.tex`
            await cp(join(dir, 'main.pdf'), join(workDirLang, `problem.${language}.pdf`))
            tui.success(`Generated ${tui.hyperlink(workDirLang, `problem.${language}.pdf`)}`)
        })

        // games have short statements equal to full statements

        await tui.section('Generating TXT with pandoc', async () => {
            tui.command('pandoc --quiet main.tex --to plain --output main.txt')
            await execa({ cwd: dir })`pandoc --quiet main.tex --to plain --output main.txt`
            await cp(join(dir, 'main.txt'), join(workDirLang, `problem.${language}.txt`))
            tui.success(`Generated ${tui.hyperlink(workDirLang, `problem.${language}.txt`)}`)
            await cp(join(dir, 'main.txt'), join(workDirLang, `problem.${language}.short.txt`))
            tui.success(`Generated ${tui.hyperlink(workDirLang, `problem.${language}.short.txt`)}`)
        })

        await tui.section('Generating Markdown with pandoc', async () => {
            tui.command('pandoc --quiet main.tex --to markdown --to markdown-header_attributes --output main.md')
            await execa({
                cwd: dir,
            })`pandoc --quiet main.tex --to markdown --to markdown-header_attributes --output main.md`
            await cp(join(dir, 'main.md'), join(workDirLang, `problem.${language}.md`))
            tui.success(`Generated ${tui.hyperlink(workDirLang, `problem.${language}.md`)}`)
            await cp(join(dir, 'main.md'), join(workDirLang, `problem.${language}.short.md`))
            tui.success(`Generated ${tui.hyperlink(workDirLang, `problem.${language}.short.md`)}`)
        })

        await tui.section('Generating HTML with pandoc', async () => {
            tui.command('pandoc --quiet main.tex --to html --mathml --embed-resources --standalone --output main.html')
            await execa({
                cwd: dir,
            })`pandoc --quiet main.tex --to html --mathml --embed-resources --standalone --output main.html`
            await cp(join(dir, 'main.html'), join(workDirLang, `problem.${language}.html`))
            tui.success(`Generated ${tui.hyperlink(workDirLang, `problem.${language}.html`)}`)
            await cp(join(dir, 'main.html'), join(workDirLang, `problem.${language}.short.html`))
            tui.success(`Generated ${tui.hyperlink(workDirLang, `problem.${language}.short.html`)}`)
        })
    })
}

export async function stageProblemFiles_Game(
    context: StagingContext,
    language: string,
    workDirLang: string,
    stagingDirLang: string,
) {
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

    const src = join(workDirLang, 'Runner')
    const dst = join(stagingDirLang, `problem.pbm`)
    await mkdir(dst, { recursive: true })
    const files = await Array.fromAsync(glob('*', { cwd: src }))
    let count = 0
    for (const file of files) {
        if (accept(file)) {
            await cp(join(src, file), join(dst, file))
            count++
        }
    }
    tui.success(`Staged ${count} files to ${tui.hyperlink(stagingDirLang, 'problem.pbm')}`)
}

export async function stageZip_Game(
    context: StagingContext,
    language: string,
    workDirLang: string,
    stagingDirLang: string,
    problem_id: string,
) {
    const hideList = (context.handlers[context.original_language].game.hide || ['AIDummy.cc']) as string[]
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
        if (await existsInDir(workDirLang, file)) {
            filesToZip.push({
                sourcePath: join(workDirLang, file),
                archivePath: join(`${problem_id}`, file),
            })
        }
    }

    // runner files
    {
        const src = join(workDirLang, 'Runner')
        const files = await Array.fromAsync(glob('*', { cwd: src }))
        for (const file of files) {
            if (accept(file)) {
                filesToZip.push({
                    sourcePath: join(src, file),
                    archivePath: join(`${problem_id}`, 'src', file),
                })
            }
        }
    }

    // Objects
    {
        const src = join(workDirLang, 'Obj')
        const files = await Array.fromAsync(glob('*.o.*', { cwd: src }))
        for (const file of files) {
            filesToZip.push({
                sourcePath: join(src, file),
                archivePath: join(`${problem_id}`, 'src', file),
            })
        }
    }

    // viewer
    {
        const src = join(workDirLang, 'Viewer')
        const files = await Array.fromAsync(glob('**/*', { cwd: src }))
        for (const file of files) {
            filesToZip.push({
                sourcePath: join(src, file),
                archivePath: join(`${problem_id}`, 'src', 'Viewer', file),
            })
        }
    }

    await createZipFromFiles(filesToZip, join(stagingDirLang, `problem.zip`))
    tui.success(`Created ${tui.hyperlink(stagingDirLang, `problem.zip`)} with ${filesToZip.length} files`)
}

export async function stageViewer(
    context: StagingContext,
    language: string,
    workDirLang: string,
    stagingDirLang: string,
) {
    await tui.section('Staging viewer', async () => {
        await cp(join(workDirLang, 'Viewer'), join(stagingDirLang, `viewer`), {
            recursive: true,
        })
        tui.success(`Staged ${tui.hyperlink(stagingDirLang, `viewer`)}`)
    })
}
