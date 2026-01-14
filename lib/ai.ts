import { encode } from 'gpt-tokenizer'

import { estimateCost } from 'gpt-tokenizer/model/gpt-5'
import { igniteModel, LlmModel, loadModels, logger, Message, type LlmResponse } from 'multi-llm-ts'
import OpenAI from 'openai'
import tui from './tui'
import ora from 'ora'
import { settings } from './settings'

// do not log anything from multi-llm-ts
logger.disable()

export async function complete(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const parts = model.split('/')
    const providerName = parts[0]!
    const modelName = parts[1]!

    const apiKey = process.env[keys[providerName]!] || ''
    if (!apiKey) {
        throw new Error(`Environment variable ${keys[providerName]} not set`)
    }
    const config = { apiKey }

    const models = await loadModels(providerName, config)
    const chat = models!.chat.find((m) => m.id === modelName)!

    const bot = igniteModel(providerName, chat, config)
    const messages = [new Message('system', systemPrompt), new Message('user', userPrompt)]
    if (settings.showPrompts) tui.gray(`[SYSTEM PROMPT] ${systemPrompt}`)
    if (settings.showPrompts) tui.gray(`[USER PROMPT] ${userPrompt}`)
    const spinner = ora(`Generating response with model ${model}`).start()
    let response: LlmResponse
    try {
        response = await bot.complete(messages)
    } catch (error) {
        spinner.stop()
        throw error
    }
    spinner.stop()
    const answer = response.content!
    if (settings.showAnswers) tui.gray(`[ANSWER] ${answer}`)
    return answer
}

type ModelInfo = Record<string, Record<string, string[]>>

export async function listModels(): Promise<ModelInfo> {
    const result: ModelInfo = {}
    const providers = Object.keys(keys).sort()
    for (const providerName of providers) {
        if (providerName === 'ollama') continue // Ollama models are local, skip for now

        const apiKey = process.env[keys[providerName]!] || ''
        if (!apiKey) {
            throw new Error(`Environment variable ${keys[providerName]} not set`)
        }
        const config = { apiKey }

        const models = await loadModels(providerName, config)
        if (models === null) continue
        result[providerName] = {}
        for (const modelType in models) {
            result[providerName][modelType] = []
            for (const model of models.chat) {
                result[providerName][modelType].push(model.id)
            }
        }
    }
    return result
}

export class ChatBot {
    private model: string
    public totalOutputCost: number = 0
    private messages: Message[]
    private bot: LlmModel | null = null
    public totalInputTokens: number = 0
    public totalOutputTokens: number = 0
    public totalInputCost: number = 0
    private systemPrompt: string

    constructor(model: string, systemPrompt: string) {
        this.model = model
        this.systemPrompt = systemPrompt
        this.messages = [new Message('system', systemPrompt)]
    }

    async init() {
        const parts = this.model.split('/')
        const providerName = parts[0]!
        const modelName = parts[1]!
        const config = { apiKey: process.env[keys[providerName]!] || '' }
        const models = await loadModels(providerName, config)
        const chat = models!.chat.find((m: any) => m.id === modelName)!
        this.bot = igniteModel(providerName, chat, config)
    }

    async complete(userPrompt: string): Promise<string> {
        if (!this.bot) {
            throw new Error(`Model '${this.model}' could not be initialized`)
        }

        this.messages.push(new Message('user', userPrompt))
        if (settings.showPrompts) tui.gray(`[SYSTEM PROMPT] ${this.systemPrompt}`)
        if (settings.showPrompts) tui.gray(`[USER PROMPT] ${this.messages[this.messages.length - 1]!.content}`)
        const spinner = ora(`Generating response with model ${this.model}`).start()
        const response = await this.bot.complete(this.messages)
        spinner.stop()
        this.messages.push(new Message('assistant', response.content))
        if (settings.showAnswers) tui.gray(`[ANSWER] ${response.content!}`)

        const inputTokens = encode(userPrompt).length
        const outputTokens = encode(response.content!).length
        const inputCost = estimateCost(inputTokens)
        const outputCost = estimateCost(outputTokens)

        this.totalInputTokens += inputTokens
        this.totalOutputTokens += outputTokens
        this.totalInputCost += inputCost.main!.input!
        this.totalOutputCost += outputCost.main!.output!

        return response.content!
    }

    forgetLastInteraction() {
        if (this.messages.length > 2) {
            this.messages.pop()
            this.messages.pop()
        }
    }

    modelInformation(): any {
        if (!this.bot) {
            throw new Error(`Model '${this.model}' has not been initialized`)
        }
        return this.bot.model
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

const keys: Record<string, string> = {
    google: 'GEMINI_API_KEY',
    openai: 'OPENAI_API_KEY',
    ollama: '',
}

export function cleanMardownCodeString(s: string): string {
    const pattern = /^\n*```\w*\s*(.*?)\s*```\n*$/s
    const clean = s.replace(pattern, '$1')
    return clean
}

/**
 * Generate image with openai/dall-e-3 or equivalent model
 * Returns png image as a Buffer
 */
export async function generateImage(model: string, prompt: string): Promise<Buffer> {
    model = model.split('/')[1]!
    if (settings.showPrompts) tui.gray(`[PROMPT] ${prompt}`)

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Generate image
    const spinner = ora(`Generating image with model ${model}`).start()
    const response1 = await openai.images.generate({
        model,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
    })
    spinner.stop()

    // Retrieve image URL
    if (!response1.data || !response1.data.length || !response1.data[0] || !response1.data[0].url) {
        throw new Error('No image generated')
    }
    const url = response1.data[0].url

    // Download image
    spinner.start('Downloading image')
    const response2 = await fetch(url)
    const arrayBuffer = await response2.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    spinner.stop()

    // Done!
    return buffer
}
