import chalk from 'chalk'
import { memo, sleep } from 'radash'
import { JutgeApiClient } from './jutge_api_client'
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
            response = 'Failed to get response'
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

        const request = await fetch(`${this.jutge.JUTGE_API_URL}/webstreams/${id}`, {
            method: 'GET',
        })
        if (!request.body) {
            throw new Error('No response body')
        }
        if (request.status !== 200) {
            tui.error(`Failed to get response: Status ${request.status}`)
            throw new Error('Failed to get response')
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

export function cleanMardownCodeString(s: string): string {
    const pattern = /^\n*```\w*\s*(.*?)\s*```\n*$/s
    const clean = s.replace(pattern, '$1')
    return clean
}

// prices in USD per 1M tokens
// data from https://openai.com/pricing/ and https://google.com/gemini/pricing/ at 2026-02-09
const prices = {
    'openai/gpt-5': {
        input: 1.25,
        output: 10.0,
    },
    'openai/gpt-5-mini': {
        input: 0.25,
        output: 2.0,
    },
    'openai/gpt-5-nano': {
        input: 0.05,
        output: 0.4,
    },
    'openai/gpt-4.1': {
        input: 2.0,
        output: 8.0,
    },
    'openai/gpt-4.1-mini': {
        input: 0.4,
        output: 1.6,
    },
    'openai/gpt-4.1-nano': {
        input: 0.1,
        output: 0.4,
    },
    'google/gemini-2.5-pro': {
        input: 1.25,
        output: 10.0,
    },
    'google/gemini-2.5-flash': {
        input: 0.3,
        output: 2.5,
    },
    'google/gemini-2.5-flash-lite': {
        input: 0.1,
        output: 0.4,
    },
}

function calculateCost(inputTokens: number, outputTokens: number, model: string) {
    if (!Object.keys(prices).includes(model)) {
        throw new Error(`Model not supported: ${model}`)
    }
    const price = prices[model as keyof typeof prices]
    const inputCost = (inputTokens * price.input) / 1_000_000
    const outputCost = (outputTokens * price.output) / 1_000_000
    return inputCost + outputCost
}

async function dolarsToEurosSlow(amount: number) {
    try {
        // https://frankfurter.dev/
        const request = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD')
        const data: any = await request.json()
        const rate = data.rates.USD
        return amount / rate
    } catch (error) {
        tui.error(`Failed to convert dollars to euros`)
        return amount / 0.85 // approximate rate for 2026-02-09
    }
}

export const dolarsToEuros = memo(dolarsToEurosSlow)

function eurosWithTax(amount: number) {
    // 21% VAT in Spain
    return amount * 1.21
}

export type LlmEstimation = {
    inputTokens: number // known
    outputTokens: number // known
    model: string // known
    priceEurTax: number // estimation in € with tax
    wattHours: number // estimation in Wh
    joules: number // estimation in J
    co2Grams: number // estimation in g
    carKm: number // estimation in km
    trees: number // estimation in trees
    waterLiters: number // estimation in liters
    brainHours: number // estimation in hours
}

export async function llmEstimates(inputTokens: number, outputTokens: number, model: string): Promise<LlmEstimation> {
    // Updated by Claude.ai with 2024-2025 research data

    // energySource Conservative mid-range estimate based on 2024-2025 research
    // co2Source IEA global grid average 2024 (445 g CO2/kWh)
    // waterSource Industry average WUE (1.8 L/kWh) + grid indirect (4.5 L/kWh)
    // notes Actual values vary significantly by model size, hardware, and regional grid mix
    // lastUpdated 2025-02-09

    const priceEurTax = eurosWithTax(await dolarsToEuros(calculateCost(inputTokens, outputTokens, model)))

    // ENERGY CONSUMPTION PER TOKEN
    // Updated estimate based on modern hardware and models
    // Sources indicate:
    // - Llama 3.3 70B on H100: ~0.39 J/token (Lin, 2025)
    // - GPT-4o estimate: ~0.3 Wh per query (~500 tokens) = ~2.16 J/token (Epoch AI, Feb 2025)
    // - Llama 3.1 405B: ~6,706 J per response (MIT Research, 2024)
    //
    // Using conservative mid-range estimate: 2-3 J/token
    // Converting to watts: 3 J/token / 3600 = 0.000833 Wh/token
    // Sources:
    // - https://llm-tracker.info/_TOORG/Power-Usage-and-Energy-Efficiency
    // - https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
    // - https://research.aimultiple.com/ai-energy-consumption/
    const wattsPerToken = 0.000833 // ~0.83 milliwatts per token (conservative estimate)

    // TREE CO2 ABSORPTION
    // Updated to use more accurate lifecycle data
    // One tree absorbs approximately:
    // - 22 kg (22,000g) of CO2 per year on average (original estimate - still valid)
    // - 1 ton (1,000,000g) over its lifetime (~40-50 years)
    // Source: Standard forestry estimates
    const co2PerTreePerYear = 22000 // grams

    const totalTokens = inputTokens + outputTokens

    // Energy calculations
    const wattHours = totalTokens * wattsPerToken
    const joules = wattHours * 3600

    // CO2 EMISSIONS
    // Updated global electricity grid carbon intensity
    // IEA 2024 data: 445 g CO2/kWh globally
    // Projected 2025-2026: declining to ~415 g CO2/kWh
    // Using current 2024 estimate
    // Sources:
    // - IEA Electricity 2025 Report: https://www.iea.org/reports/electricity-2025/emissions
    // - IEA Mid-Year Update 2025: https://www.iea.org/reports/electricity-mid-year-update-2025
    const co2PerKwh = 445 // grams CO2 per kWh (global average, 2024)
    const co2Grams = (wattHours * co2PerKwh) / 1000 // Convert Wh to kWh

    // Trees required to offset (annual basis)
    const trees = co2Grams / co2PerTreePerYear

    // Car km required to offset (annual basis)
    const carKm = co2Grams / 170 // Average car: ~170g CO2/km

    // WATER CONSUMPTION
    // Updated with data center water usage research
    // Industry average WUE (Water Usage Effectiveness): 1.8 L/kWh
    // AWS reports 0.19 L/kWh (best in class, hyperscale)
    // Indirect water (electricity generation): ~4.5 L/kWh (US average)
    // Total water footprint: Direct + Indirect
    //
    // Using industry average for direct water + moderate indirect estimate
    // Sources:
    // - The Green Grid WUE metrics
    // - Meta/Facebook industry reports: 1.8 L/kWh average
    // - Berkeley Lab: 4.52 L/kWh indirect (US)
    // - https://dgtlinfra.com/data-center-water-usage/
    // - https://www.eesi.org/articles/view/data-centers-and-water-consumption
    const directWaterPerKwh = 1.8 // liters per kWh (industry average on-site cooling)
    const indirectWaterPerKwh = 4.5 // liters per kWh (electricity generation)
    const totalWaterPerKwh = directWaterPerKwh + indirectWaterPerKwh
    const waterLiters = (wattHours * totalWaterPerKwh) / 1000 // Convert Wh to kWh

    // BRAIN COMPARISON
    // Human brain uses ~20W continuously
    // Sources:
    // - PMC: "Brain manages to produce poetry, design spacecraft,
    //   and create art on an energy budget of ~20 W"
    // - NIST: "Human brain performs exaflop with just 20 watts"
    // - Bond University: "Brain accounts for 20% of body's energy (0.3 kWh/day)"
    const brainWatts = 20
    const brainSeconds = (wattHours * 3600) / brainWatts
    const brainHours = brainSeconds / 3600

    return {
        inputTokens,
        outputTokens,
        model,
        priceEurTax,
        wattHours,
        joules,
        co2Grams,
        carKm,
        trees,
        waterLiters,
        brainHours,
    }
}
