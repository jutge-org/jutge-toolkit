import { Command } from '@commander-js/extra-typings'
import { findRealDirectories } from '../lib/helpers'
import { newProblem } from '../lib/problem'
import tui from '../lib/tui'
import { readTextInDir, writeTextInDir } from '../lib/utils'

export const convertCmd = new Command('convert')
    .description('Convert deprecated elements in problem statements to the new format')

    .action(() => {
        convertCmd.help()
    })

convertCmd
    .command('transform-at-signs')
    .description('Transform @ signs to lstinline')

    .option('-d, --directories <directories...>', 'problem directories', ['.'])

    .action(async ({ directories }) => {
        const realDirectories = await findRealDirectories(directories)

        for (const realDirectory of realDirectories) {
            await tui.section(`Processing ${realDirectory}`, async () => {
                const problem = await newProblem(realDirectory)
                for (const language of problem.languages) {
                    await tui.section(`Converting problem.${language}.tex`, async () => {
                        const originalText = await readTextInDir(realDirectory, `problem.${language}.tex`)
                        const convertedText = replaceAtSigns(originalText)
                        if (originalText !== convertedText) {
                            await writeTextInDir(realDirectory, `problem.${language}.tex`, convertedText)
                            await writeTextInDir(realDirectory, `problem.${language}.tex.original.bak`, originalText)
                            tui.success(
                                `Converted problem.${language}.tex, original backed up to problem.${language}.tex.original.bak`,
                            )
                        } else {
                            tui.warning(`No changes needed for problem.${language}.tex`)
                        }
                    })
                }
            })
        }
    })

/**
 * Replaces all occurrences of @text@ with \lstinline|text|
 *
 * @param input - The input string to process
 * @returns A new string with all @text@ patterns replaced with \lstinline|text|
 *
 * @remarks
 * This function is designed to convert inline code markers from the @ syntax
 * to LaTeX \lstinline syntax. It processes the input string and replaces all
 * valid patterns while preserving invalid ones.
 *
 * Pattern matching rules:
 * - Matches text enclosed between two @ symbols: @text@
 * - The enclosed text must not contain @ symbols
 * - The enclosed text must not contain newline characters (\n or \r)
 * - The enclosed text must contain at least one character
 * - All valid matches in the input are replaced (global replacement)
 *
 * @example
 * Basic usage:
 * ```typescript
 * replaceAtSigns("Use @console.log()@ for debugging")
 * // Returns: "Use \lstinline|console.log()| for debugging"
 * ```
 */
function replaceAtSigns(input: string): string {
    return input.replace(/@([^@\n\r]+)@/g, '\\lstinline|$1|')
}
