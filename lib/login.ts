
import { input, password as input_password } from '@inquirer/prompts'
import { JutgeApiClient } from './jutge_api_client'
import { settings } from './settings'
import tui from './tui'


export async function loginToJutge(jutge: JutgeApiClient): Promise<string> {
    // returns email

    return await tui.section('Loging in into Jutge.org', async () => {
        let email = process.env.JUTGE_EMAIL
        let password = process.env.JUTGE_PASSWORD

        if (!email || !password) {
            tui.warning('set JUTGE_EMAIL and JUTGE_PASSWORD environment variables to login without prompt')
            email = await input({ message: 'Jutge.org email:', default: settings.email || '' })
            password = await input_password({ message: 'Jutge.org password:' })
        } else {
            tui.print(`Email: ${email}`)
        }

        await jutge.login({ email, password })
        return email
    })
}

export async function getLoggedInJutgeClient(): Promise<JutgeApiClient> {
    const jutge = new JutgeApiClient()
    await loginToJutge(jutge)
    return jutge
}

