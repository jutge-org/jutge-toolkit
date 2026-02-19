import boxen from 'boxen'
import chalk from 'chalk'
import { highlight } from 'cli-highlight'
import { Marked, marked } from 'marked'
import type { MarkedExtension } from 'marked'
import { markedTerminal } from 'marked-terminal'
import { writeFile } from 'fs/promises'
import open from 'open'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import terminalLink from 'terminal-link'
import YAML from 'yaml'
import { nanoid8, nothing } from './utils'

const markedHtml = new Marked()

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

const markdownHtmlTemplate = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown</title>
  <style>
    :root { --bg: #fafafa; --fg: #1a1a1a; --muted: #6b7280; --accent: #2563eb; --green: #059669; --orange: #ea580c; --purple: #7c3aed; --red: #dc2626; --yellow: #b45309; }
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 72ch; margin: 0 auto; padding: 2rem; background: var(--bg); color: var(--fg); line-height: 1.6; }
    h1, h2, h3 { color: var(--accent); margin-top: 1.5em; }
    h1 { font-size: 1.75rem; border-bottom: 1px solid var(--muted); padding-bottom: 0.25em; }
    h2 { font-size: 1.35rem; }
    h3 { font-size: 1.15rem; }
    a { color: var(--accent); }
    code { background: #e5e7eb; color: var(--yellow); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; overflow-x: auto; }
    pre code { background: none; padding: 0; color: var(--fg); }
    blockquote { border-left: 4px solid var(--accent); margin: 0; padding-left: 1rem; color: var(--muted); }
    ul, ol { padding-left: 1.5rem; }
    strong { color: var(--green); }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
  </style>
</head>
<body>
${body}
</body>
</html>
`

async function markdown(content: string): Promise<void> {
    print(marked.parse(content) as string)

    // open in browser
    const body = (await markedHtml.parse(content)) as string
    const html = markdownHtmlTemplate(body)
    const path = join(tmpdir(), `jutge-markdown-${nanoid8()}.html`)
    await writeFile(path, html, 'utf8')
    await open(path)
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
