import { rings } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import dayjs from 'dayjs'
import { cp, exists, glob, mkdir, writeFile } from 'fs/promises'
import os from 'os'
import { join } from 'path'
import tui from './tui'
import { existsInDir, nanoid8, readText, readYaml, toolkitPrefix, writeText, writeYaml } from './utils'
import { packageJson } from './versions'

export type StagingContext = {
    directory: string
    problem_nm: string
    workspace: string
    workDir: string
    stagingDir: string
    languages: string[]
    original_language: string
    problem_ymls: Record<string, any>
    handlers: Record<string, any>
    author: string
    author_email: string
}

export function doNotCopy(filename: string, language: string) {
    if (filename === 'problem.yml') return true
    if (filename.startsWith(toolkitPrefix())) return true
    const match = filename.match(/^problem\.([a-z][a-z])\.[a-z]*$/)
    if (match && match[1] !== language) return true
    if (filename === `problem.${language}.pdf`) return true // TODO: because some problems may already have a problem.xx.pdf
    return false
}

export async function createWorkspace(workspace: string, workDir: string, stagingDir: string) {
    await tui.section(`Creating workspace ${workspace}`, async () => {
        if (await exists(workspace)) {
            throw new Error(`Workspace directory ${workspace} already exists`)
        }
        await mkdir(workspace, { recursive: true })
        await mkdir(workDir, { recursive: true })
        await mkdir(stagingDir, { recursive: true })
        tui.directory(workspace)
    })
}

export async function separateByLanguagesWithoutFolders(directory: string, workDir: string): Promise<string[]> {
    return await tui.section('Separating problem by languages without folders', async () => {
        // get all languages
        const ymls = await Array.fromAsync(glob('problem.[a-z][a-z].yml', { cwd: directory }))
        const languages = ymls.map((yml) => {
            const match = yml.match(/^problem\.([a-z][a-z])\.yml$/)
            if (!match) {
                throw new Error(`Unexpected yml file name: ${yml}`)
            }
            return match[1]!
        })

        // for each language, create a directory and copy files
        for (const language of languages) {
            const langDir = join(workDir, language)
            await mkdir(langDir, { recursive: true })
            const files = await Array.fromAsync(glob(`*`, { cwd: directory }))
            for (const file of files) {
                if (doNotCopy(file, language)) continue
                await cp(join(directory, file), join(langDir, file), { recursive: true })
            }
        }
        tui.success(`Found languages: ${languages.join(', ')}`)
        return languages
    })
}

export async function separateByLanguagesWithFolders(directory: string, workDir: string): Promise<string[]> {
    return await tui.section('Separating problem by languages with folders', async () => {
        // get all languages
        const languages = await Array.fromAsync(glob('[a-z][a-z]', { cwd: directory }))

        // for each language, create a directory and copy files
        for (const language of languages) {
            const incommingPbmDirWithLang = join(directory, language)
            const langDir = join(workDir, language)
            await mkdir(langDir, { recursive: true })
            const files = await Array.fromAsync(glob(`*`, { cwd: incommingPbmDirWithLang }))
            for (const file of files) {
                if (doNotCopy(file, language)) continue
                await cp(join(incommingPbmDirWithLang, file), join(langDir, file), { recursive: true })
            }
        }
        tui.success(`Found languages: ${languages.join(', ')}`)
        return languages
    })
}

export async function separateByLanguages(directory: string, workDir: string): Promise<string[]> {
    return await tui.section('Detecting if there are language folders or not', async () => {
        const detector = await Array.fromAsync(glob('handler.yml', { cwd: directory }))
        if (detector.length === 0) {
            return await separateByLanguagesWithFolders(directory, workDir)
        } else {
            return await separateByLanguagesWithoutFolders(directory, workDir)
        }
    })
}

export async function readMetadata(
    languages: string[],
    workDir: string,
    directory: string,
): Promise<{
    problem_ymls: Record<string, any>
    handlers: Record<string, any>
    original_language: string
    author: string
    author_email: string
}> {
    return await tui.section('Reading problem metadata', async () => {
        const problem_ymls: Record<string, any> = {}
        const handlers: Record<string, any> = {}

        // read problem_ymls
        for (const language of languages) {
            const path = join(workDir, language, `problem.${language}.yml`)
            problem_ymls[language] = await readYaml(path)
        }

        // read handlers
        for (const language of languages) {
            const path = join(workDir, language, `handler.yml`)
            handlers[language] = await readYaml(path)
        }

        // find original language
        let author = ''
        let original_language = ''
        let author_email = ''
        for (const language of languages) {
            const data = problem_ymls[language]
            if (data.author) author = data.author
            if (data.author) original_language = language
            if (data.email) author_email = data.email
        }
        if (!original_language) throw new Error(`Original language not found in problem.<lang>.yml files`)

        tui.success(`Original language: ${original_language}`)
        tui.success(`Author: ${author} <${author_email}>`)

        return {
            problem_ymls,
            handlers,
            original_language,
            author,
            author_email,
        }
    })
}

