import { glob } from 'glob'
import { join, normalize } from 'path'
import { HandlerInfo, ProblemInfo, ProblemLangInfo, ProblemOriginalLangInfo } from './types'
import { existsInDir, nothing, readYamlInDir } from './utils'
import { YAML } from 'bun'
import tui from './tui'

const languageCodes = ['ca', 'es', 'en', 'fr', 'de']

export type ProblemType = 'std' | 'game' | 'quiz'
export type ProblemShape = 'flat' | 'tree'

export async function loadProblem(dir: string): Promise<Problem> {
    // normalize directory
    if (dir === '') {
        dir = '.'
    }
    dir = normalize(dir)
    if (!dir.endsWith('.pbm')) {
        throw new Error(`Not a problem directory: ${dir} (does not end with .pbm)`)
    }

    // detect shape and load handlerPath
    let handlerPath
    let shape: ProblemShape
    if (await existsInDir(dir, 'handler.yml')) {
        shape = 'flat'
        if (!(await existsInDir(dir, 'handler.yml'))) {
            throw new Error(`Not a problem directory: ${dir} (missing handler.yml)`)
        }
        handlerPath = join(dir, 'handler.yml')
    } else {
        const pattern = `{${languageCodes.join(',')}}/handler.yml`
        const handlers = await glob(pattern, { cwd: dir })
        if (handlers.length === 0) {
            throw new Error(`Not a problem directory: ${dir} (missing lang/handler.yml)`)
        }
        shape = 'tree'
        handlerPath = join(dir, handlers[0]!)
    }

    // load handlerInfo
    const handlerInfo = HandlerInfo.parse(readYamlInDir(dir, handlerPath))

    // detect problem type
    let type: ProblemType
    if (handlerInfo.handler === 'std' || handlerInfo.handler === 'graphic' || handlerInfo.handler === 'circuits') {
        type = 'std'
    } else if (handlerInfo.handler === 'game') {
        type = 'game'
    } else if (handlerInfo.handler === 'quiz') {
        type = 'quiz'
    } else {
        throw new Error(`Unknown problem handler: ${handlerInfo.handler as string}`)
    }

    // create problem instance
    let problem: Problem
    if (type === 'std') {
        problem = new StdProblem(dir, shape, handlerInfo)
    } else if (type === 'game') {
        problem = new GameProblem(dir, shape, handlerInfo)
    } else if (type === 'quiz') {
        problem = new QuizProblem(dir, shape, handlerInfo)
    } else {
        throw new Error(`Unhandled problem type: ${type as string}`)
    }

    await problem.load()

    return problem
}

export class Problem {
    dir: string
    shape: ProblemShape
    handlerInfo: HandlerInfo
    langs: string[] = []
    handlers: Record<string, HandlerInfo> = {} // language -> Handler
    problemInfo!: ProblemInfo // language -> problem.yml content
    problemLangInfos: Record<string, ProblemLangInfo> = {} // language -> problem.yml content
    originalLang: string = 'to-be-set'

    constructor(dir: string, shape: ProblemShape, handler: HandlerInfo) {
        this.dir = dir
        this.shape = shape
        this.handlerInfo = handler
    }

    show() {
        const data = {
            dir: this.dir,
            shape: this.shape,
            handlerInfo: this.handlerInfo,
            langs: this.langs,
            problemInfo: this.problemInfo,
            problemLangInfos: this.problemLangInfos,
            originalLang: this.originalLang,
        }
        tui.yaml(data)
    }

    async load(): Promise<void> {
        await this.loadLanguages()
        await this.loadProblemInfo()
        await this.loadProblemLangInfos()
        await this.getOriginalLanguage()
    }

    async loadLanguages(): Promise<void> {
        if (this.shape === 'tree') {
            const pattern = `{${languageCodes.join(',')}}/handler.yml`
            const files = await glob(pattern, { cwd: this.dir })
            this.langs = files.map((h) => h.split('/')[0]!).filter((v) => languageCodes.includes(v))
        } else {
            const pattern = `problem.{${languageCodes.join(',')}}.yml`
            const files = await glob(pattern, { cwd: this.dir })
            this.langs = files.map((h) => h.split('.')[1]!).filter((v) => languageCodes.includes(v))
        }
    }

    async loadProblemInfo(): Promise<void> {
        if (await existsInDir(this.dir, 'problem.yml')) {
            this.problemInfo = ProblemInfo.parse(await readYamlInDir(this.dir, 'problem.yml'))
        } else {
            this.problemInfo = ProblemInfo.parse({})
        }
    }

    async loadProblemLangInfos(): Promise<void> {
        if (this.shape === 'tree') {
            for (const lang of this.langs) {
                const path = join(lang, `problem.${lang}.yml`)
                this.problemLangInfos[lang] = ProblemLangInfo.parse(await readYamlInDir(this.dir, path))
            }
        } else {
            for (const lang of this.langs) {
                const path = `problem.${lang}.yml`
                this.problemLangInfos[lang] = ProblemLangInfo.parse(await readYamlInDir(this.dir, path))
            }
        }
    }

    async getOriginalLanguage(): Promise<void> {
        await nothing()
        let originalLang: string | null = null
        for (const lang of this.langs) {
            const langInfo = this.problemLangInfos[lang]!
            if ('author' in langInfo) {
                if (originalLang) {
                    throw new Error(`Multiple original languages found`)
                }
                originalLang = lang
            }
        }
        if (!originalLang) {
            throw new Error(`No original language found`)
        }
        this.originalLang = originalLang
    }
}

export class StdProblem extends Problem {
    constructor(dir: string, shape: ProblemShape, handlerInfo: HandlerInfo) {
        super(dir, shape, handlerInfo)
    }

    override async load(): Promise<void> {
        await super.load()
    }
}

export class GameProblem extends Problem {
    constructor(dir: string, shape: ProblemShape, handlerInfo: HandlerInfo) {
        super(dir, shape, handlerInfo)
    }

    override async load(): Promise<void> {
        await super.load()
    }
}

export class QuizProblem extends Problem {
    constructor(dir: string, shape: ProblemShape, handlerInfo: HandlerInfo) {
        super(dir, shape, handlerInfo)
    }

    override async load(): Promise<void> {
        await super.load()
    }
}

const p = await loadProblem('../../Scratch/new-problem.pbm')
p.show()
