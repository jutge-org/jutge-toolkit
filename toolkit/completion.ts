import { Command } from '@commander-js/extra-typings'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import tui from '../lib/tui'
import { complete } from '../lib/completion'

/** Hidden command used by completion scripts to get candidates */
export const completeInternalCmd = new Command('_complete')
    .description('Internal: output completion candidates (used by shell completion scripts)')
    .argument('<shell>', 'bash|zsh|fish|powershell')
    .argument('<cword>', 'index of word being completed', (v) => parseInt(v, 10))
    .argument('[words...]', 'command line words')
    .action(async (shell: string, cword: number, words: string[]) => {
        const result = await complete(words, cword)
        for (const w of result.words) {
            process.stdout.write(w + '\n')
        }
    })

function bashScript(): string {
    return `# Bash completion for jtk/jutge-toolkit
_jtk_completion() {
    local cur words cword
    _get_comp_words_by_ref -n : cur words cword
    local reply
    reply=($(jtk _complete bash "$cword" -- "\${words[@]}" 2>/dev/null))
    COMPREPLY=($(compgen -W "\${reply[*]}" -- "$cur"))
}
complete -o default -F _jtk_completion jtk jutge-toolkit 2>/dev/null || true
`
}

function zshScript(): string {
    return `# Zsh completion for jtk/jutge-toolkit
_jtk_completion() {
    local cword=$((CURRENT - 1))
    local -a reply
    reply=("\${(@f)"$(jtk _complete zsh "$cword" -- "\${words[@]}" 2>/dev/null)"}")
    _describe 'jtk' reply
}
compdef _jtk_completion jtk jutge-toolkit
`
}

function fishScript(): string {
    return `# Fish completion for jtk/jutge-toolkit
function __jtk_completion
    set -l tokens (commandline -o)
    set -l cword (math (count $tokens) - 1)
    jtk _complete fish $cword -- $tokens 2>/dev/null
end
complete -c jtk -a '(__jtk_completion)'
complete -c jutge-toolkit -a '(__jtk_completion)'
`
}

function powershellScript(): string {
    return `# PowerShell completion for jtk/jutge-toolkit
Register-ArgumentCompleter -CommandName jtk,jutge-toolkit -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    $words = $commandAst.CommandElements | ForEach-Object { $_.ToString() }
    $cword = [Math]::Max(0, $words.Count - 1)
    $all = $words + $wordToComplete
    $reply = jtk _complete powershell $cword -- @all 2>$null
    $reply | Where-Object { $_ -like "$wordToComplete*" }
}
`
}

export const completionCmd = new Command('completion')
    .description('Generate and install shell completion scripts for jtk')
    .action(() => {
        completionCmd.help()
    })

completionCmd
    .command('bash')
    .description('Output Bash completion script')
    .action(() => {
        console.log(bashScript())
    })

completionCmd
    .command('zsh')
    .description('Output Zsh completion script')
    .action(() => {
        console.log(zshScript())
    })

completionCmd
    .command('fish')
    .description('Output Fish completion script')
    .action(() => {
        console.log(fishScript())
    })

completionCmd
    .command('powershell')
    .description('Output PowerShell completion script')
    .action(() => {
        console.log(powershellScript())
    })

completionCmd
    .command('install [shell]')
    .description('Install completion script for the current shell (or specify bash|zsh|fish|powershell)')
    .action(async (shellArg?: string) => {
        const shell = shellArg || detectShell()
        const homedir = process.env.HOME || process.env.USERPROFILE || ''
        if (!homedir) {
            tui.print('Could not determine home directory (set HOME or USERPROFILE).')
            return
        }
        const xdgData = process.env.XDG_DATA_HOME || join(homedir, '.local', 'share')

        const writeScript = async (filePath: string, script: string): Promise<'created' | 'updated'> => {
            let existing: string | null = null
            try {
                existing = await readFile(filePath, 'utf-8')
            } catch {
                // file does not exist
            }
            await writeFile(filePath, script, 'utf-8')
            return existing !== null && existing !== script ? 'updated' : 'created'
        }

        if (shell === 'bash') {
            const dir = join(xdgData, 'bash-completion', 'completions')
            const filePath = join(dir, 'jtk')
            await mkdir(dir, { recursive: true })
            const status = await writeScript(filePath, bashScript())
            tui.success(
                status === 'created' ? `Created ${tui.hyperlink(filePath)}` : `Updated ${tui.hyperlink(filePath)}`,
            )
            tui.print('Restart your shell or run: source "' + filePath + '"')
        } else if (shell === 'zsh') {
            const dir = join(homedir, '.zsh')
            const filePath = join(dir, '_jtk')
            await mkdir(dir, { recursive: true })
            const status = await writeScript(filePath, zshScript())
            tui.success(
                status === 'created' ? `Created ${tui.hyperlink(filePath)}` : `Updated ${tui.hyperlink(filePath)}`,
            )
            const zshrc = join(homedir, '.zshrc')
            let zshrcContent: string | null = null
            try {
                zshrcContent = await readFile(zshrc, 'utf-8')
            } catch {
                /* .zshrc may not exist */
            }
            const lines: string[] = []
            if (!zshrcContent?.includes(dir)) {
                lines.push(`fpath=("${dir}" $fpath)`)
            }
            if (!zshrcContent?.includes('compinit')) {
                lines.push('autoload -Uz compinit && compinit')
            }
            if (lines.length > 0) {
                const toAppend = `\n# jtk completion\n${lines.join('\n')}\n`
                await writeFile(zshrc, (zshrcContent ?? '') + toAppend, 'utf-8')
                const added =
                    lines.length === 2
                        ? 'fpath and compinit'
                        : lines.length === 1 && lines[0]!.includes('fpath')
                          ? 'fpath'
                          : 'compinit'
                tui.success(`Updated ${tui.hyperlink(zshrc)} (added ${added})`)
            }
            tui.print('Restart your shell to use completions.')
        } else if (shell === 'fish') {
            const dir = join(homedir, '.config', 'fish', 'completions')
            const filePath = join(dir, 'jtk.fish')
            await mkdir(dir, { recursive: true })
            const status = await writeScript(filePath, fishScript())
            tui.success(
                status === 'created' ? `Created ${tui.hyperlink(filePath)}` : `Updated ${tui.hyperlink(filePath)}`,
            )
            tui.print('Restart your shell to use completions.')
        } else if (shell === 'powershell') {
            const dir = join(homedir, '.config', 'powershell')
            await mkdir(dir, { recursive: true })
            const filePath = join(dir, 'jtk-completion.ps1')
            const status = await writeScript(filePath, powershellScript())
            tui.success(
                status === 'created' ? `Created ${tui.hyperlink(filePath)}` : `Updated ${tui.hyperlink(filePath)}`,
            )
            tui.print('Load it in this session: . "' + filePath.replace(/'/g, "''") + '"')
            tui.print('To load automatically, add the line above to your $PROFILE.')
        } else {
            tui.print(`Unknown or unsupported shell: ${shell}`)
            tui.print('Use: jtk completion install bash|zsh|fish|powershell')
        }
    })

function detectShell(): string {
    const shell = process.env.SHELL || ''
    if (shell.includes('fish')) return 'fish'
    if (shell.includes('zsh')) return 'zsh'
    if (shell.includes('bash')) return 'bash'
    if (process.env.PSModulePath) return 'powershell'
    return 'bash'
}
