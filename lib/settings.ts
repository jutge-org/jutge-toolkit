import envPaths from 'env-paths'
import { exists, mkdir } from 'fs/promises'
import { join } from 'path'
import { guessUserEmail, guessUserName, readYaml, writeYaml } from './utils'
import { Settings } from './types'

export const paths = envPaths('jutge', { suffix: 'toolkit' })

export function configPath() {
    return join(paths.config, 'config.yml')
}

// console.log(`Configuration path: ${configPath()}`)

export async function initializePaths() {
    await mkdir(paths.config, { recursive: true })
    await mkdir(paths.data, { recursive: true })
    await mkdir(paths.cache, { recursive: true })
    await mkdir(paths.log, { recursive: true })
    await mkdir(paths.temp, { recursive: true })
}

export async function saveSettings(settings: Settings) {
    await initializePaths()
    settings = Settings.parse(settings)
    return await writeYaml(configPath(), settings)
}

export async function loadSettings(): Promise<Settings> {
    const data = await readYaml(configPath())
    return Settings.parse(data)
}

export async function loadSettingsAtStart(): Promise<Settings> {
    if (!(await settingsExist())) {
        const defaultSettings = Settings.parse({})
        defaultSettings.name = (await guessUserName()) || 'John Doe'
        defaultSettings.email = (await guessUserEmail()) || 'john.doe@example.com'
        await saveSettings(defaultSettings)
        return defaultSettings
    } else {
        return await loadSettings()
    }
}

export async function settingsExist(): Promise<boolean> {
    return await exists(configPath())
}

// settings loaded at the start of the program
export const settings = await loadSettingsAtStart()
