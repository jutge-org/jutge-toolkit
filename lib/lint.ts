import { exists, glob, stat } from 'fs/promises'
import { join, normalize, resolve } from 'path'
import { languageNames } from './data'
import { findRealDirectories } from './helpers'
import { Handler, ProblemInfo, ProblemLangYml } from './types'
import { readTextInDir, readYamlInDir } from './utils'
import { ZodError } from 'zod'
import { fromError } from 'zod-validation-error'

const TESTCASE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/

type OpsValidationResult = { valid: true } | { valid: false; error: string }

function validateOpsString(content: string): OpsValidationResult {
    const tokens = content.replaceAll('\n', ' ').replaceAll('\r', ' ').trim().split(/\s+/)
    let i = 0

    const peek = (): string | undefined => tokens[i]
    const consume = (): string | undefined => tokens[i++]

    const isPositiveNumber = (s: string | undefined) =>
        s !== undefined && /^\d+(\.\d+)?$/.test(s) && parseFloat(s) > 0

    /** Consume next token; if it contains '=' (e.g. --opt=val), split and return [flag, value]. */
    const consumeOpt = (): { flag: string; value: string | undefined } => {
        const raw = consume()!
        const eq = raw.indexOf('=')
        if (eq >= 0 && raw.startsWith('--')) {
            return { flag: raw.slice(0, eq), value: raw.slice(eq + 1) || undefined }
        }
        return { flag: raw, value: undefined }
    }

    const seen = new Set<string>()

    while (i < tokens.length) {
        const { flag, value: inline } = consumeOpt()

        if (seen.has(flag)) {
            return { valid: false, error: `Duplicate option: ${flag}` }
        }
        seen.add(flag)

        const takeNumber = (): string | undefined => {
            if (inline !== undefined) return inline
            const next = peek()
            if (next !== undefined && isPositiveNumber(next)) {
                consume()
                return next
            }
            return undefined
        }

        switch (flag) {
            case '--maxtime': {
                const cputime = takeNumber()
                if (cputime === undefined) {
                    return { valid: false, error: '--maxtime requires at least cputime as a positive number' }
                }
                if (i < tokens.length && isPositiveNumber(peek())) consume()
                if (i < tokens.length && isPositiveNumber(peek())) consume()
                break
            }
            case '--maxmem': {
                const maxmem = takeNumber()
                if (maxmem === undefined) {
                    return { valid: false, error: '--maxmem requires maxmem as a positive number' }
                }
                if (i < tokens.length && isPositiveNumber(peek())) consume()
                break
            }
            case '--maxfiles':
            case '--maxprocs':
            case '--maxoutput':
            case '--maxcore': {
                const val = takeNumber()
                if (val === undefined) {
                    return { valid: false, error: `${flag} requires a positive number` }
                }
                break
            }
            default:
                return { valid: false, error: `Unknown option: ${flag}` }
        }
    }

    return { valid: true }
}

export type LintSeverity = 'error' | 'warning'

export interface LintIssue {
    severity: LintSeverity
    code: string
    message: string
    path?: string
}

export interface LintPassed {
    code: string
    message: string
    path?: string
}

export interface LintResult {
    directory: string
    issues: LintIssue[]
    /** When verbose, contains an entry for each validation that passed. */
    passed?: LintPassed[]
}

function err(code: string, message: string, path?: string): LintIssue {
    return { severity: 'error', code, message, path }
}

function warn(code: string, message: string, path?: string): LintIssue {
    return { severity: 'warning', code, message, path }
}

type LintPassCallback = (code: string, message: string, path?: string) => void

function formatValidationError(e: unknown): string {
    if (e instanceof ZodError) return fromError(e).toString()
    if (e instanceof Error) return e.message
    return String(e)
}

async function validateHandlerYml(
    dir: string,
    issues: LintIssue[],
    pass: LintPassCallback,
): Promise<{ handler: string } | null> {
    const handlerPath = join(dir, 'handler.yml')
    if (!(await exists(handlerPath))) {
        issues.push(err('MISSING_HANDLER', 'handler.yml is required', 'handler.yml'))
        return null
    }
    try {
        const data = await readYamlInDir(dir, 'handler.yml')
        const parsed = Handler.parse(data) as { handler: string }
        pass('HANDLER', 'handler.yml is valid', 'handler.yml')
        return parsed
    } catch (e) {
        issues.push(err('HANDLER_SCHEMA', `handler.yml schema error: ${formatValidationError(e)}`, 'handler.yml'))
        return null
    }
}

async function validateProblemYml(dir: string, issues: LintIssue[], pass: LintPassCallback): Promise<void> {
    const problemYmlPath = join(dir, 'problem.yml')
    if (!(await exists(problemYmlPath))) return
    try {
        const data = await readYamlInDir(dir, 'problem.yml')
        ProblemInfo.parse(data)
        pass('PROBLEM_YML', 'problem.yml is valid', 'problem.yml')
    } catch (e) {
        issues.push(
            err('PROBLEM_YML_SCHEMA', `problem.yml schema error: ${formatValidationError(e)}`, 'problem.yml'),
        )
    }
}

