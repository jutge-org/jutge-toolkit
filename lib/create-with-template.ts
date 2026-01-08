import tree from 'tree-node-cli'
import { confirm, select, Separator } from '@inquirer/prompts'
import { cp, exists, glob } from 'fs/promises'
import path from 'path'
import tui from './tui'
import { projectDir, readText, readTextInDir } from './utils'
import { title } from 'radash'
import { dir } from 'console'

const templatesDir = path.join(projectDir(), 'assets', 'problems')

export async function selectTemplate(directory: string): Promise<string> {
    const choices = []

    const dirs = await Array.fromAsync(glob('*', { cwd: templatesDir }))
    dirs.sort()
    for (const dir of dirs) {
        choices.push(new Separator(title(dir)))
        const templates = await Array.fromAsync(glob('*.pbm', { cwd: path.join(templatesDir, dir) }))
        templates.sort()
        for (const template of templates) {
            choices.push({ name: template, value: path.join(dir, template) })
        }
    }

    let template: string | undefined = undefined
    while (true) {
        template = await select({ message: 'Select a template to clone:', choices, default: template })

        const templatePath = path.join(templatesDir, template)
        const readme = await readTextInDir(templatePath, 'README.md')
        const treeFiles = tree(templatePath, { allFiles: true, dirsFirst: false })
        console.log()
        await tui.markdown(readme)
        console.log(treeFiles)

        const confirmation = await confirm({ message: `Clone template ${template} to ${directory}?`, default: true })
        if (confirmation) return template
    }
}

export async function createProblemWithTemplate(directory: string, template: string | undefined) {
    if (await exists(directory)) {
        throw new Error(`Directory ${directory} already exists`)
    }
    if (!directory.endsWith('.pbm')) {
        throw new Error('The output directory must end with .pbm')
    }

    if (!template) {
        template = await selectTemplate(directory)
    }

    const templatePath = path.join(templatesDir, template)

    if (!(await exists(templatePath))) {
        throw new Error(`Template ${template} does not exist`)
    }

    await cp(templatePath, directory, { recursive: true })
    tui.success(`Created problem ${tui.hyperlink(directory)} from template ${template}`)
}
