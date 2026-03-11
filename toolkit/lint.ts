import { Command } from '@commander-js/extra-typings'
import chalk from 'chalk'
import { resolve } from 'path'
import { lintDirectories, type LintIssue, type LintPassed, type LintResult } from '../lib/lint'
import tui from '../lib/tui'

export function formatLintIssue(issue: LintIssue): string {
    // Pad path to 20 spaces, left-aligned file path before the code/info
    const pathPart = issue.path ? chalk.gray(`${issue.path.padEnd(20, ' ')}`) : ' '.repeat(20);
    const prefix = issue.severity === 'error' ? chalk.red('×') : chalk.yellow('⚠️');
    return `${prefix} ${pathPart} ${issue.code}: ${issue.message}`;
}

export function formatLintPassed(passed: LintPassed): string {
    // Pad path to 20 spaces, left-aligned file path before the code/info
    const pathPart = passed.path ? chalk.gray(`${passed.path.padEnd(20, ' ')}`) : ' '.repeat(20);
    return `${chalk.green('✓')} ${pathPart} ${passed.code}: ${passed.message}`;
}


export function printLintResults(
    results: LintResult[],
    directories: string[],
    options?: { verbose?: boolean },
): { hasError: boolean } {
    const verbose = options?.verbose ?? false
    let hasError = false
    for (const result of results) {
        const errors = result.issues.filter((i) => i.severity === 'error')
        if (errors.length > 0) hasError = true

        if (verbose && result.passed?.length) {
            for (const p of result.passed) {
                tui.print(formatLintPassed(p))
            }
        }
        if (result.issues.length === 0) {
            tui.success(`✅ No issues found in ${tui.hyperlink(resolve(result.directory))}`)
        } else {
            for (const issue of result.issues) {
                tui.print(formatLintIssue(issue))
            }
            tui.error(`❌ ${result.issues.length} issue(s) found in ${tui.hyperlink(resolve(result.directory))}`)
        }
    }

    if (results.length > 1) {
        tui.print()
        const totalErrors = results.reduce((s, r) => s + r.issues.filter((i) => i.severity === 'error').length, 0)
        const totalWarnings = results.reduce((s, r) => s + r.issues.filter((i) => i.severity === 'warning').length, 0)
        if (totalErrors > 0 || totalWarnings > 0) {
            tui.gray(`Total: ${totalErrors} error(s), ${totalWarnings} warning(s) across ${results.length} problem(s)`)
        }
    }

    return { hasError }
}

export const lintCmd = new Command('lint')
    .summary('Lint a problem directory')

    .option('-d, --directory <directory>', 'problem directory', '.')
    .option('-v, --verbose', 'show all validations, including passed checks')

    .action(async ({ directory, verbose }) => {

        await tui.section(`Linting ${tui.hyperlink(resolve(directory))}`, async () => {
            const results = await lintDirectories([directory], { verbose })
            if (results.length === 0) throw new Error('No problem directories found (looked for handler.yml in the given path(s)).')
            const { hasError } = printLintResults(results, [directory], { verbose })
            if (hasError) {
                process.exitCode = 1
            }
        })
    })
