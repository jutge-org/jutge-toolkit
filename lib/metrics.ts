import { exists } from 'fs/promises'
import { resolve } from 'path'
import { execa } from 'execa'

type MultimetricOutput = {
    overall: Record<string, unknown>
}

/** Per-file multimetric `overall` payload, keyed by resolved absolute path. */
export type MultimetricOverallByFile = Record<string, Record<string, unknown>>

export async function collectMultimetricOverall(files: string[]): Promise<MultimetricOverallByFile> {
    const probe = await execa('python3', ['-m', 'pip', 'show', 'multimetric'], { reject: false })
    if (probe.exitCode !== 0) {
        throw new Error('Python package "multimetric" is not installed. Install it with: python3 -m pip install multimetric')
    }

    const out: MultimetricOverallByFile = {}
    for (const f of files) {
        if (!(await exists(f))) {
            throw new Error(`File not found: ${f}`)
        }
        const { stdout, exitCode, stderr } = await execa('multimetric', [f], { reject: false })
        if (exitCode !== 0) {
            const msg = stderr.trim() || stdout.trim() || `exit code ${exitCode}`
            throw new Error(`multimetric failed for ${f}: ${msg}`)
        }
        let parsed: MultimetricOutput
        try {
            parsed = JSON.parse(stdout) as MultimetricOutput
        } catch {
            throw new Error(`multimetric returned invalid JSON for ${f}`)
        }
        if (!parsed.overall || typeof parsed.overall !== 'object') {
            throw new Error(`multimetric output missing overall for ${f}`)
        }
        out[f] = parsed.overall
    }
    return out
}
