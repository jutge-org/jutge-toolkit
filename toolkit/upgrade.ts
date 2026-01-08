import { Command } from '@commander-js/extra-typings'
import { upgrade } from '../lib/versions'

export const upgradeCmd = new Command('upgrade')
    .description('Upgrade to the latest version')

    .action(async () => {
        await upgrade()
    })