export async function stageAwards(context: StagingContext, language: string, workDirLang: string, stagingDir: string) {
    await tui.section('Staging awards', async () => {
        // we overwrite all awards without language suffix
        let count = 0
        for (const file of ['award.png', 'award.txt']) {
            if (await existsInDir(workDirLang, file)) {
                await cp(join(workDirLang, file), join(stagingDir, file))
                count++
            }
        }
        if (count > 0) {
            tui.success(`Staged ${count} award file(s)`)
        } else {
            tui.warning('No award files found')
        }
    })
}

export async function stageStatements(context: StagingContext, language: string, workDirLang: string, stagingDirLang: string) {
    await tui.section('Staging statements', async () => {
        let count = 0
        for (const extension of ['pdf', 'html', 'md', 'txt', 'yml', 'short.html', 'short.md', 'short.txt']) {
            const srcFile = `problem.${language}.${extension}`
            const dstFile = `problem.${extension}`
            if (await existsInDir(workDirLang, srcFile)) {
                await cp(join(workDirLang, srcFile), join(stagingDirLang, dstFile))
                count++
            }
        }
        tui.success(`Staged ${count} statement file(s)`)
    })
}

export async function stageFirstToSolve(problem_nm: string, stagingDir: string) {
    await tui.section('Staging first-to-solve avatar', async () => {
        const path = join(stagingDir, 'first-to-solve.svg')
        const avatar = createAvatar(rings, { seed: problem_nm })
        const svg = avatar.toString()
        await writeText(path, svg)
        tui.success(`Generated ${tui.hyperlink(stagingDir, 'first-to-solve.svg')}`)
    })
}

export async function stageInformationYml(context: StagingContext, stagingDir: string) {
    await tui.section('Staging information.yml', async () => {
        const info = {
            problem_nm: context.problem_nm,
            languages: context.languages,
            original_language: context.original_language,
            author: context.author,
            author_email: context.author_email,
            problems: context.problem_ymls,
            handlers: context.handlers,
        }

        const infoFile = join(stagingDir, 'information.yml')
        await writeYaml(infoFile, info)
        tui.success(`Generated ${tui.hyperlink(stagingDir, 'information.yml')}`)
    })
}

export async function stageReadMd(context: StagingContext, stagingDir: string, problem_type: string) {
    await tui.section('Staging README.md', async () => {
        const version = packageJson.version

        let translations = context.languages
            .map((language) => {
                const data = context.problem_ymls[language]
                const title = data.title
                let item = `- *${language}*: ${title}\n`
                if (language !== context.original_language) {
                    item += `  ${context.problem_ymls[language].translator} <${context.problem_ymls[language].translator_email}>`
                } else {
                    item = ''
                }
                return item
            })
            .join('\n')

        if (translations.trim()) {
            translations = `## Translations\n\n${translations}`
        }

        const original = context.languages
            .map((language) => {
                const data = context.problem_ymls[language]
                const title = data.title
                let item = `- *${language}*: ${title}\n`
                if (language !== context.original_language) {
                    item = ''
                } else {
                    item += `  ${context.problem_ymls[language].author} <${context.problem_ymls[language].email}>`
                }
                return item
            })
            .join('\n')

        const text = `
# stage of problem ${context.problem_nm}

This is the README file for the stage of the problem **${context.problem_nm}** for [Jutge.org](https://jutge.org).

## Author

**${context.author}** <${context.author_email}>

## Original language

${original}

${translations}

## Meta

Type: ${problem_type}
Handler: ${context.handlers[context.original_language].handler}
Generated at: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
Generated by: ${os.userInfo().username} using Jutge Toolkit ${version}
Generated on: ${os.hostname()} (${os.type()} ${os.platform()} ${os.release()} ${os.arch()})

© Jutge.org, 2006-${dayjs().year()}
https://jutge.org

`

        const path = join(stagingDir, 'README.md')
        await writeFile(path, text)
        tui.success(`Generated ${tui.hyperlink(stagingDir, 'README.md')}`)
    })
}
