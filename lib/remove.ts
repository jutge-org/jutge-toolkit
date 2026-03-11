import { exists, unlink } from 'fs/promises'
import { join, resolve } from 'path'
import { confirm } from '@inquirer/prompts'
import { getLoggedInJutgeClient } from './login'
import tui from './tui'
import { ProblemInfo } from './types'
import { readYaml } from './utils'

export interface RemoveOptions {
    yes?: boolean
}

export async function removeProblemInDirectory(
    directory: string,
    options: RemoveOptions = {},
): Promise<void> {
    const { yes = false } = options

    const dir = resolve(directory)
    if (!dir.endsWith('.pbm')) {
        throw new Error(`Directory ${directory} is not a problem directory (missing .pbm suffix)`)
    }

    const ymlPath = join(dir, 'problem.yml')
    if (!(await exists(ymlPath))) {
        throw new Error('No problem.yml in directory. The problem may not be linked to Jutge.org.')
    }

    const data = await readYaml(ymlPath)
    const info = ProblemInfo.parse(data)

    await tui.section(`Removing problem ${info.problem_nm} from Jutge.org`, async () => {

        const jutge = await getLoggedInJutgeClient()

        const submissions = await jutge.instructor.problems.getAnonymousSubmissions(info.problem_nm)
        const count = submissions.length
        tui.print(`Problem ${info.problem_nm} has ${count} submission${count === 1 ? '' : 's'} on Jutge.org.`)

        if (!yes) {
            const confirmed = await confirm({
                message: 'Remove this problem from Jutge.org and delete problem.yml?',
                default: false,
            })
            if (!confirmed) {
                tui.warning('Removal cancelled.')
                return
            }
        }

        await jutge.instructor.problems.remove(info.problem_nm)
        tui.success('Problem removed from Jutge.org')
        await unlink(ymlPath)
        tui.success('problem.yml deleted')
    })

}
