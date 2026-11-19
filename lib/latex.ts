import { execa } from 'execa'
import type { LatexEngine } from './doctor'
import tui from './tui'

export function latexLogFile(texFile: string): string {
    return texFile.replace(/\.tex$/i, '.log')
}

export async function compileLatexDocument(
    engine: LatexEngine,
    cwd: string,
    texFile: string,
    options?: { passes?: number },
): Promise<void> {
    const passes = options?.passes ?? 1
    const env = { max_print_line: '100000' }

    if (engine === 'xelatex') {
        const line = `xelatex -no-shell-escape -interaction=nonstopmode -file-line-error ${texFile}`
        tui.command(passes > 1 ? `${line} (×${passes})` : line)
        for (let i = 0; i < passes; i++) {
            await execa({
                stderr: 'inherit',
                cwd,
                env,
            })`xelatex -no-shell-escape -interaction=nonstopmode -file-line-error ${texFile}`
        }
        return
    }

    const reruns = Math.max(0, passes - 1)
    const line =
        reruns > 0
            ? `tectonic -X compile --keep-logs --reruns ${reruns} ${texFile}`
            : `tectonic -X compile --keep-logs ${texFile}`
    tui.command(line)
    if (reruns > 0) {
        await execa({ stderr: 'inherit', cwd, env })`tectonic -X compile --keep-logs --reruns ${reruns} ${texFile}`
    } else {
        await execa({ stderr: 'inherit', cwd, env })`tectonic -X compile --keep-logs ${texFile}`
    }
}