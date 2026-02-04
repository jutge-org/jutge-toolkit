
import { estimateCost } from 'gpt-tokenizer/model/gpt-5'
import { JutgeApiClient } from './jutge_api_client'
import tui from './tui'
import chalk from 'chalk'
import { sleep } from 'radash'
import { settings } from './settings'

export async function complete(jutge: JutgeApiClient, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const bot = new ChatBot(jutge, model, systemPrompt)
    return await bot.complete(userPrompt)
}

type Message = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export class ChatBot {
    private jutge: JutgeApiClient
    private model: string
    private messages: Message[]
    public totalOutputCost: number = 0
    public totalInputTokens: number = 0
    public totalOutputTokens: number = 0
    public totalInputCost: number = 0

    constructor(jutge: JutgeApiClient, model: string, systemPrompt: string) {
        this.jutge = jutge
        this.model = model
        this.messages = [{ role: 'system', content: systemPrompt }]
    }

    async complete(userPrompt: string): Promise<string> {
        this.messages.push({ role: 'user', content: userPrompt })

        const maxAttempts = 3
        let response = ''
        for (let i = 0; i < maxAttempts; i++) {
            try {
                response = await this.interact()
                break
            } catch (error) {
                if (error instanceof Error) {
                    tui.error(error.message)
                } else {
                    tui.error('An unknown error occurred')
                }
                tui.action('Retrying after 1 second...')
                await sleep(1000)
            }
        }
        if (response === '') {
            tui.error(`Failed to get response after ${maxAttempts} attempts`)
            response = "Failed to get response"
        }

        this.messages.push({ role: 'assistant', content: response })

        const inputTokens = 0
        const outputTokens = 0
        const inputCost = estimateCost(inputTokens)
        const outputCost = estimateCost(outputTokens)

        this.totalInputTokens += inputTokens
        this.totalOutputTokens += outputTokens
        this.totalInputCost += inputCost.main!.input!
        this.totalOutputCost += outputCost.main!.output!

        return response
    }

    private async interact(): Promise<string> {
        let response = ''

        if (settings.showPrompts) {
            tui.print(`Prompt: (${this.messages.length})`)
            tui.print(chalk.gray(this.messages[this.messages.length - 1]!.content))
            tui.print('Reading response...')
        }

        const { id } = await this.jutge.instructor.jutgeai.chat({ model: this.model, messages: this.messages })

        const request = await fetch(`${this.jutge.JUTGE_API_URL}/webstreams/${id}`, {
            method: 'GET',
        })
        if (!request.body) {
            throw new Error('No response body');
        }
        if (request.status !== 200) {
            tui.error(`Failed to get response: Status ${request.status}`)
            throw new Error('Failed to get response');
        }

        const reader = request.body.getReader()
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const data = new TextDecoder().decode(value as Uint8Array)
            response += data
            if (settings.showAnswers) process.stdout.write(chalk.gray(data))
        }
        if (settings.showAnswers) process.stdout.write('\n')
        return response
    }



    forgetLastInteraction() {
        if (this.messages.length > 2) {
            this.messages.pop()
            this.messages.pop()
        }
    }

}



export type PowerEstimation = {
    wattHours: number
    joules: number
    co2Grams: number
    trees: number
}

export function estimatePowerConsumption(inputTokens: number, outputTokens: number): PowerEstimation {
    // Written by Claude.ai

    // Very rough estimates based on public data
    // One tree absorbs approximately:
    // - 22 kg (22,000g) of CO2 per year on average
    // - 1 ton (1,000,000g) over its lifetime (~40 years)

    const wattsPerToken = 0.0003 // ~0.3 milliwatts per token
    const totalTokens = inputTokens + outputTokens
    const co2PerTree = 22000

    return {
        wattHours: (totalTokens * wattsPerToken) / 3600, // Convert to Wh
        joules: totalTokens * wattsPerToken,
        co2Grams: ((totalTokens * wattsPerToken) / 3600) * 0.5, // Rough CO2 estimate
        trees: (((totalTokens * wattsPerToken) / 3600) * 0.5) / co2PerTree,
    }
}

export function cleanMardownCodeString(s: string): string {
    const pattern = /^\n*```\w*\s*(.*?)\s*```\n*$/s
    const clean = s.replace(pattern, '$1')
    return clean
}
