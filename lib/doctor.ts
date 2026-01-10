import { execa } from 'execa'
import terminalLink from 'terminal-link'
import tui from './tui'
import { nothing } from './utils'

// Regular expression to split lines in a cross-platform way
const lineSep = /\r?\n/

export async function probePython3(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('python3 --version')
    const { stdout } = await execa({ reject: false })`python3 --version`
    const version = stdout.trim()
    if (showInfo) console.log(version)
    return version.startsWith('Python 3')
}

export async function probePythonModule(showInfo: boolean = false, module: string): Promise<boolean> {
    if (showInfo) tui.command(`python3 -m pip show ${module}`)
    const { exitCode } = await execa({ reject: false })`python3 -m pip show ${module}`
    if (showInfo) {
        if (exitCode === 0) {
            tui.success(`Module ${module} is installed`)
        } else {
            tui.warning(`Module ${module} is not installed`)
        }
    }
    return exitCode === 0
}

export async function probeGCC(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('g++ --version')
    const { stdout } = await execa({ reject: false })`g++ --version`
    const version = stdout.split(lineSep)[0]!.trim()
    if (showInfo) console.log(version)
    return stdout.startsWith('Apple clang') || stdout.startsWith('g++')
}

export async function probeHaskell(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('ghc --version')
    const { stdout } = await execa({ reject: false })`ghc --version`
    const version = stdout.split(lineSep)[0]!.trim()
    if (showInfo) console.log(version)
    return stdout.startsWith('The Glorious Glasgow Haskell Compilation System')
}

export async function probeClojure(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('clj --version')
    const { stdout } = await execa({ reject: false })`clj --version`
    const version = stdout.split(lineSep)[0]!.trim()
    if (showInfo) console.log(version)
    return stdout.startsWith('Clojure')
}

export async function probeJava(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('javac -version')
    const { stdout } = await execa({ reject: false })`javac -version`
    const version = stdout.split(lineSep)[0]!.trim()
    if (showInfo) console.log(version)
    return stdout.startsWith('javac')
}

export async function probeRust(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('rustc --version')
    const { stdout } = await execa({ reject: false })`rustc --version`
    const version = stdout.split(lineSep)[0]!.trim()
    if (showInfo) console.log(version)
    return stdout.startsWith('rustc')
}

export async function probePdfLaTeX(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('pdflatex --version')
    const { stdout } = await execa({ reject: false })`pdflatex --version`
    const version = stdout.split(lineSep)[0]!.trim()
    if (showInfo) console.log(version)
    return stdout.includes('pdfTeX')
}

export async function probeXeLaTeX(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('xelatex --version')
    const { stdout } = await execa({ reject: false })`xelatex --version`
    const version = stdout.split(lineSep)[0]!.trim()
    if (showInfo) console.log(version)
    return stdout.includes('XeTeX')
}

export async function probePandoc(showInfo: boolean = false): Promise<boolean> {
    if (showInfo) tui.command('pandoc --version')
    const { stdout } = await execa({ reject: false })`pandoc --version`
    const version = stdout.split(lineSep)[0]!.trim()
    if (showInfo) console.log(version)
    return stdout.startsWith('pandoc') && stdout.includes('+lua')
}

export async function checkPython3(): Promise<void> {
    if (await probePython3(true)) {
        tui.success('Python3 seems installed')
        const modules = 'turtle-pil yogi easyinput'.split(' ')
        for (const m of modules) {
            await probePythonModule(true, m)
        }
    } else {
        tui.warning('Python3 does not appear to be installed')
        tui.print('This is not a problem if you do not plan to use Python solutions')
        tui.print('See https://www.python.org/downloads/')
    }
}
export async function checkGCC(): Promise<void> {
    if (await probeGCC(true)) {
        tui.success('C/C++ seems installed')
    } else {
        tui.warning('C/C++ does not appear to be installed')
        tui.print('This is not a problem if you do not plan to use C or C++ solutions')
        tui.print('Please install GCC or Clang')
    }
}

export async function checkHaskell(): Promise<void> {
    if (await probeHaskell(true)) {
        tui.success('Haskell seems installed')
    } else {
        tui.warning('Haskell does not appear to be installed')
        tui.print('This is not a problem if you do not plan to use Haskell solutions')
        tui.print('See https://www.haskell.org/ghc/download.html')
    }
}

export async function checkClojure(): Promise<void> {
    if (await probeClojure(true)) {
        tui.success('Clojure seems installed')
    } else {
        tui.warning('Clojure does not appear to be installed')
        tui.print('This is not a problem if you do not plan to use Clojure solutions')
        tui.print('See https://clojure.org/guides/getting_started')
    }
}

export async function checkJava(): Promise<void> {
    if (await probeJava(true)) {
        tui.success('Java seems installed')
    } else {
        tui.warning('Java does not appear to be installed')
        tui.print('You will not be able to compile/execute Java solutions')
        tui.print('See https://www.oracle.com/java/technologies/javase-jdk11-downloads.html')
    }
}

export async function checkRust(): Promise<void> {
    if (await probeRust(true)) {
        tui.success('Rust seems installed')
    } else {
        tui.warning('Rust does not appear to be installed')
        tui.print('You will not be able to compile/execute Rust solutions')
        tui.print('See https://www.rust-lang.org/tools/install')
    }
}

export async function checkPdfLaTeX(): Promise<void> {
    if (await probePdfLaTeX(true)) {
        tui.success('LaTeX seems installed')
    } else {
        tui.warning('LaTeX does not appear to be installed')
        tui.print('You will not be able to generate PDF statements')
        tui.print('TODO: Provide instructions for installing LaTeX')
    }
}

export async function checkXeLaTeX(): Promise<void> {
    if (await probeXeLaTeX(true)) {
        tui.success('XeLaTeX seems installed')
    } else {
        tui.warning('XeLaTeX does not appear to be installed')
        tui.print('You will not be able to generate PDF statements with Unicode support')
        tui.print('TODO: Provide instructions for installing XeLaTeX')
    }
}

export async function checkPandoc(): Promise<void> {
    if (await probePandoc(true)) {
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
