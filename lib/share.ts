import { exists } from 'fs/promises'
import { join, resolve } from 'path'
import { getLoggedInJutgeClient } from './login'
import tui from './tui'
import { ProblemInfo } from './types'
import { nothing, readYaml, writeYamlInDir } from './utils'

const passcodeStrengthDescription = 'Passcode must be at least 8 characters long and only contain letters and digits.'

function checkPasscodeStrength(passcode: string) {
    return passcode.length >= 8 && passcode.match(/^[0-9a-zA-Z]+$/)
}

async function ensureProblemYml(dir: string): Promise<ProblemInfo> {
    const ymlPath = join(dir, 'problem.yml')
    if (!(await exists(ymlPath))) {
        throw new Error(`No problem.yml file in directory ${dir}`)
    }
    const data = await readYaml(ymlPath)
    return ProblemInfo.parse(data)
}

export async function showSharingSettings(directory: string): Promise<void> {
    const dir = resolve(directory)
    const info = await ensureProblemYml(dir)
    const jutge = await getLoggedInJutgeClient()
    await tui.section('Updating sharing settings', async () => {
        const settings = await jutge.instructor.problems.getSharingSettings(info.problem_nm)
        tui.success('Sharing settings retrieved successfully')
        info.passcode = settings.passcode || ''
        info.shared_testcases = settings.shared_testcases
        info.shared_solutions = settings.shared_solutions
    })
    await tui.section('Updating problem.yml', async () => {
        await writeYamlInDir(dir, 'problem.yml', info)
        tui.success('problem.yml updated')
    })
    await tui.section('Current sharing settings:', async () => {
        await nothing()
        const settings = {
            problem_nm: info.problem_nm,
            passcode: info.passcode,
            shared_testcases: info.shared_testcases,
            shared_solutions: info.shared_solutions,
        }
        tui.yaml(settings)
    })
}

export type UpdateSharingOptions = {
    /** New passcode (string), false to clear, undefined to leave unchanged */
    passcode?: string | false
    /** true = share testcases, false = stop sharing, undefined = no change */
    testcases?: boolean
    /** true = share solutions, false = stop sharing, undefined = no change */
    solutions?: boolean
}

export async function updateSharingSettings(directory: string, options: UpdateSharingOptions): Promise<void> {
    if (options.passcode) {
        if (!checkPasscodeStrength(options.passcode)) {
            tui.error(passcodeStrengthDescription)
            return
        }
    }

    const dir = resolve(directory)
    const info = await ensureProblemYml(dir)
    const jutge = await getLoggedInJutgeClient()

    await tui.section('Getting current sharing settings', async () => {
        const current = await jutge.instructor.problems.getSharingSettings(info.problem_nm)
        tui.success('Current settings retrieved')

        const passcode =
            options.passcode !== undefined
                ? options.passcode === false
                    ? null
                    : (options.passcode ?? '')
                : current.passcode
        const shared_testcases = options.testcases !== undefined ? options.testcases : current.shared_testcases
        const shared_solutions = options.solutions !== undefined ? options.solutions : current.shared_solutions

        const payload = {
            problem_nm: info.problem_nm,
            passcode,
            shared_testcases,
            shared_solutions,
        }

        await tui.section('Updating sharing settings', async () => {
            await jutge.instructor.problems.setSharingSettings(payload)
            tui.success('Sharing settings updated')
        })

        info.passcode = passcode ?? ''
        info.shared_testcases = shared_testcases
        info.shared_solutions = shared_solutions

        await tui.section('Updating problem.yml', async () => {
            await writeYamlInDir(dir, 'problem.yml', info)
            tui.success('problem.yml updated')
        })

        await tui.section('Current sharing settings:', async () => {
            await nothing()
            const settings = {
                passcode: info.passcode,
                shared_testcases: info.shared_testcases,
                shared_solutions: info.shared_solutions,
            }
            tui.yaml(settings)
        })
    })
}
