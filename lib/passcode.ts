import { input, password as input_password } from '@inquirer/prompts'
import { exists } from 'fs/promises'
import { join, resolve } from 'path'
import { JutgeApiClient } from './jutge_api_client'
import { settings } from './settings'
import tui from './tui'
import { ProblemInfo } from './types'
import { readYaml, writeYamlInDir } from './utils'

async function loginToJutge(jutge: JutgeApiClient): Promise<void> {
    await tui.section('Logging in to Jutge.org', async () => {
        let email = process.env.JUTGE_EMAIL
        let password = process.env.JUTGE_PASSWORD

        if (!email || !password) {
            tui.warning('set JUTGE_EMAIL and JUTGE_PASSWORD environment variables to login without prompt')
            email = await input({ message: 'Jutge.org email:', default: settings.email || '' })
            password = await input_password({ message: 'Jutge.org password:' })
        }

        await jutge.login({ email, password })
    })
}

async function ensureProblemYml(dir: string): Promise<ProblemInfo> {
    const ymlPath = join(dir, 'problem.yml')
    if (!(await exists(ymlPath))) {
        throw new Error('No problem.yml file in directory')
    }
    const data = await readYaml(ymlPath)
    return ProblemInfo.parse(data)
}

export async function showPasscodeInDirectory(directory: string): Promise<void> {
    const dir = resolve(directory)
    const info = await ensureProblemYml(dir)
    tui.success(`Passcode: ${info.passcode}`)
}

export async function setPasscodeInDirectory(directory: string, passcode?: string): Promise<void> {
    const dir = resolve(directory)
    const info = await ensureProblemYml(dir)
    let code = passcode
    if (code === undefined) {
        code = await input_password({ message: 'Passcode:' })
    }
    if (!checkPasscodeStrength(code)) {
        tui.error(passcodeStrengthDescription)
        return
    }
    const jutge = new JutgeApiClient()
    await loginToJutge(jutge)
    await jutge.instructor.problems.setPasscode({ problem_nm: info.problem_nm, passcode: code })
    info.passcode = code
    await writeYamlInDir(dir, 'problem.yml', info)
    tui.success('Passcode set successfully')
}

export async function removePasscodeInDirectory(directory: string): Promise<void> {
    const dir = resolve(directory)
    const info = await ensureProblemYml(dir)
    const jutge = new JutgeApiClient()
    await loginToJutge(jutge)
    await jutge.instructor.problems.removePasscode(info.problem_nm)
    info.passcode = ''
    await writeYamlInDir(dir, 'problem.yml', info)
    tui.success('Passcode removed successfully')
}

const passcodeStrengthDescription = 'Passcode must be at least 8 characters long and only contain letters and digits.'

function checkPasscodeStrength(passcode: string) {
    return passcode.length >= 8 && passcode.match(/^[0-9a-zA-Z]+$/)
}

