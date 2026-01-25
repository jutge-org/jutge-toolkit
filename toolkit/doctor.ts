import * as doc from '../lib/doctor'
import { Command } from '@commander-js/extra-typings'
import tui from '../lib/tui'

export const doctorCmd = new Command('doctor')
    .description('Diagnose status of the environment')

    .action(async () => {
        await tui.section('Perform checks', async () => {
            await tui.section('Checking Python3 installation', doc.checkPython3)
            await tui.section('Checking C/C++ installation', doc.checkGCC)
            await tui.section('Checking Haskell installation', doc.checkHaskell)
            await tui.section('Checking Clojure installation', doc.checkClojure)
            await tui.section('Checking Java installation', doc.checkJava)
            await tui.section('Checking Rust installation', doc.checkRust)
            await tui.section('Checking Verilog installation', doc.checkVerilog)
            await tui.section('Checking R installation', doc.checkR)
            await tui.section('Checking CodeMetrics installation', doc.checkCodeMetrics)
            await tui.section('Checking XeLaTeX installation', doc.checkXeLaTeX)
            await tui.section('Checking PdfLaTeX installation', doc.checkPdfLaTeX)
            await tui.section('Checking Pandoc installation', doc.checkPandoc)
            await tui.section('Checking AI models', doc.checkAIEnvVars)
            await tui.section('Checking terminal', doc.checkTerminal)
        })
    })
