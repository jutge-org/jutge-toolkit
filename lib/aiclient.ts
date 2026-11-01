import chalk from 'chalk'
import { memo, sleep } from 'radash'
import { JutgeApiClient, type ModelPrices } from './jutge_api_client'
import { settings } from './settings'
import tui from './tui'

export async function complete(
    jutge: JutgeApiClient,
    model: string,
    label: string,
    systemPrompt: string,
    userPrompt: string,
): Promise<string> {
    const bot = new ChatBot(jutge, model, label, systemPrompt)
    return await bot.complete(userPrompt)
}

type Message = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export class ChatBot {
    private jutge: JutgeApiClient
    private model: string
    private label: string
    private messages: Message[]

    constructor(jutge: JutgeApiClient, model: string, label: string, systemPrompt: string) {
        this.jutge = jutge
        this.model = model
        this.label = label
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
            return 'Failed to get response'
        }

        this.messages.push({ role: 'assistant', content: response })

        return response
    }

    private async interact(): Promise<string> {
        let response = ''

        if (settings.showPrompts) {
            tui.print(`Prompt: (${this.messages.length})`)
            tui.print(chalk.gray(this.messages[this.messages.length - 1]!.content))
            tui.print('Reading response...')
        }

        const { id } = await this.jutge.instructor.jutgeai.chat({
            model: this.model,
            label: this.label,
            messages: this.messages,
            addUsage: false,
        })

        const resp = await fetch(`${this.jutge.JUTGE_API_URL}/webstreams/${id}`, {
            method: 'GET',
        })
        if (!resp.body) {
            throw new Error('No response body')
        }
        if (resp.status !== 200) {
            tui.error(`Failed to get response: Status ${resp.status}`)
            throw new Error('Failed to get response')
        }

        const reader = resp.body.getReader()
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

export function cleanMarkdownCodeString(s: string): string {
    const pattern = /^\n*```\w*\s*(.*?)\s*```\n*$/s
    const clean = s.replace(pattern, '$1')
    return clean
}


const getModelPricesSlow = async (jutge: JutgeApiClient) => jutge.instructor.jutgeai.getPrices()

export const getModelPrices = memo(getModelPricesSlow)

export function calculateCostUsd(
    inputTokens: number,
    outputTokens: number,
    model: string,
    prices: ModelPrices,
): number {
    const price = prices[model]
    if (!price) {
        throw new Error(`Model not supported: ${model}`)
    }
    const inputCost = (inputTokens * price.input) / 1_000_000
    const outputCost = (outputTokens * price.output) / 1_000_000
    return inputCost + outputCost
}

export async function priceEurTaxFromTokens(
    inputTokens: number,
    outputTokens: number,
    model: string,
    prices: ModelPrices,
): Promise<number> {
    return eurosWithTax(await dolarsToEuros(calculateCostUsd(inputTokens, outputTokens, model, prices)))
}

async function dolarsToEurosSlow(amount: number) {
    try {
        // https://frankfurter.dev/
        const request = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD')
        const data: any = await request.json()
        const rate = data.rates.USD
        return amount / rate
    } catch (error) {
        tui.error(`Failed to convert dolars to euros`)
        return amount * 0.85 // approximate rate for 2026-02-09
    }
}

export const dolarsToEuros = memo(dolarsToEurosSlow)

function eurosWithTax(amount: number) {
    // 21% VAT in Spain
    return amount * 1.21
}

export type LlmImpactEstimation = {
    wattHours: number // estimation in Wh
    joules: number // estimation in J
    co2Grams: number // estimation in g
    carKm: number // estimation in km
    trees: number // estimation in trees
    waterLiters: number // estimation in liters
    brainHours: number // estimation in hours
}

export type LlmEstimation = {
    inputTokens: number // known
    outputTokens: number // known
    model: string // known
    priceEurTax: number // estimation in € with tax
} & LlmImpactEstimation

/** Model-independent environmental estimates (fixed compromise rates). */
export function llmImpactEstimates(inputTokens: number, outputTokens: number): LlmImpactEstimation {
    // energySource Conservative mid-range estimate based on 2024-2025 research
    // co2Source IEA global grid average 2024 (445 g CO2/kWh)
    // waterSource Industry average WUE (1.8 L/kWh) + grid indirect (4.5 L/kWh)
    // notes Same rates for every model; input vs output split reflects prefill vs decode
    // lastUpdated 2025-02-09

    // ENERGY CONSUMPTION PER TOKEN (model-independent compromise)
    // Prefill (input) is cheaper per token; autoregressive decode (output) is costlier.
    // Mid-range ~1 J/token input, ~3 J/token output (see llmEstimates history in git).
    const inputWhPerToken = 1 / 3600 // ~1 J/token
    const outputWhPerToken = 3 / 3600 // ~3 J/token

    const co2PerTreePerYear = 22000 // grams

    const wattHours = inputTokens * inputWhPerToken + outputTokens * outputWhPerToken
    const joules = wattHours * 3600

    const co2PerKwh = 445 // grams CO2 per kWh (global average, 2024)
    const co2Grams = (wattHours * co2PerKwh) / 1000

    const trees = co2Grams / co2PerTreePerYear
    const carKm = co2Grams / 170

    const totalWaterPerKwh = 1.8 + 4.5
    const waterLiters = (wattHours * totalWaterPerKwh) / 1000

    const brainWatts = 20
    const brainHours = wattHours / brainWatts

    return {
        wattHours,
        joules,
        co2Grams,
        carKm,
        trees,
        waterLiters,
        brainHours,
    }
}

export async function llmEstimates(
    jutge: JutgeApiClient,
    inputTokens: number,
    outputTokens: number,
    model: string,
    prices?: ModelPrices,
): Promise<LlmEstimation> {
    const modelPrices = prices ?? (await getModelPrices(jutge))
    const priceEurTax = await priceEurTaxFromTokens(inputTokens, outputTokens, model, modelPrices)

    return {
        inputTokens,
        outputTokens,
        model,
        priceEurTax,
        ...llmImpactEstimates(inputTokens, outputTokens),
    }
}
