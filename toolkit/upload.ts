import { Command } from '@commander-js/extra-typings'
import { uploadProblemInDirectory } from '../lib/upload'

export const uploadCmd = new Command('upload')
    .summary('Upload problem to Jutge.org')
    .description(
        `Upload problem to Jutge.org

If problem.yml exists, the problem will be updated at Jutge.org using that information (which includes its problem id).
If problem.yml does not exist, a new problem will be created at Jutge.org and problem.yml will be generated.
`,
    )

    .option('-d, --directory <directory>', 'problem directory', '.')

    .action(async ({ directory }) => {
        await uploadProblemInDirectory(directory)
    })
