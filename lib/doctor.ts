import { execa } from 'execa'
import terminalLink from 'terminal-link'
import tui from './tui'
import { nothing } from './utils'
import { exit } from 'process'

// Regular expression to split lines in a cross-platform way
const lineSep = /\r?\n/

// Memoization utility that caches Promises using a Map
// Caches the Promise itself, so concurrent calls share the same Promise
function memoize<Args extends unknown[], Return>(
    fn: (...args: Args) => Promise<Return>,
    keyFn?: (...args: Args) => string,
): (...args: Args) => Promise<Return> {
    const cache = new Map<string, Promise<Return>>()
    return (...args: Args): Promise<Return> => {
        const key = keyFn ? keyFn(...args) : JSON.stringify(args)
        if (!cache.has(key)) {
            cache.set(key, fn(...args))
        }
        return cache.get(key)!
    }
}

// Shared helpers that execute commands and return both result and version info
// These are memoized so commands are only executed once
type ProbeResult = {
    result: boolean
    version: string
    stdout?: string
    stderr?: string
}

async function _checkPython3(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`python3 --version`
    const version = stdout.trim()
    return {
        result: version.startsWith('Python 3'),
        version,
        stdout,
    }
}

const checkPython3Memoized = memoize(_checkPython3)

export async function probePython3(): Promise<boolean> {
    const { result } = await checkPython3Memoized()
    return result
}

async function _checkR(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`R --version`
    const version = stdout.split(lineSep)[0]!.trim()
    return {
        result: version.startsWith('R version'),
        version,
        stdout,
    }
}

const checkRMemoized = memoize(_checkR)

export async function probeR(): Promise<boolean> {
    const { result } = await checkRMemoized()
    return result
}

async function _checkPythonModule(module: string): Promise<ProbeResult> {
    const { exitCode, stdout, stderr } = await execa({ reject: false })`python3 -m pip show ${module}`
    return {
        result: exitCode === 0,
        version: exitCode === 0 ? 'installed' : 'not installed',
        stdout,
        stderr,
    }
}

const checkPythonModuleMemoized = memoize(_checkPythonModule, (module: string) => module)

export async function probePythonModule(module: string): Promise<boolean> {
    const { result } = await checkPythonModuleMemoized(module)
    return result
}

async function _checkGCC(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`g++ --version`
    const version = stdout.split(lineSep)[0]!.trim()
    return {
        result: stdout.startsWith('Apple clang') || stdout.startsWith('g++'),
        version,
        stdout,
    }
}

const checkGCCMemoized = memoize(_checkGCC)

export async function probeGCC(): Promise<boolean> {
    const { result } = await checkGCCMemoized()
    return result
}

async function _checkHaskell(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`ghc --version`
    const version = stdout.split(lineSep)[0]!.trim()
    return {
        result: stdout.startsWith('The Glorious Glasgow Haskell Compilation System'),
        version,
        stdout,
    }
}

const checkHaskellMemoized = memoize(_checkHaskell)

export async function probeHaskell(): Promise<boolean> {
    const { result } = await checkHaskellMemoized()
    return result
}

async function _checkClojure(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`clj --version`
    const version = stdout.split(lineSep)[0]!.trim()
    return {
        result: stdout.startsWith('Clojure'),
        version,
        stdout,
    }
}

const checkClojureMemoized = memoize(_checkClojure)

export async function probeClojure(): Promise<boolean> {
    const { result } = await checkClojureMemoized()
    return result
}

async function _checkJava(): Promise<ProbeResult> {
    // funnily, javac writes its version to stderr in some implementations
    const { stdout, stderr } = await execa({ reject: false })`javac -version`
    const output = stdout || stderr
    const version = output.split(lineSep)[0]!.trim()
    return {
        result: output.startsWith('javac'),
        version,
        stdout,
        stderr,
    }
}

const checkJavaMemoized = memoize(_checkJava)

export async function probeJava(): Promise<boolean> {
    const { result } = await checkJavaMemoized()
    return result
}

async function _checkRust(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`rustc --version`
    const version = stdout.split(lineSep)[0]!.trim()
    return {
        result: stdout.startsWith('rustc'),
        version,
        stdout,
    }
}

const checkRustMemoized = memoize(_checkRust)

export async function probeRust(): Promise<boolean> {
    const { result } = await checkRustMemoized()
    return result
}

