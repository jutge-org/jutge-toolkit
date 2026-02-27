import { Command } from '@commander-js/extra-typings'
import type { Option, Argument } from '@commander-js/extra-typings'
import { confirm, input, select } from '@inquirer/prompts'

type CommandUnknownOpts = Command<unknown[], Record<string, unknown>, Record<string, unknown>>

function getVisibleSubcommands(cmd: CommandUnknownOpts): CommandUnknownOpts[] {
    const help = cmd.createHelp()
    return help.visibleCommands(cmd).filter((c) => c.name() !== 'help')
}

function getVisibleOptions(cmd: CommandUnknownOpts): Option[] {
    return cmd.options.filter((o) => !o.hidden && o.long !== 'help' && o.long !== 'version' && !o.negate)
}

function getVisibleArguments(cmd: CommandUnknownOpts): Argument[] {
    return [...cmd.registeredArguments]
}

function commandSummary(cmd: CommandUnknownOpts): string {
    const summary = (cmd as CommandUnknownOpts & { summary?: () => string }).summary?.()
    if (summary) return summary
    const desc = cmd.description()
    return desc ? desc.split('\n')[0]!.trim() : cmd.name()
}

async function chooseCommand(
    program: CommandUnknownOpts,
    path: string[],
): Promise<{ path: string[]; cmd: CommandUnknownOpts }> {
    const current = path.length === 0 ? program : resolveCommand(program, path)!
    const subcommands = getVisibleSubcommands(current)

    if (subcommands.length === 0) {
        return { path, cmd: current }
    }

    const choices = subcommands.map((c) => ({
        name: `${c.name()} — ${commandSummary(c)}`,
        value: c.name(),
    }))

    const chosen = await select({
        message: path.length === 0 ? 'What do you want to do?' : `Choose ${current.name()} subcommand:`,
        choices: [...choices, { name: '← Back', value: '__back__' }],
    })

    if (chosen === '__back__') {
        if (path.length === 0) return { path: [], cmd: program }
        return chooseCommand(program, path.slice(0, -1))
    }

    const newPath = [...path, chosen]
    const nextCmd = resolveCommand(program, newPath)!
    const nextSubs = getVisibleSubcommands(nextCmd)
    if (nextSubs.length > 0) {
        return chooseCommand(program, newPath)
    }
    return { path: newPath, cmd: nextCmd }
}

function resolveCommand(program: CommandUnknownOpts, path: string[]): CommandUnknownOpts | null {
    let current: CommandUnknownOpts = program
    for (const name of path) {
        const sub = current.commands.find((c) => c.name() === name)
        if (!sub) return null
        current = sub as CommandUnknownOpts
    }
    return current
}

async function promptForArgument(arg: Argument, existing: string[]): Promise<string | string[]> {
    const name = arg.name()
    const desc = arg.description || name
    const defaultVal = arg.defaultValue
    const choices = arg.argChoices
    const variadic = arg.variadic
    const required = arg.required

    const message = desc + (required ? '' : ' (optional)')

    if (choices && choices.length > 0) {
        const value = await select({
            message,
            choices: choices.map((c) => ({ name: c, value: c })),
            default: defaultVal != null ? (Array.isArray(defaultVal) ? defaultVal[0] : defaultVal) : undefined,
        })
        return value
    }

    const defaultStr =
        defaultVal != null
            ? Array.isArray(defaultVal)
                ? defaultVal.join(' ')
                : String(defaultVal)
            : required
              ? undefined
              : ''

    const raw = await input({
        message,
        default: defaultStr,
        validate: (v) => (required && !v.trim() ? 'This argument is required' : true),
    })

    if (variadic && raw.includes(' ')) {
        return raw.trim().split(/\s+/).filter(Boolean)
    }
    return raw.trim() || (defaultStr as string)
}

async function promptForOption(opt: Option): Promise<{ name: string; value: unknown } | null> {
    const attr = opt.attributeName()
    const desc = opt.description || opt.long || opt.flags
    const defaultVal = opt.defaultValue
    const choices = opt.argChoices
    const isBool = opt.isBoolean()

    if (isBool) {
        const value = await confirm({
            message: desc,
            default: defaultVal === true,
        })
        return { name: attr, value }
    }

    if (choices && choices.length > 0) {
        const value = await select({
            message: desc,
            choices: choices.map((c) => ({ name: c, value: c })),
            default: defaultVal != null ? String(defaultVal) : undefined,
        })
        return { name: attr, value }
    }

    const defaultStr = defaultVal != null ? String(defaultVal) : ''
    const value = await input({
        message: desc + (opt.required ? '' : ' (optional)'),
        default: defaultStr,
    })
    if (value === '' && !opt.required) return null
    return { name: attr, value }
}

function buildArgv(
    path: string[],
    cmd: CommandUnknownOpts,
    argValues: (string | string[])[],
    optionValues: Record<string, unknown>,
): string[] {
    const argv: string[] = [...path]

    const positionals: string[] = []
    for (const v of argValues) {
        if (Array.isArray(v)) positionals.push(...v)
        else if (v !== '') positionals.push(v)
    }
    argv.push(...positionals)

    for (const opt of getVisibleOptions(cmd)) {
        const attr = opt.attributeName()
        const val = optionValues[attr]
        if (val === undefined) continue
        if (opt.isBoolean()) {
            if (val === true) {
                argv.push(opt.long!.startsWith('--') ? opt.long! : `--${opt.long}`)
            } else if (val === false) {
                const negateOpt = cmd.options.find((o) => o.negate && o.attributeName() === attr)
                if (negateOpt?.long) {
                    argv.push(negateOpt.long.startsWith('--') ? negateOpt.long : `--${negateOpt.long}`)
                }
            }
        } else {
            if (val !== '' && val != null) {
                const long = opt.long!.startsWith('--') ? opt.long! : `--${opt.long}`
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                argv.push(long, String(val))
            }
        }
    }

    return argv
}

export const dummiesCmd = new Command('for-dummies')
    .alias('interactive')
    .summary('Interactive menu for all toolkit tasks')
    .description(
        'Run a guided flow of menus and prompts to perform any toolkit task. Help and defaults are taken from the command definitions.',
    )
    .action(async function (this: CommandUnknownOpts) {
        const program = this.parent
        if (!program) {
            throw new Error('Dummies command must be run under the main program')
        }

        const { path, cmd } = await chooseCommand(program as CommandUnknownOpts, [])

        if (path.length === 0) {
            return
        }

        const args = getVisibleArguments(cmd)
        const opts = getVisibleOptions(cmd)

        const argValues: (string | string[])[] = []
        for (const arg of args) {
            const v = await promptForArgument(arg, argValues.flat(1))
            argValues.push(v)
        }

        const optionValues: Record<string, unknown> = {}
        for (const opt of opts) {
            const result = await promptForOption(opt)
            if (result) optionValues[result.name] = result.value
        }

        const argv = buildArgv(path, cmd, argValues, optionValues)
        await program.parseAsync(argv, { from: 'user' })
    })
