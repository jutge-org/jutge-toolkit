import { exists, glob } from 'fs/promises'
import { join, normalize, resolve } from 'path'
import { languageNames } from './data'
import { findRealDirectories } from './helpers'
import { Handler, ProblemInfo, ProblemLangYml } from './types'
import { readYamlInDir, readTextInDir } from './utils'
import tui from './tui'

const TESTCASE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/

export type LintSeverity = 'error' | 'warning'

export interface LintIssue {
    severity: LintSeverity
    code: string
    message: string
    path?: string
}

export interface LintResult {
    directory: string
    issues: LintIssue[]
}

function err(code: string, message: string, path?: string): LintIssue {
    return { severity: 'error', code, message, path }
}

function warn(code: string, message: string, path?: string): LintIssue {
    return { severity: 'warning', code, message, path }
}

export async function lintDirectory(directory: string): Promise<LintResult> {
    const dir = directory === '.' ? normalize(resolve(process.cwd())) : resolve(directory)
    const issues: LintIssue[] = []

    // --- handler.yml ---
    const handlerPath = join(dir, 'handler.yml')
    if (!(await exists(handlerPath))) {
        issues.push(err('MISSING_HANDLER', 'handler.yml is required', 'handler.yml'))
    } else {
        try {
            const data = await readYamlInDir(dir, 'handler.yml')
            Handler.parse(data)
        } catch (e) {
            issues.push(
                err(
                    'HANDLER_SCHEMA',
                    `handler.yml schema error: ${e instanceof Error ? e.message : String(e)}`,
                    'handler.yml',
                ),
            )
        }
    }

    // --- problem.yml (optional; created on upload) ---
    const problemYmlPath = join(dir, 'problem.yml')
    if (await exists(problemYmlPath)) {
        try {
            const data = await readYamlInDir(dir, 'problem.yml')
            ProblemInfo.parse(data)
        } catch (e) {
            issues.push(
                err(
                    'PROBLEM_YML_SCHEMA',
                    `problem.yml schema error: ${e instanceof Error ? e.message : String(e)}`,
                    'problem.yml',
                ),
            )
        }
    }

    // --- problem.LANG.tex / problem.LANG.yml and statement structure ---
    const langYmlFiles = (await Array.fromAsync(glob('problem.*.yml', { cwd: dir }))).filter((f) => {
        const m = f.match(/^problem\.(.+)\.yml$/)
        const lang = m?.[1]
        return !!lang && lang in languageNames
    })

    if (langYmlFiles.length === 0) {
        issues.push(
            err('NO_LANGUAGES', 'At least one problem.<lang>.yml is required (e.g. problem.en.yml, problem.ca.yml)'),
        )
    }

    let hasOriginalLanguage = false
    const languages: string[] = []
    const langMeta: Record<string, { hasAuthor: boolean; originalLanguage?: string }> = {}
    for (const file of langYmlFiles) {
        const lang = file.replace(/^problem\.(.+)\.yml$/, '$1')
        languages.push(lang)
        try {
            const data = await readYamlInDir(dir, file)
            ProblemLangYml.parse(data)
            const hasAuthor = 'author' in data
            if (hasAuthor) hasOriginalLanguage = true
            const originalLanguage =
                typeof data.original_language === 'string' && data.original_language !== ''
                    ? data.original_language
                    : undefined
            langMeta[lang] = { hasAuthor, originalLanguage }
            if ('translator' in data && data.translator !== undefined) {
                if (data.original_language === undefined || data.original_language === '') {
                    issues.push(
                        warn(
                            'TRANSLATION_ORIGINAL_LANGUAGE',
                            `problem.${lang}.yml (translation) should set original_language`,
                            file,
                        ),
                    )
                }
            }
        } catch (e) {
            issues.push(
                err('LANG_YML_SCHEMA', `${file} schema error: ${e instanceof Error ? e.message : String(e)}`, file),
            )
        }

        const texFile = `problem.${lang}.tex`
        const texPath = join(dir, texFile)
        if (!(await exists(texPath))) {
            issues.push(err('MISSING_STATEMENT', `Missing statement file for language ${lang}`, texFile))
        } else {
            const tex = await readTextInDir(dir, texFile)
            if (!tex.includes('\\Problem{')) {
                issues.push(warn('STATEMENT_STRUCTURE', `problem.${lang}.tex should contain \\Problem{...}`, texFile))
            }
            if (!tex.includes('\\Statement')) {
                issues.push(warn('STATEMENT_STRUCTURE', `problem.${lang}.tex should contain \\Statement`, texFile))
            }
        }
    }

    // All original_language values must point to the same language, and that language must have author
    const originalLanguageValues = [
        ...new Set(
            Object.entries(langMeta)
                .map(([, m]) => m.originalLanguage)
                .filter((v): v is string => !!v),
        ),
    ]
    if (originalLanguageValues.length > 1) {
        issues.push(
            err(
                'ORIGINAL_LANGUAGE_MISMATCH',
                `All original_language fields must be the same; found: ${originalLanguageValues.join(', ')}`,
            ),
        )
    } else if (originalLanguageValues.length === 1) {
        const refLang = originalLanguageValues[0]!
        if (!languages.includes(refLang)) {
            issues.push(
                err(
                    'ORIGINAL_LANGUAGE_MISSING',
                    `original_language is "${refLang}" but there is no problem.${refLang}.yml`,
                ),
            )
        } else if (langMeta[refLang] && !langMeta[refLang].hasAuthor) {
            issues.push(
                err(
                    'ORIGINAL_LANGUAGE_NO_AUTHOR',
                    `The original language (problem.${refLang}.yml) must have an author field`,
                    `problem.${refLang}.yml`,
                ),
            )
        }
    }

    if (!hasOriginalLanguage && langYmlFiles.length > 0) {
        issues.push(
            err('NO_ORIGINAL_LANGUAGE', 'One language must be the original (problem.<lang>.yml with author and email)'),
        )
    }

    // --- handler for solution/test requirements ---
    let handler: { handler: string } | null = null
    if (await exists(handlerPath)) {
        try {
            const data = await readYamlInDir(dir, 'handler.yml')
            handler = Handler.parse(data) as { handler: string }
        } catch {
            // already reported
        }
    }

    const needsTestsAndSolution =
        handler && handler.handler !== 'quiz' && handler.handler !== 'game' && handler.handler !== 'circuits'

    if (needsTestsAndSolution) {
        // --- solution ---
        const solutionFiles = await Array.fromAsync(glob('solution.*', { cwd: dir }))
        if (solutionFiles.length === 0) {
            issues.push(err('NO_SOLUTION', 'At least one solution file (e.g. solution.cc) is required'))
        }

        // --- test cases: .inp / .cor pairing, naming ---
        const inpFiles = await Array.fromAsync(glob('*.inp', { cwd: dir }))
        const corFiles = await Array.fromAsync(glob('*.cor', { cwd: dir }))
        const inpBases = new Set(inpFiles.map((f) => f.replace(/\.inp$/, '')))
        const corBases = new Set(corFiles.map((f) => f.replace(/\.cor$/, '')))

        if (inpFiles.length === 0) {
            issues.push(err('NO_TESTCASES', 'At least one test case (.inp file) is required'))
        }

        for (const base of inpBases) {
            if (!TESTCASE_NAME_REGEX.test(base)) {
                issues.push(
                    warn(
                        'TESTCASE_NAMING',
                        `Test case name "${base}" should use only letters, digits, dashes and underscores`,
                        `${base}.inp`,
                    ),
                )
            }
            if (!corBases.has(base)) {
                issues.push(
                    err(
                        'MISSING_COR',
                        `Each .inp must have a matching .cor file. Run "jtk make cor" to generate.`,
                        `${base}.inp / ${base}.cor`,
                    ),
                )
            }
        }

        for (const base of corBases) {
            if (!TESTCASE_NAME_REGEX.test(base)) {
                issues.push(
                    warn(
                        'TESTCASE_NAMING',
                        `Test case name "${base}" should use only letters, digits, dashes and underscores`,
                        `${base}.cor`,
                    ),
                )
            }
            if (!inpBases.has(base)) {
                issues.push(warn('ORPHAN_COR', `No .inp for .cor file; consider removing the .cor file`, `${base}.cor`))
            }
        }

        // --- sample vs statement consistency ---
        const sampleBases = [...inpBases].filter((b) => b.includes('sample'))
        for (const lang of languages) {
            const texFile = `problem.${lang}.tex`
            const texPath = join(dir, texFile)
            if (sampleBases.length > 0 && (await exists(texPath))) {
                const tex = await readTextInDir(dir, texFile)
                if (!tex.includes('\\Sample')) {
                    issues.push(
                        warn(
                            'SAMPLE_STATEMENT',
                            `Problem has sample test(s) but problem.${lang}.tex does not contain \\Sample`,
                            texFile,
                        ),
                    )
                }
            }
        }
    }

    return { directory: dir, issues }
}

export async function lintDirectories(directories: string[]): Promise<LintResult[]> {
    const realDirs = await findRealDirectories(directories.length ? directories : ['.'])
    const results: LintResult[] = []
    for (const dir of realDirs) {
        results.push(await lintDirectory(dir))
    }
    return results
}
