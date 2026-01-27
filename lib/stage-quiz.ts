import { cp, exists, mkdir } from 'fs/promises'
import { join } from 'path'
import type { StagingContext } from './stage-base'
import tui from './tui'
import { QuizRoot } from './types'
import { readYaml, writeYaml } from './utils'

export async function stageQuizFiles(
    context: StagingContext,
    language: string,
    workDirLang: string,
    stagingDirLang: string,
) {
    await tui.section('Staging quiz', async () => {
        const quiz = QuizRoot.parse(await readYaml(join(workDirLang, 'quiz.yml')))
        const dstDir = join(stagingDirLang, `quiz.pbm`)
        await mkdir(dstDir, { recursive: true })

        await writeYaml(join(dstDir, 'quiz.yml'), quiz)

        for (const question of quiz.questions) {
            {
                const src = join(workDirLang, `${question.file}.yml`)
                const dstFile = join(dstDir, `${question.file}.yml`)
                if (await exists(src)) {
                    await cp(src, dstFile)
                } else {
                    throw new Error(`Quiz question file ${question.file}.yml not found`)
                }
            }
            {
                const src = join(workDirLang, `${question.file}.py`)
                const dstFile = join(dstDir, `${question.file}.py`)
                if (await exists(src)) {
                    await cp(src, dstFile)
                }
            }
        }

        tui.success(`Staged ${tui.hyperlink(stagingDirLang, `quiz`)}`)
    })
}
