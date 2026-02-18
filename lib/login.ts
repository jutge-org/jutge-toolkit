/*

You can log in in any of the following ways:

1. **Using a token**
   - Set the `JUTGE_TOKEN` environment variable to your access token, or
   - Use a token already stored in the credentials file (the active account’s token).

2. **Using email and password**
   - **Email:** set `JUTGE_EMAIL`, or use the email from the credentials file, or enter it when prompted.
   - **Password:** set `JUTGE_PASSWORD`, or use the saved password in the credentials file for that email, or enter it when prompted.

3. **Choosing an account**
   - If you have several accounts in the credentials file, you can pick one from the list or choose "Other" and enter a different email (and password when asked).

If no valid token is available, the program will ask for (or use) email and password as above. After a successful login, your name is shown to confirm you are logged in.

*/


import { input, password as input_password, select } from '@inquirer/prompts'
import envPaths from 'env-paths'
import { exists } from 'fs/promises'
import { join } from 'path'
import { JutgeApiClient, type Profile } from './jutge_api_client'
import { settings } from './settings'
import tui from './tui'
import { Credentials } from './types'
import { readJson } from './utils'
import { memo } from 'radash'

async function findPassword(email: string): Promise<string | undefined> {
    tui.tryTo(`Try to get password from credentials file`)
    const fromFile = await getPasswordFromFile(email)
    if (fromFile) {
        tui.trySuccess()
        return fromFile
    }
    tui.tryFailure()

    tui.tryTo('Try to get password from JUTGE_PASSWORD environment variable')
    const fromEnv = process.env.JUTGE_PASSWORD
    if (fromEnv) {
        tui.trySuccess()
        return fromEnv
    }
    tui.tryFailure()

    tui.print('Prompting for password')
    const fromPrompt = await askPassword(email)
    if (fromPrompt) {
        tui.trySuccess()
        return fromPrompt
    }
    tui.tryFailure()

    return undefined
}

async function getPasswordFromFile(email: string): Promise<string | undefined> {
    const credentials = await getCredentialsFromFile()
    if (!credentials) return undefined
    const credential = Object.values(credentials).find((c) => c.email === email)
    if (!credential) return undefined
    if (!credential.savedPassword) return undefined
    return atob(credential.savedPassword)
}

async function findEmail(): Promise<string | undefined> {
    tui.tryTo('Try to get email from JUTGE_EMAIL environment variable')
    const fromEnv = process.env.JUTGE_EMAIL
    if (fromEnv) {
        tui.trySuccess()
        return fromEnv
    }
    tui.tryFailure()

    tui.tryTo('Try to get email from credentials file')
    const fromFile = await getEmailFromFile()
    if (fromFile) {
        tui.trySuccess()
        return fromFile
    }
    tui.tryFailure()

    tui.print('Prompting for email')
    const fromPrompt = await askEmail()
    if (fromPrompt) return fromPrompt
    return undefined
}

async function getEmailFromFile(): Promise<string | undefined> {
    const credentials = await getCredentialsFromFile()
    if (!credentials) return undefined
    const activeCredential = Object.values(credentials).find((c) => c.active === true)
    if (!activeCredential) return undefined
    return activeCredential.email
}

async function getEmailFromPrompt(): Promise<string | undefined> {
    return await input({ message: 'Jutge.org email:', default: settings.email || '' })
}

async function askEmail(): Promise<string | undefined> {
    const credentials = await getCredentialsFromFile()
    if (!credentials || Object.values(credentials).length === 0) return getEmailFromPrompt()

    const choices = Object.values(credentials).map((c) => ({ name: c.email, value: c.email })).sort()
    choices.push({ name: 'Other', value: 'other' })
    const answer = await select({ message: 'Select email:', choices })
    if (answer === 'other') return getEmailFromPrompt()
    return answer
}

async function askPassword(email: string): Promise<string | undefined> {
    return await input_password({ message: `Jutge.org password for ${email}:` })
}

async function findToken(): Promise<string | undefined> {
    tui.tryTo('Try to get token from JUTGE_TOKEN environment variable')
    const fromEnv = process.env.JUTGE_TOKEN
    if (fromEnv) {
        tui.trySuccess()
        return fromEnv
    }
    tui.tryFailure()

    tui.tryTo('Try to get token from credentials file')
    const fromFile = await getTokenFromFile()
    if (fromFile) {
        tui.trySuccess()
        return fromFile
    }
    tui.tryFailure()

    return undefined
}

async function getTokenFromFile(): Promise<string | undefined> {
    const credentials = await getCredentialsFromFile()
    if (!credentials) return undefined
    const activeCredential = Object.values(credentials).find((c) => c.active === true)
    if (!activeCredential) return undefined
    return activeCredential.token
}

async function getCredentialsFromFileReal(): Promise<Credentials | undefined> {
    const CREDENTIALS_PATHS = envPaths('jutge', { suffix: 'cli' })
    const CREDENTIALS_PATH = join(CREDENTIALS_PATHS.config, 'credentials.json')

    if (!(await exists(CREDENTIALS_PATH))) return undefined
    const data = await readJson(CREDENTIALS_PATH)
    const credentials = Credentials.parse(data)
    return credentials
}

const getCredentialsFromFile = memo(getCredentialsFromFileReal, { ttl: 1000 /*ms*/ })

async function showMiniProfile(jutge: JutgeApiClient): Promise<void> {
    const profile = await tui.section('Getting name from profile', async () => {
        try {
            return await jutge.student.profile.get()
        } catch (error) {
            tui.error('Could not get profile, check your credentials or internet connection')
            throw error
        }
    })
    tui.success(`Logged in as ${profile.name} with email ${profile.email}`)
}

async function loginToJutge(jutge: JutgeApiClient): Promise<void> {
    // returns the name of the logged in user

    const token = await findToken()
    if (token) {
        const meta = { token }
        jutge.meta = meta
        return
    }

    const email = await findEmail()
    if (!email) throw new Error('Could not log in')
    tui.success(`Email: ${email}`)

    const password = await findPassword(email)
    if (!password) throw new Error('Could not log in')
    tui.success(`Password: ${'*'.repeat(password.length)}`)

    await jutge.login({ email, password })
    return
}

export async function getLoggedInJutgeClient(): Promise<JutgeApiClient> {
    return await tui.section('Logging in to Jutge.org', async () => {
        const jutge = new JutgeApiClient()
        await loginToJutge(jutge)
        await showMiniProfile(jutge)
        return jutge
    })
}