async function getValidLangYmlFiles(dir: string): Promise<string[]> {
    const all = await Array.fromAsync(glob('problem.*.yml', { cwd: dir }))
    return all.filter((f) => {
        const m = f.match(/^problem\.(.+)\.yml$/)
        const lang = m?.[1]
        return !!lang && lang in languageNames
    })
}

type LangMeta = Record<string, { hasAuthor: boolean; originalLanguage?: string }>

interface LanguageValidationResult {
    languages: string[]
    langMeta: LangMeta
    hasOriginalLanguage: boolean
}

async function validateLanguageFiles(
    dir: string,
    langYmlFiles: string[],
    issues: LintIssue[],
    pass: LintPassCallback,
): Promise<LanguageValidationResult> {
    const languages: string[] = []
    const langMeta: LangMeta = {}
    let hasOriginalLanguage = false

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
            pass('LANG_YML', `${file} is valid`, file)
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
            pass('STATEMENT', `problem.${lang}.tex exists`, texFile)
            const tex = await readTextInDir(dir, texFile)
            if (!tex.includes('\\Problem{')) {
                issues.push(warn('STATEMENT_STRUCTURE', `problem.${lang}.tex should contain \\Problem{...}`, texFile))
            } else {
                pass('STATEMENT_STRUCTURE', `problem.${lang}.tex contains \\Problem{...}`, texFile)
            }
            if (!tex.includes('\\Statement')) {
                issues.push(warn('STATEMENT_STRUCTURE', `problem.${lang}.tex should contain \\Statement`, texFile))
            } else {
                pass('STATEMENT_STRUCTURE', `problem.${lang}.tex contains \\Statement`, texFile)
            }
        }
    }

    return { languages, langMeta, hasOriginalLanguage }
}

function validateOriginalLanguageConsistency(
    languages: string[],
    langMeta: LangMeta,
    langYmlFiles: string[],
    hasOriginalLanguage: boolean,
    issues: LintIssue[],
    pass: LintPassCallback,
): void {
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
        } else {
            pass('ORIGINAL_LANGUAGE', 'original_language is consistent and has author')
        }
    }

    if (!hasOriginalLanguage && langYmlFiles.length > 0) {
        issues.push(
            err('NO_ORIGINAL_LANGUAGE', 'One language must be the original (problem.<lang>.yml with author and email)'),
        )
    } else if (langYmlFiles.length > 0) {
        pass('ORIGINAL_LANGUAGE', 'One language is marked as original (has author)')
    }
}

function handlerNeedsTestsAndSolution(handler: { handler: string } | null): boolean {
    return !!(
        handler &&
        handler.handler !== 'quiz' &&
        handler.handler !== 'game' &&
        handler.handler !== 'circuits'
    )
}

async function validateSolutionFiles(dir: string, issues: LintIssue[], pass: LintPassCallback): Promise<void> {
    const solutionFiles = await Array.fromAsync(glob('solution.*', { cwd: dir }))
    if (solutionFiles.length === 0) {
        issues.push(err('NO_SOLUTION', 'At least one solution file (e.g. solution.cc) is required'))
    } else {
        pass('SOLUTION', 'At least one solution file found')
    }
}

