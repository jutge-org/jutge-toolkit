import { Command } from '@commander-js/extra-typings'
import chalk from 'chalk'
import { lintDirectories, type LintIssue, type LintResult } from '../lib/lint'
import tui from '../lib/tui'
import { nothing } from '../lib/utils'

export function formatLintIssue(issue: LintIssue): string {
    const prefix = issue.severity === 'error' ? chalk.red('error') : chalk.yellow('warning')
    const path = issue.path ? chalk.gray(` (${issue.path})`) : ''
    return `  ${prefix} ${issue.code}: ${issue.message}${path}`
}

export async function printLintResults(results: LintResult[], directories: string[]): Promise<{ hasError: boolean }> {
    let hasError = false
    for (const result of results) {
        const errors = result.issues.filter((i) => i.severity === 'error')
        if (errors.length > 0) hasError = true

        const dirLabel = result.directory === directories[0] && results.length === 1 ? result.directory : result.directory
        if (result.issues.length === 0) {
            tui.print(chalk.green('✓') + ' ' + dirLabel + ' ' + chalk.gray('— no issues'))
        } else {
            tui.print()
            await tui.section(`Linting ${dirLabel}`, async () => {
                await nothing()
                for (const issue of result.issues) {
                    tui.print(formatLintIssue(issue))
                }
            })
        }
    }

    if (results.length > 1) {
        tui.print()
        const totalErrors = results.reduce((s, r) => s + r.issues.filter((i) => i.severity === 'error').length, 0)
        const totalWarnings = results.reduce((s, r) => s + r.issues.filter((i) => i.severity === 'warning').length, 0)
        if (totalErrors > 0 || totalWarnings > 0) {
            tui.gray(
                `Total: ${totalErrors} error(s), ${totalWarnings} warning(s) across ${results.length} problem(s)`,
            )
        }
    }

    return { hasError }
}

export const lintCmd = new Command('lint')
    .summary('Lint a problem directory')

    .argument('[directory]', 'problem directory to lint', '.')

    .action(async (directory: string) => {
        const results = await lintDirectories([directory])

        if (results.length === 0) {
            tui.warning('No problem directories found (looked for handler.yml in the given path(s)).')
            return
        }

        const { hasError } = await printLintResults(results, [directory])
        if (hasError) {
            process.exitCode = 1
        }
    })
