import { Command } from '@commander-js/extra-typings'
import chalk from 'chalk'
import { lintDirectories, type LintIssue } from '../lib/lint'

function formatIssue(issue: LintIssue): string {
    const prefix = issue.severity === 'error' ? chalk.red('error') : chalk.yellow('warning')
    const path = issue.path ? chalk.gray(` (${issue.path})`) : ''
    return `  ${prefix} ${issue.code}: ${issue.message}${path}`
}

export const lintCmd = new Command('lint')
    .summary('Lint a problem directory')
    .description(
        'Check problem.yml/handler.yml schema, required files present, naming conventions, statement structure, sample vs public test consistency, etc.',
    )
    .argument('[directories...]', 'problem directories to lint (default: current directory)')
    .option('-d, --directory <path>', 'problem directory when no arguments given', '.')
    .action(async (directories: string[], { directory }) => {
    const dirs = directories.length > 0 ? directories : [directory]
    const results = await lintDirectories(dirs)

    if (results.length === 0) {
        console.log(chalk.yellow('No problem directories found (looked for handler.yml in the given path(s)).'))
        return
    }

    let hasError = false
        let hasWarning = false

        for (const result of results) {
            const errors = result.issues.filter((i) => i.severity === 'error')
            const warnings = result.issues.filter((i) => i.severity === 'warning')
            if (errors.length > 0) hasError = true
            if (warnings.length > 0) hasWarning = true

            const dirLabel = result.directory === dirs[0] && results.length === 1 ? result.directory : result.directory
            if (result.issues.length === 0) {
                console.log(chalk.green('✓'), dirLabel, chalk.gray('— no issues'))
            } else {
                console.log()
                console.log(chalk.bold(dirLabel))
                for (const issue of result.issues) {
                    console.log(formatIssue(issue))
                }
            }
        }

        if (results.length > 1) {
            console.log()
            const totalErrors = results.reduce((s, r) => s + r.issues.filter((i) => i.severity === 'error').length, 0)
            const totalWarnings = results.reduce((s, r) => s + r.issues.filter((i) => i.severity === 'warning').length, 0)
            if (totalErrors > 0 || totalWarnings > 0) {
                console.log(
                    chalk.gray(
                        `Total: ${totalErrors} error(s), ${totalWarnings} warning(s) across ${results.length} problem(s)`,
                    ),
                )
            }
        }

        if (hasError) {
            process.exitCode = 1
        }
    })
