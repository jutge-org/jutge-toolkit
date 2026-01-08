import { Command } from '@commander-js/extra-typings'
import sharp from 'sharp'
import z from 'zod'
import { complete, generateImage, listModels } from '../lib/ai.ts'
import { settings } from '../lib/settings.ts'
import tui from '../lib/tui.ts'
import { convertStringToItsType } from '../lib/utils.ts'

export const aiCmd = new Command('ai')
    .description('Query AI models')

    .action(() => {
        aiCmd.help()
    })

aiCmd
    .command('models')
    .description('Show available AI models')

    .action(async () => {
        const models = await listModels()
        tui.yaml(models)
    })

aiCmd
    .command('complete')
    .description('Complete a prompt using an AI model')

    .argument('<prompt>', 'the user prompt to complete')
    .option('-s, --system-prompt <system>', 'the system prompt to use', 'You are a helpful assistant.')
    .option('-m, --model <model>', 'the AI model to use', settings.defaultModel)

    .action(async (prompt, { model, systemPrompt }) => {
        prompt = prompt.trim()
        systemPrompt = systemPrompt.trim()
        const answer = await complete(model, systemPrompt, prompt)
        tui.print(answer)
    })

// TODO: generate with different aspect ratios
aiCmd
    .command('image')
    .description('Generate a square image using an AI model')

    .argument('<prompt>', 'description of the image to generate')
    .option('-m, --model <model>', 'the graphic AI model to use', 'openai/dall-e-3')
    .option('-s, --size <size>', 'the size of the image (in pixels)', '1024')
    .option('-o, --output <path>', 'the output image path', 'image.png')

    .action(async (prompt, { model, size, output }) => {
        const sizeInt = z.int().min(16).max(2048).parse(convertStringToItsType(size))
        const image = await generateImage(model, prompt)
        await sharp(image).resize(sizeInt, sizeInt).toFile(output)
        tui.success(`Generated image saved to ${output}`)
        await tui.image(output, 20, 10)
    })
