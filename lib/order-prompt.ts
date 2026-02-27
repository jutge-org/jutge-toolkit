/**
 * Interactive ordering prompt that does not use Ctrl+Arrow (which conflicts on some Mac terminals).
 * Uses u/d or k/j to move the selected item up/down, arrow keys to move cursor, Enter to confirm.
 */

import chalk from 'chalk'
import readline from 'readline'

const POINTER = '❯'
const EMPTY = ' '

export interface OrderPromptOptions {
    message: string
    items: string[]
}

/**
 * Show an interactive list; user reorders with u/d (or k/j), moves cursor with arrows, confirms with Enter.
 * Returns the items in the chosen order.
 */
export function orderPrompt(options: OrderPromptOptions): Promise<string[]> {
    const { message, items } = options
    if (items.length === 0) return Promise.resolve([])

    return new Promise((resolve, reject) => {
        let order = [...items]
        let active = 0
        const len = order.length

        const wasRaw = process.stdin.isRaw
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true)
        }
        readline.emitKeypressEvents(process.stdin)
        if (process.stdin.isTTY && !process.stdin.listenerCount('keypress')) {
            process.stdin.resume()
            process.stdin.setEncoding('utf8')
        }

        const help = chalk.dim(' u/k: move up · d/j: move down · ↑↓: cursor · Enter: confirm')
        const totalLines = message.split('\n').length + order.length + 1

        function render() {
            const listLines = order.map((item, i) => {
                const cursor = i === active ? POINTER : EMPTY
                const line = `${cursor} ${item}`
                return i === active ? chalk.cyan(line) : line
            })
            const msgLines = message.split('\n')
            const allLines = [...msgLines, ...listLines, help]
            for (let i = 0; i < allLines.length; i++) {
                process.stdout.write('\x1b[2K' + (allLines[i] ?? '') + '\n')
            }
            process.stdout.write('\x1b[' + allLines.length + 'A') // cursor up to start of block
        }

        function clearAndResolve(result: string[]) {
            for (let i = 0; i < totalLines; i++) process.stdout.write('\r\x1b[2K\n')
            if (process.stdin.isTTY) process.stdin.setRawMode(wasRaw)
            process.stdin.removeListener('keypress', onKeypress)
            process.stdin.pause()
            resolve(result)
        }

        function moveItem(offset: number) {
            const next = active + offset
            if (next < 0 || next >= len) return
            const tmp = order[active]
            if (tmp === undefined) return
            order[active] = order[next]!
            order[next] = tmp
            active = next
            render()
        }

        function onKeypress(_str: string, key: readline.Key) {
            const name = key.name
            if (name === 'return' || name === 'enter') {
                clearAndResolve(order)
                return
            }
            if (name === 'up') {
                active = (active - 1 + len) % len
                render()
                return
            }
            if (name === 'down') {
                active = (active + 1) % len
                render()
                return
            }
            if (name === 'u' || name === 'k') {
                moveItem(-1)
                return
            }
            if (name === 'd' || name === 'j') {
                moveItem(1)
                return
            }
            if (key.ctrl && name === 'c') {
                if (process.stdin.isTTY) process.stdin.setRawMode(wasRaw)
                process.stdin.removeListener('keypress', onKeypress)
                process.stdin.pause()
                reject(new Error('Cancelled'))
            }
        }

        process.stdin.on('keypress', onKeypress)
        render()
    })
}
