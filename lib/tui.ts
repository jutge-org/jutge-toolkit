import boxen from 'boxen'
import chalk from 'chalk'
import { highlight } from 'cli-highlight'
import { marked } from 'marked'
import type { MarkedExtension } from 'marked'
import { markedTerminal } from 'marked-terminal'
import { resolve } from 'path'
import terminalLink from 'terminal-link'
import YAML from 'yaml'
import { nothing } from './utils'

// marked-terminal returns a renderer extension; @types/marked-terminal is outdated
// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- markedTerminal() returns a valid MarkedExtension at runtime
marked.use(markedTerminal() as unknown as MarkedExtension)

const spacesPerLevel = process.env.JUTGE_INDENTATION_WIDTH ? parseInt(process.env.JUTGE_INDENTATION_WIDTH) : 4

const verticalLine = chalk.gray.dim(
    process.env.JUTGE_INDENTATION_CARET ? parseInt(process.env.JUTGE_INDENTATION_CARET) : '│',
)

let level = process.env.JUTGE_INDENTATION_LEVEL ? parseInt(process.env.JUTGE_INDENTATION_LEVEL) : 0

function getIndentationLevel(): number {
    return level
}

function getIndentationLevelAsString(): string {
    return getIndentationLevel().toString()
}

//const symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const symbols = ['', '▶', '◆', '●', '○', '◉', '⬡', '⬢']

function sectionStart(text: string) {
    if (text) {
        if (level == 0) {
            print(
                chalk.blue(
                    boxen(text, {
                        padding: { left: 1, right: 1 },
                        width: process.stdout.columns - level * spacesPerLevel,
                        borderStyle: 'single',
                    }),
                ),
            )
        } else {
            print(chalk.gray(symbols[level]) + ' ' + chalk.blue(text))
        }
    }
    ++level
}

function sectionEnd() {
    --level
}

async function section<T>(text: string, fn: () => Promise<T>): Promise<T> {
    try {
        sectionStart(text)
        const result = await fn()
        return result
    } finally {
        sectionEnd()
    }
}

function title(text: string) {
    print(
        chalk.blue(
            boxen(text, {
                padding: { left: 1, right: 1 },
                width: process.stdout.columns - level * spacesPerLevel,
                borderStyle: 'single',
            }),
        ),
    )
}

function command(text: string) {
    print(chalk.magenta(`❯ ${text}`))
}

function directory(text: string) {
    print(chalk.magenta('◳ ' + fileLink(process.cwd(), text)))
}

function url(dst: string) {
    print(chalk.magenta('🌐 ' + terminalLink(dst, dst)))
}

function link(dst: string, text?: string) {
    return terminalLink(text || dst, dst)
}

function warning(text: string) {
    print(chalk.hex('#FFA500')(text))
}

function error(text: string) {
    print(chalk.red(text))
}

function success(text: string) {
    print(chalk.green(text))
}

function action(text: string) {
    print(chalk.blue(`${text}...`))
}

function gray(text: string) {
    print(chalk.gray(text))
}

function print(text: string = '', endline: boolean = true): void {
    const lines = text.split('\n')
    for (const line of lines) {
        const whitespace = (verticalLine + ' '.repeat(spacesPerLevel - 1)).repeat(level)
        process.stdout.write(whitespace + line + (endline ? '\n' : ''))
    }
}

async function markdown(content: string): Promise<void> {
    await nothing()
    print(marked.parse(content) as string)
}

function yaml(content: any): void {
    const output = YAML.stringify(content, null, 4).trim()
    print(
        highlight(output, {
            language: 'yaml',
            theme: {
                string: chalk.white,
            },
        }),
    )
}

function json(content: any): void {
    const output = JSON.stringify(content, null, 4)
    print(highlight(output, { language: 'json' }))
}

async function image(path: string, width: number, height: number): Promise<void> {
    // for some strange reason does not work anymore
    // print(await terminalImage.file(path, { width, height }))
}

function fileLink(dir: string, path?: string): string {
    if (path) {
        return terminalLink(path, 'file://' + resolve(dir, path))
    } else {
        return terminalLink(dir, 'file://' + resolve(dir))
    }
}

function weblink(url: string, text: string): string {
    return terminalLink(text, url)
}

function tryTo(text: string) {
    print(chalk.blue(text), false)
}

function trySuccess() {
    process.stdout.write(chalk.green(" ✓ \n"))
}

function tryFailure() {
    process.stdout.write(chalk.red(" ✗ \n"))
}

export default {
    getIndentationLevel,
    getIndentationLevelAsString,
    sectionStart,
    sectionEnd,
    section,
    title,
    command,
    directory,
    url,
    link,
    warning,
    error,
    gray,
    success,
    action,
    print,
    markdown,
    yaml,
    json,
    image,
    hyperlink: fileLink,
    weblink,
    tryTo,
    trySuccess,
    tryFailure,
}
