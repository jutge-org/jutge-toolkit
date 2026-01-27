import path from 'path'
import fs from 'fs/promises'
import { languageKeys } from './data'
import { HandlerInfo, ProblemInfo, StatementInfo } from './types'
import { existsInDir, readYamlInDir } from './utils'

export type ProblemType = 'std' | 'quiz' | 'game'

export type ProblemStructure = 'flat' | 'shallow'

export type Problem = {
    dir: string
    lang: string
    statementInfo: StatementInfo
    handlerInfo: HandlerInfo
    testcases: string[] // list of testcase names (without extensions)
}

export async function loadProblem(dir: string, lang: string): Promise<Problem> {
    const statementInfo = StatementInfo.parse(await readYamlInDir(dir, `problem.${lang}.yml`))

    const handlerInfo = HandlerInfo.parse(await readYamlInDir(dir, 'handler.yml'))

    const testcases: string[] = []
    for await (const entry of fs.glob('*', { cwd: dir })) {
        if (entry.endsWith('.inp')) {
            testcases.push(entry.slice(0, -4)) // remove .inp extension
        }
    }
    testcases.sort()

    return {
        dir,
        lang,
        handlerInfo,
        statementInfo,
        testcases,
    }
}

export type AbstractProblem = {
    dir: string
    structure: ProblemStructure
    problemInfo: ProblemInfo
    problems: Record<string, Problem> // language -> Problem
    languages: string[]
    originalLanguage: string
    originalProblem: Problem
    type: ProblemType
}

export async function loadAbstractProblem(dir: string): Promise<AbstractProblem> {
    dir = path.resolve(dir)

    // Check that dir ends with .pbm
    if (!dir.endsWith('.pbm')) {
        throw new Error(`The directory ${dir} does not seem to be a problem directory (missing .pbm suffix)`)
    }

    // init structure
    const structure = (await existsInDir(dir, 'handler.yml')) ? 'flat' : 'shallow'

    // init problemInfo
    const problemInfo = (await existsInDir(dir, 'problem.yml'))
        ? ProblemInfo.parse(await readYamlInDir(dir, 'problem.yml'))
        : ProblemInfo.parse({})

    // find available languages
    const languages: string[] = []
    for (const lang of languageKeys) {
        if (
            (structure === 'flat' && (await existsInDir(dir, `problem.${lang}.yml`))) ||
            (structure === 'shallow' && (await existsInDir(path.join(dir, lang), `problem.${lang}.yml`)))
        ) {
            languages.push(lang)
        }
    }

    // load problems
    const problems: Record<string, Problem> = {}
    for (const lang of languages) {
        const problemDir = structure === 'flat' ? dir : path.join(dir, lang)
        problems[lang] = await loadProblem(problemDir, lang)
    }

    // determine originalLanguage and originalProblem
    const translations: Problem[] = []
    const originals: Problem[] = []
    for (const problem of Object.values(problems)) {
        const info = problem.statementInfo
        if ('author' in info) {
            originals.push(problem)
        } else {
            translations.push(problem)
        }
    }
    if (originals.length === 0) {
        throw new Error(`No original statement found in problem at ${dir}`)
    }
    if (originals.length > 1) {
        throw new Error(`Multiple original statements found in problem at ${dir}`)
    }
    const originalLanguage = originals[0]!.lang
    const originalProblem = originals[0]!

    // determine problem type
    const originalHandler = problems[originalLanguage]!.handlerInfo.handler
    const type = originalHandler === 'quiz' ? 'quiz' : originalHandler === 'game' ? 'game' : 'std'

    // return the abstract problem
    return {
        dir,
        structure,
        problemInfo,
        languages,
        originalLanguage,
        problems,
        type,
        originalProblem,
    }
}
