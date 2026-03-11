import { exists, glob, stat } from 'fs/promises'
import { join, normalize, resolve } from 'path'
import { languageNames } from './data'
import { findRealDirectories } from './helpers'
import { Handler, ProblemInfo, ProblemLangYml } from './types'
import { readTextInDir, readYamlInDir } from './utils'

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

        // --- large .cor without .ops ---
        const COR_SIZE_WARN_BYTES = 2 * 1024 * 1024 // 2MB
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
                }
            } catch {
                // ignore stat errors (e.g. file removed); other lint will report missing .cor
            }
        }

        // --- .ops files: must have matching .inp and valid content ---
        const opsFiles = await Array.fromAsync(glob('*.ops', { cwd: dir }))
        const opsBases = new Set(opsFiles.map((f) => f.replace(/\.ops$/, '')))
        for (const base of opsBases) {
            const inpPath = join(dir, `${base}.inp`)
            if (!(await exists(inpPath))) {
                issues.push(
                    err(
                        'OPS_WITHOUT_INP',
                        'Each .ops file must have a matching .inp test case',
                        `${base}.ops`,
                    ),
                )
            }
            const opsFile = `${base}.ops`
            try {
                const content = await readTextInDir(dir, opsFile)
                const result = validateOpsString(content)
                if (!result.valid) {
                    issues.push(
                        err('OPS_INVALID', result.error, opsFile),
                    )
                }
            } catch {
                issues.push(err('OPS_READ', `Could not read ${opsFile}`, opsFile))
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