async function _checkVerilog(): Promise<ProbeResult> {
    await nothing()
    return {
        result: false,
        version: 'not implemented',
        stdout: '',
    }
}
const checkVerilogMemoized = memoize(_checkVerilog)

export async function probeVerilog(): Promise<boolean> {
    const { result } = await checkVerilogMemoized()
    return result
}

async function _checkCodeMetrics(): Promise<ProbeResult> {
    const { stdout, exitCode } = await execa({ reject: false })`jutge-code-metrics`
    const version = 'not reported'
    return {
        result: exitCode === 0,
        version,
        stdout,
    }
}

const checkCodeMetricsMemoized = memoize(_checkCodeMetrics)

export async function probeCodeMetrics(): Promise<boolean> {
    const { result } = await checkCodeMetricsMemoized()
    return result
}

async function _checkPdfLaTeX(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`pdflatex --version`
    const version = stdout.split(lineSep)[0]!.trim()
    return {
        result: stdout.includes('pdfTeX'),
        version,
        stdout,
    }
}

const checkPdfLaTeXMemoized = memoize(_checkPdfLaTeX)

export async function probePdfLaTeX(): Promise<boolean> {
    const { result } = await checkPdfLaTeXMemoized()
    return result
}

async function _checkXeLaTeX(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`xelatex --version`
    const version = stdout.split(lineSep)[0]!.trim()
    return {
        result: stdout.includes('XeTeX'),
        version,
        stdout,
    }
}

const checkXeLaTeXMemoized = memoize(_checkXeLaTeX)

export async function probeXeLaTeX(): Promise<boolean> {
    const { result } = await checkXeLaTeXMemoized()
    return result
}

async function _checkPandoc(): Promise<ProbeResult> {
    const { stdout } = await execa({ reject: false })`pandoc --version`
    const version = stdout.split(lineSep)[0]!.trim()
    return {
        result: stdout.startsWith('pandoc') && stdout.includes('+lua'),
        version,
        stdout,
    }
}

const checkPandocMemoized = memoize(_checkPandoc)

export async function probePandoc(): Promise<boolean> {
    const { result } = await checkPandocMemoized()
    return result
}

export async function checkPython3(): Promise<void> {
    tui.command('python3 --version')
    const { result, version } = await checkPython3Memoized()
    tui.print(version)
    if (result) {
        tui.success('Python3 seems installed')
        const modules = 'turtle-pil yogi easyinput'.split(' ')
        for (const m of modules) {
            tui.command(`python3 -m pip show ${m}`)
            const { result: isModuleInstalled } = await checkPythonModuleMemoized(m)
            if (isModuleInstalled) {
                tui.success(`Module ${m} is installed`)
            } else {
                tui.warning(`Module ${m} is not installed`)
            }
        }
    } else {
        tui.warning('Python3 does not appear to be installed')
        tui.print('This is not a problem if you do not plan to use Python solutions')
        tui.print('See https://www.python.org/downloads/')
    }
}
export async function checkGCC(): Promise<void> {
    tui.command('g++ --version')
    const { result, version } = await checkGCCMemoized()
    tui.print(version)
    if (result) {
        tui.success('C/C++ seems installed')
    } else {
        tui.warning('C/C++ does not appear to be installed')
        tui.print('This is not a problem if you do not plan to use C or C++ solutions')
        tui.print('Please install GCC or Clang')
    }
}

export async function checkHaskell(): Promise<void> {
    tui.command('ghc --version')
    const { result, version } = await checkHaskellMemoized()
    tui.print(version)
    if (result) {
        tui.success('Haskell seems installed')
    } else {
        tui.warning('Haskell does not appear to be installed')
        tui.print('This is not a problem if you do not plan to use Haskell solutions')
        tui.print('See https://www.haskell.org/ghc/download.html')
    }
}

export async function checkClojure(): Promise<void> {
    tui.command('clj --version')
    const { result, version } = await checkClojureMemoized()
    tui.print(version)
    if (result) {
        tui.success('Clojure seems installed')
    } else {
        tui.warning('Clojure does not appear to be installed')
        tui.print('This is not a problem if you do not plan to use Clojure solutions')
        tui.print('See https://clojure.org/guides/getting_started')
    }
}