async function validateTestCasePairs(
    dir: string,
    issues: LintIssue[],
    pass: LintPassCallback,
): Promise<{ inpBases: Set<string>; corBases: Set<string> }> {
    const inpFiles = await Array.fromAsync(glob('*.inp', { cwd: dir }))
    const corFiles = await Array.fromAsync(glob('*.cor', { cwd: dir }))
    const inpBases = new Set(inpFiles.map((f) => f.replace(/\.inp$/, '')))
    const corBases = new Set(corFiles.map((f) => f.replace(/\.cor$/, '')))

    if (inpFiles.length === 0) {
        issues.push(err('NO_TESTCASES', 'At least one test case (.inp file) is required'))
    } else {
        pass('TESTCASES', 'At least one test case (.inp) found')
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
        } else {
            pass('TESTCASE_NAMING', `Test case "${base}" has valid name`, `${base}.inp`)
        }
        if (!corBases.has(base)) {
            issues.push(
                err(
                    'MISSING_COR',
                    `Each .inp must have a matching .cor file. Run "jtk make cor" to generate.`,
                    `${base}.inp / ${base}.cor`,
                ),
            )
        } else {
            pass('INP_COR_PAIR', `${base}.inp has matching .cor`, `${base}.inp`)
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

    return { inpBases, corBases }
}

const COR_SIZE_WARN_BYTES = 2 * 1024 * 1024

async function validateLargeCorWithoutOps(
    dir: string,
    inpBases: Set<string>,
    corBases: Set<string>,
    issues: LintIssue[],
    pass: LintPassCallback,
): Promise<void> {
    for (const base of inpBases) {
        if (!corBases.has(base)) continue
        const corPath = join(dir, `${base}.cor`)
        const opsPath = join(dir, `${base}.ops`)
        try {
            const st = await stat(corPath)
            if (st.size >= COR_SIZE_WARN_BYTES && !(await exists(opsPath))) {
                issues.push(
                    warn(
                        'COR_TOO_BIG',
                        '.cor file too big, review test case or consider using --maxoutput in .ops file',
                        `${base}.cor`,
                    ),
                )
            } else {
                pass('COR_SIZE', `${base}.cor size OK or has .ops`, `${base}.cor`)
            }
        } catch {
            // stat errors (e.g. file removed) are covered by other lint
        }
    }
}

async function validateOpsFiles(dir: string, issues: LintIssue[], pass: LintPassCallback): Promise<void> {
    const opsFiles = await Array.fromAsync(glob('*.ops', { cwd: dir }))
    const opsBases = new Set(opsFiles.map((f) => f.replace(/\.ops$/, '')))
    for (const base of opsBases) {
        const inpPath = join(dir, `${base}.inp`)
        if (!(await exists(inpPath))) {
            issues.push(
                err('OPS_WITHOUT_INP', 'Each .ops file must have a matching .inp test case', `${base}.ops`),
            )
        }
        const opsFile = `${base}.ops`
        try {
            const content = await readTextInDir(dir, opsFile)
            const result = validateOpsString(content)
            if (!result.valid) {
                issues.push(err('OPS_INVALID', result.error, opsFile))
            } else {
                pass('OPS', `${opsFile} is valid`, opsFile)
            }
        } catch {
            issues.push(err('OPS_READ', `Could not read ${opsFile}`, opsFile))
        }
    }
}

async function validateSampleStatementConsistency(
    dir: string,
    languages: string[],
    inpBases: Set<string>,
    issues: LintIssue[],
    pass: LintPassCallback,
): Promise<void> {
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
            } else {
                pass('SAMPLE_STATEMENT', `problem.${lang}.tex contains \\Sample`, texFile)
            }
        }
    }
}

async function validateSolutionAndTestCases(
    dir: string,
    languages: string[],
    issues: LintIssue[],
    pass: LintPassCallback,
): Promise<void> {
    await validateSolutionFiles(dir, issues, pass)
    const { inpBases, corBases } = await validateTestCasePairs(dir, issues, pass)
    await validateLargeCorWithoutOps(dir, inpBases, corBases, issues, pass)
    await validateOpsFiles(dir, issues, pass)
    await validateSampleStatementConsistency(dir, languages, inpBases, issues, pass)
}

export type LintDirectoryOptions = { verbose?: boolean }

export async function lintDirectory(
    directory: string,
    options?: LintDirectoryOptions,
): Promise<LintResult> {
    const dir = directory === '.' ? normalize(resolve(process.cwd())) : resolve(directory)
    const verbose = options?.verbose ?? false
    const issues: LintIssue[] = []
    const passed: LintPassed[] = []
    const pass: LintPassCallback = (code, message, path) => {
        if (verbose) passed.push({ code, message, path })
    }

    const handler = await validateHandlerYml(dir, issues, pass)
    await validateProblemYml(dir, issues, pass)

    const langYmlFiles = await getValidLangYmlFiles(dir)
    if (langYmlFiles.length === 0) {
        issues.push(
            err('NO_LANGUAGES', 'At least one problem.<lang>.yml is required (e.g. problem.en.yml, problem.ca.yml)'),
        )
    } else {
        pass('LANGUAGES', 'At least one problem.<lang>.yml found')
    }

    const { languages, langMeta, hasOriginalLanguage } = await validateLanguageFiles(
        dir,
        langYmlFiles,
        issues,
        pass,
    )
    validateOriginalLanguageConsistency(
        languages,
        langMeta,
        langYmlFiles,
        hasOriginalLanguage,
        issues,
        pass,
    )

    if (handlerNeedsTestsAndSolution(handler)) {
        await validateSolutionAndTestCases(dir, languages, issues, pass)
    }

    return { directory: dir, issues, ...(verbose && passed.length > 0 ? { passed } : {}) }
}

export type LintDirectoriesOptions = { verbose?: boolean }

export async function lintDirectories(
    directories: string[],
    options?: LintDirectoriesOptions,
): Promise<LintResult[]> {
    const realDirs = await findRealDirectories(directories.length ? directories : ['.'])
    const results: LintResult[] = []
    for (const dir of realDirs) {
        results.push(await lintDirectory(dir, options))
    }
    return results
}
