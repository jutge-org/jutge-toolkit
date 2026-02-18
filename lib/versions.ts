import { execSync } from 'child_process'
import { join } from 'path'
import semver from 'semver'
import { PackageJson } from 'zod-package-json'
import { confirm } from '@inquirer/prompts'
import tui from './tui'
import { nothing, projectDir, readJson } from './utils'

export const packageJson = PackageJson.parse(await readJson(join(projectDir(), 'package.json')))

export async function checkVersion(): Promise<void> {
    const currentVersion = await getCurrentVersion()
    const latestPublishedVersion = await getLatestPublishedVersion()
    if (semver.lt(currentVersion, latestPublishedVersion)) {
        tui.warning(
            `A new version of ${packageJson.name} is available: ${latestPublishedVersion} (you have ${packageJson.version})`,
        )
        tui.warning(`Please update by running: jtk upgrade`)
        tui.print()
    }
}

export async function getCurrentVersion(): Promise<string> {
    await nothing()
    return packageJson.version
}

export async function getLatestPublishedVersion(): Promise<string> {
    const response = await fetch(`https://registry.npmjs.org/${packageJson.name}/latest`)
    const data = (await response.json()) as any
    return data.version as string
}

export async function upgrade(): Promise<void> {
    const currentVersion = await getCurrentVersion()
    const latestPublishedVersion = await getLatestPublishedVersion()
    if (semver.eq(currentVersion, latestPublishedVersion)) {
        tui.success(`You already have the latest version (${currentVersion})`)
    } else if (semver.gt(currentVersion, latestPublishedVersion)) {
        tui.success(
            `You have a newer version (${currentVersion}) than the latest published version (${latestPublishedVersion})`,
        )
    } else {
        tui.action(`Upgrading from version ${currentVersion} to ${latestPublishedVersion}`)
        execSync(`bun install --global ${packageJson.name}@latest`, { stdio: 'inherit' })
        tui.success(`Successfully upgraded to version ${latestPublishedVersion}`)
        tui.print()
        const installCompletions = await confirm({
            message: 'Install shell completions (Bash, Zsh, Fish, PowerShell) now?',
            default: true,
        })
        if (installCompletions) {
            execSync('jtk completion install', { stdio: 'inherit' })
        } else {
            tui.print('To install or update shell completions later, run:')
            tui.print('  jtk completion install')
        }
    }
}
