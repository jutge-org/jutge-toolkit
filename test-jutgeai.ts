import { complete } from './lib/aiclient'
import { getLoggedInJutgeClient } from './lib/login'
import { settings } from './lib/settings'

console.log(settings.defaultModel)
const text = process.argv[2] ?? 'The quick brown fox'
const jutge = await getLoggedInJutgeClient()
const answer = await complete(
    jutge,
    settings.defaultModel,
    'foo',
    'Continue the given text in one or two sentences. Output only the continuation, no quotes.',
    text,
)
console.log(answer)
