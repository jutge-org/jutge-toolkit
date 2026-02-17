import { nothing } from '../lib/utils'
import { Compiler, type CompilerInfo } from './base'
import { GCC_Compiler } from '../compilers/gcc'
import { GXX_Compiler } from '../compilers/gxx'
import { Python3_Compiler } from '../compilers/python3'
import { GHC_Compiler } from '../compilers/ghc'
import { Clojure_Compiler } from '../compilers/clojure'
import { Java_Compiler } from '../compilers/java'
import { Rust_Compiler } from '../compilers/rust'
import { RunPython_Compiler } from '../compilers/run-python'
import { RunHaskell_Compiler } from '../compilers/run-haskell'
import { RunClojure_Compiler } from '../compilers/run-clojure'
import { Verilog_Compiler } from '../compilers/verilog'
import { PRO2_Compiler } from '../compilers/pro2'
import { MakePRO2_Compiler } from '../compilers/make-pro2'
import { R_Compiler } from './r'
import * as doctor from '../lib/doctor'

const compilersRegistryById: Record<string, new () => Compiler> = {
    C: GCC_Compiler,
    'C++': GXX_Compiler,
    Python3: Python3_Compiler,
    Haskell: GHC_Compiler,
    Clojure: Clojure_Compiler,
    Java: Java_Compiler,
    Rust: Rust_Compiler,
    Verilog: Verilog_Compiler,
    R: R_Compiler,
    PRO2: PRO2_Compiler,
    MakePRO2: MakePRO2_Compiler,

    RunPython: RunPython_Compiler,
    RunHaskell: RunHaskell_Compiler,
    RunClojure: RunClojure_Compiler,
}

const compilersRegistryByExtension: Record<string, new () => Compiler> = {
    c: GCC_Compiler,
    cc: GXX_Compiler,
    hh: PRO2_Compiler,
    tar: MakePRO2_Compiler,
    py: Python3_Compiler,
    hs: GHC_Compiler,
    clj: Clojure_Compiler,
    java: Java_Compiler,
    rs: Rust_Compiler,
    v: Verilog_Compiler,
    R: R_Compiler,
}

export const compilersProbesByExtension: Record<string, () => Promise<boolean>> = {
    c: doctor.probeGCC,
    cc: doctor.probeGCC,
    hh: doctor.probeGCC,
    tar: doctor.probeGCC,
    py: doctor.probePython3,
    hs: doctor.probeHaskell,
    clj: doctor.probeClojure,
    java: doctor.probeJava,
    rs: doctor.probeRust,
    v: doctor.probeVerilog,
    R: doctor.probeR,
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
