import { nothing } from '../utils'
import { Compiler, type CompilerInfo } from './base'
import { GCC_Compiler } from './gcc'
import { GXX_Compiler } from './gxx'
import { Python3_Compiler } from './python3'
import { GHC_Compiler } from './ghc'
import { Clojure_Compiler } from './clojure'
import { Java_Compiler } from './java'
import { Rust_Compiler } from './rust'
import { RunPython_Compiler } from './run-python'
import { RunHaskell_Compiler } from './run-haskell'
import { RunClojure_Compiler } from './run-clojure'

const compilersRegistryById: Record<string, new () => Compiler> = {
    C: GCC_Compiler,
    'C++': GXX_Compiler,
    Python3: Python3_Compiler,
    Haskell: GHC_Compiler,
    Clojure: Clojure_Compiler,
    Java: Java_Compiler,
    Rust: Rust_Compiler,

    RunPython: RunPython_Compiler,
    RunHaskell: RunHaskell_Compiler,
    RunClojure: RunClojure_Compiler,
}

const compilersRegistryByExtension: Record<string, new () => Compiler> = {
    c: GCC_Compiler,
    cc: GXX_Compiler,
    py: Python3_Compiler,
    hs: GHC_Compiler,
    clj: Clojure_Compiler,
    java: Java_Compiler,
    rs: Rust_Compiler,
}

export function getCompilerById(id: string): Compiler {
    const CompilerClass = compilersRegistryById[id]
    if (!CompilerClass) throw new Error(`Compiler '${id}' is not defined`)
    const compilerInstance = new CompilerClass()
    return compilerInstance
}

export function getCompilerByExtension(extension: string): Compiler {
    const CompilerClass = compilersRegistryByExtension[extension]
    if (!CompilerClass) throw new Error(`No compiler defined for extension '.${extension}'`)
    const compilerInstance = new CompilerClass()
    return compilerInstance
}

export async function getDefinedCompilerIds(): Promise<string[]> {
    await nothing()
    return Object.keys(compilersRegistryById)
}

export async function getAvailableCompilers(): Promise<string[]> {
    const available: string[] = []
    for (const id of Object.keys(compilersRegistryById)) {
        const CompilerClass = compilersRegistryById[id]!
        const compilerInstance = new CompilerClass()
        if (await compilerInstance.available()) {
            available.push(id)
        }
    }
    return available
}

export async function getCompilerInfo(id: string): Promise<CompilerInfo> {
    const compilerInstance = getCompilerById(id)
    if (!compilerInstance) throw new Error(`Compiler '${id}' is not defined`)
    return await compilerInstance.info()
}

export async function getCompilersInfo(): Promise<Record<string, CompilerInfo>> {
    const infos: Record<string, CompilerInfo> = {}
    for (const id of Object.keys(compilersRegistryById)) {
        infos[id] = await getCompilerInfo(id)
    }
    return infos
}
