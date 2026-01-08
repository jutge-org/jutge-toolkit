import { Command } from '@commander-js/extra-typings'
import { confirm } from '@inquirer/prompts'
import { editor } from '@inquirer/prompts'
import YAML from 'yaml'
import { ZodError } from 'zod'
import { fromError } from 'zod-validation-error'
import { configPath, loadSettings, saveSettings, settings } from '../lib/settings'
import { Settings } from '../lib/types.ts'
import tui from '../lib/tui.ts'
import { convertStringToItsType } from '../lib/utils.ts'

export const configCmd = new Command('config')
    .summary('Manage configuration')
    .description(
        `Manage configuration
    
The actual configuration file is stored at ${configPath()}`,
    )

    .action(() => {
        configCmd.help()
    })

configCmd
    .command('show')
    .alias('list')
    .description('Show configuration options')

    .action(async () => {
        const settings = await loadSettings()
        tui.yaml(settings)
    })

configCmd
    .command('get <key>')
    .description('Get the value of a configuration option')

    .action((key: string) => {
        if (!(key in settings)) {
            throw new Error(`Configuration key ${key} does not exist`)
        }
        console.log((settings as any)[key])
    })

configCmd
    .command('set <key> <value>')
    .description('Set the value of a configuration option')

    .action(async (key: string, value: string) => {
        if (!(key in settings)) {
            throw new Error(`Configuration key ${key} does not exist`)
        }
        const convertedValue = convertStringToItsType(value)
        const newSettings = Settings.parse({ ...settings, [key]: convertedValue })
        await saveSettings(newSettings)
        tui.success(`Configuration key ${key} updated successfully`)
    })

configCmd
    .command('edit')
    .description('Open an editor (uses $EDITOR or $VISUAL) to modify the configuration options')

    .action(async () => {
        let data = YAML.stringify(settings, null, 4)
        while (true) {
            const newData = await editor({
                message: 'Edit configuration',
                default: data,
                postfix: '.yml',
                waitForUserInput: false,
            })
            try {
                const newSettings = Settings.parse(YAML.parse(newData))
                await saveSettings(newSettings)
                tui.success('Configuration options updated successfully')
                return
            } catch (error) {
                if (error instanceof ZodError) {
                    console.error(fromError(error).toString())
                } else {
                    console.error(error)
                }
                const again = await confirm({ message: 'Edit again?', default: true })
                if (!again) {
                    tui.warning('No changes made to the configuration options')
                    return
                }
                data = newData
            }
        }
    })

configCmd
    .command('reset')
    .description('Reset configuration to default values')

    .option('-f, --force', 'force reset without confirmation', false)

    .action(async ({ force }) => {
        if (!force) {
            const confirmReset = await confirm({
                message: 'Are you sure you want to reset the configuration to default values?',
                default: false,
            })
            if (!confirmReset) {
                tui.warning('Reset cancelled')
                return
            }
        }
        const defaultSettings = Settings.parse({})
        await saveSettings(defaultSettings)
        tui.success('Configuration reset to default values successfully')
    })