export async function checkJava(): Promise<void> {
    tui.command('javac -version')
    const { result, version } = await checkJavaMemoized()
    tui.print(version)
    if (result) {
        tui.success('Java seems installed')
    } else {
        tui.warning('Java does not appear to be installed')
        tui.print('You will not be able to compile/execute Java solutions')
        tui.print('See https://www.oracle.com/java/technologies/javase-jdk11-downloads.html')
    }
}

export async function checkRust(): Promise<void> {
    tui.command('rustc --version')
    const { result, version } = await checkRustMemoized()
    tui.print(version)
    if (result) {
        tui.success('Rust seems installed')
    } else {
        tui.warning('Rust does not appear to be installed')
        tui.print('You will not be able to compile/execute Rust solutions')
        tui.print('See https://www.rust-lang.org/tools/install')
    }
}

export async function checkVerilog(): Promise<void> {
    tui.command('not implemented')
    const { result, version } = await checkVerilogMemoized()
    tui.print(version)
    if (result) {
        tui.success('Verilog seems installed')
    } else {
        tui.warning('Verilog does not appear to be installed, but this is not important for circuit problems')
    }
}

export async function checkR(): Promise<void> {
    tui.command('R --version')
    const { result, version } = await checkRMemoized()
    tui.print(version)
    if (result) {
        tui.success('R seems installed')
    } else {
        tui.warning('R does not appear to be installed')
        tui.print('You will not be able to compile/execute R solutions')
        tui.print('See Google')
    }
}

export async function checkPdfLaTeX(): Promise<void> {
    tui.command('pdflatex --version')
    const { result, version } = await checkPdfLaTeXMemoized()
    tui.print(version)
    if (result) {
        tui.success('LaTeX seems installed')
    } else {
        tui.warning('LaTeX does not appear to be installed')
        tui.print('You will not be able to generate PDF statements')
        tui.print('TODO: Provide instructions for installing LaTeX')
    }
}

export async function checkCodeMetrics(): Promise<void> {
    tui.command('jutge-code-metrics')
    const { result, version } = await checkCodeMetricsMemoized()
    tui.print(version)
    if (result) {
        tui.success('jutge-code-metrics seems installed')
    } else {
        tui.warning('jutge-code-metrics does not appear to be installed')
        tui.print('You will not be able to compute code metrics when staging solutions')
        tui.print('Use python3 -m pip install jutge-toolkit to install it')
    }
}

export async function checkXeLaTeX(): Promise<void> {
    tui.command('xelatex --version')
    const { result, version } = await checkXeLaTeXMemoized()
    tui.print(version)
    if (result) {
        tui.success('XeLaTeX seems installed')
    } else {
        tui.warning('XeLaTeX does not appear to be installed')
        tui.print('You will not be able to generate PDF statements with Unicode support')
        tui.print('TODO: Provide instructions for installing XeLaTeX')
    }
}

export async function checkPandoc(): Promise<void> {
    tui.command('pandoc --version')
    const { result, version } = await checkPandocMemoized()
    tui.print(version)
    if (result) {
        tui.success('Pandoc with Lua support seems installed')
    } else {
        tui.warning('Pandoc with Lua support does not appear to be installed')
        tui.print('You will not be able to generate text statements (HTML, TXT, MD)')
        tui.print('See https://pandoc.org/installing.html')
    }
}

export async function checkAIEnvVars(): Promise<void> {
    await nothing()
    const vars = ['OPENAI_API_KEY', 'GEMINI_API_KEY']
    for (const v of vars) {
        if (process.env[v]) {
            tui.success(`${v} environment variable is set`)
        } else {
            tui.warning(`${v} environment variable is not set`)
            tui.print(`You will not be able to use related AI models`)
        }
    }
}

export async function checkTerminal(): Promise<void> {
    await nothing()
    if (process.stdout.isTTY) {
        tui.success('Terminal supports TTY')
    } else {
        tui.warning('Terminal does not support TTY')
        tui.print('Some output features may not work as expected')
    }
    if (terminalLink.isSupported) {
        tui.success('Terminal supports hyperlinks')
    } else {
        tui.warning('Terminal does not support hyperlinks')
        tui.print('Links to files may not be clickable')
    }

    const vars = ['EDITOR', 'VISUAL']
    for (const v of vars) {
        if (process.env[v]) {
            tui.success(`${v} environment variable is set to "${process.env[v]}"`)
        } else {
            tui.warning(`${v} environment variable is not set`)
        }
    }
}
