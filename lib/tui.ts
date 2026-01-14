import { highlight } from 'cli-highlight'
import boxen from 'boxen'
import chalk from 'chalk'
import { resolve } from 'path'
import terminalImage from 'terminal-image'
import terminalLink from 'terminal-link'
import YAML from 'yaml'
import { nothing } from './utils'

let indentation = 0

const symbols = ['', '▶', '◆', '●', '■']

function sectionStart(text: string) {
    if (indentation === 0) {
        console.log()
        if (text) {
            console.log(chalk.blue(boxen(text, { padding: { left: 1, right: 1 }, width: process.stdout.columns })))
        }
    } else {
        if (text) {
            console.log(chalk.blue(`${symbols[indentation]} ${text}`))
        }
    }
    ++indentation
    console.group()
}

function sectionEnd() {
    --indentation
    console.groupEnd()
}

function sectionReset() {
    while (indentation > 0) {
        --indentation
        sectionEnd()
    }
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
    console.log(
        chalk.blue.bold(
            boxen(text, { padding: { left: 1, right: 1 }, width: process.stdout.columns, borderStyle: 'double' }),
        ),
    )
}

function command(text: string) {
    console.log(chalk.magenta(`❯ ${text}`))
}

function directory(text: string) {
    console.log(chalk.magenta('◳ ' + fileLink(process.cwd(), text)))
}

function url(dst: string) {
    console.log(chalk.magenta('🌐 ' + terminalLink(dst, dst)))
}

function link(dst: string, text?: string) {
    return terminalLink(text || dst, dst)
}

function warning(text: string) {
    console.log(chalk.hex('#FFA500')(text))
}

function error(text: string) {
    console.log(chalk.red(text))
}

function success(text: string) {
    console.log(chalk.green(text))
}

function action(text: string) {
    console.log(chalk.blue(`${text}...`))
}

function gray(text: string) {
    print(chalk.gray(text))
}

function print(text: string = ''): void {
    const lines = text.split('\n')
    for (const line of lines) {
        console.log(line)
    }
}

async function markdown(content: string): Promise<void> {
    await nothing()
    print(highlight(content, { language: 'markdown' }))
}

function yaml(content: any): void {
    const output = YAML.stringify(content, null, 2).trim()
    print(highlight(output, { language: 'yaml' }))
}

function json(content: any): void {
    const output = JSON.stringify(content, null, 2)
    print(highlight(output, { language: 'json' }))
}

async function image(path: string, width: number, height: number): Promise<void> {
    // for some strange reason does not work anymore
    // console.log(await terminalImage.file(path, { width, height }))
}

function fileLink(dir: string, path?: string): string {
    if (path) {
        return terminalLink(path, 'file://' + resolve(dir, path))
    } else {
        return terminalLink(dir, 'file://' + resolve(dir))
    }
}

export default {
    sectionStart,
    sectionEnd,
    sectionReset,
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
}
