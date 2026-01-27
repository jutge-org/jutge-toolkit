import { mkdir } from 'fs/promises'
import { join } from 'path'
import tree from 'tree-node-cli'
import type { AbstractProblem } from './new-problem'
import {
    createWorkspace,
    readMetadata,
    separateByLanguages,
    stageAwards,
    stageFirstToSolve,
    stageInformationYml,
    stageReadMd,
    stageStatements,
    type StagingContext,
} from './stage-base'
import { prepareStatements_Game, stageProblemFiles_Game, stageViewer, stageZip_Game } from './stage-game'
import { stageQuizFiles } from './stage-quiz'
import { computeCodeMetrics, prepareStatements_Std, stageProblemFiles_Std, stageZip_Std } from './stage-std'
import tui from './tui'
import { nanoid8, readText, toolkitPrefix } from './utils'

export async function stage(aproblem: AbstractProblem, problem_nm: string) {
    const directory = aproblem.dir
    const workspace = join(directory, toolkitPrefix() + '-stage', nanoid8())
    const workDir = join(workspace, 'work')
    const stagingDir = join(workspace, 'stage', problem_nm)

    await tui.section(`Staging problem at ${directory}`, async () => {
        await createWorkspace(workspace, workDir, stagingDir)
        const languages = await separateByLanguages(directory, workDir)
        const metadata = await readMetadata(languages, workDir, directory)

        const context: StagingContext = {
            directory,
            problem_nm,
            workspace,
            workDir,
            stagingDir,
            languages,
            original_language: metadata.original_language,
            problem_ymls: metadata.problem_ymls,
            handlers: metadata.handlers,
            author: metadata.author,
            author_email: metadata.author_email,
        }

        // Determine problem type from handler
        const originalHandler = metadata.handlers[metadata.original_language]
        const problem_type =
            originalHandler.handler === 'game' ? 'game' : originalHandler.handler === 'quiz' ? 'quiz' : 'std'
        tui.success(`Problem type: ${problem_type}`)

        for (const language of languages) {
            await tui.section(`Staging language ${language}`, async () => {
                const workDirLang = join(workDir, language)
                const problem_id = `${problem_nm}_${language}`
                const stagingDirLang = join(stagingDir, language)
                await mkdir(stagingDirLang, { recursive: true })

                // Delegate to type-specific staging functions
                if (problem_type === 'std') {
                    await prepareStatements_Std(context, language, workDirLang)
                    await computeCodeMetrics(context, language, workDirLang, stagingDirLang, directory)
                    await stageProblemFiles_Std(context, language, workDirLang, stagingDirLang, problem_id)
                    await stageAwards(context, language, workDirLang, stagingDir)
                    await stageStatements(context, language, workDirLang, stagingDirLang)
                    await stageZip_Std(context, language, workDirLang, stagingDirLang, problem_id)
                } else if (problem_type === 'game') {
                    await prepareStatements_Game(context, language, workDirLang)
                    await stageProblemFiles_Game(context, language, workDirLang, stagingDirLang)
                    await stageAwards(context, language, workDirLang, stagingDir)
                    await stageStatements(context, language, workDirLang, stagingDirLang)
                    await stageZip_Game(context, language, workDirLang, stagingDirLang, problem_id)
                    await stageViewer(context, language, workDirLang, stagingDirLang)
                } else if (problem_type === 'quiz') {
                    await stageQuizFiles(context, language, workDirLang, stagingDirLang)
                }
            })
        }
        await stageFirstToSolve(problem_nm, stagingDir)
        await stageInformationYml(context, stagingDir)
        await stageReadMd(context, stagingDir, problem_type)
    })

    await tui.section(`Summary`, async () => {
        const readme = join(stagingDir, 'README.md')
        tui.success('README.md content:')
        await tui.markdown(await readText(readme))
        tui.success('Staging tree:')
        tui.print(tree(stagingDir))
    })
    tui.success(`Problem successfully staged at directory ${tui.hyperlink(stagingDir)}`)
}
