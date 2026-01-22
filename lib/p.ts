import { glob } from 'glob'
import { dirname, join, normalize } from 'path'
import tui from './tui'
import { HandlerInfo, ProblemInfo, ProblemLangInfo, ProblemOriginalLangInfo } from './types'
import { existsInDir, nothing, readYaml, readYamlInDir } from './utils'
import { exists } from 'fs/promises'

const languageCodes = ['ca', 'es', 'en', 'fr', 'de']

export type ProblemType = 'std' | 'game' | 'quiz'
export type ProblemShape = 'flat' | 'tree'

export async function loadProblem(dir: string): Promise<Problem> {
    // normalize directory
    if (dir === '') {
        dir = '.'
    }
    dir = normalize(dir)
    if (dir.endsWith('/')) {
        dir = dir.slice(0, -1)
    }

    // detect shape
    const endSegment = dir.split('/').pop()!
    const dotPbm = dir.endsWith('.pbm')
    const parent = normalize(join(dir, '..'))
    const dotPbmParent = parent.endsWith('.pbm')
    const handler = (await glob('handler.yml', { cwd: dir })).length != 0

    // detect shape, subdir and handlerDir
    let subdir
    let shape: ProblemShape
    let handlerDir: string
    if (dotPbm && handler) {
        shape = 'flat'
        subdir = dir
        handlerDir = dir
    } else if (dotPbm && !handler) {
        shape = 'tree'
        subdir = dir
        const handlers = await glob(`{${languageCodes.join(',')}}/handler.yml`, { cwd: dir })
        if (handlers.length === 0) {
            throw new Error(`Directory ${dir} is not a valid problem directory`)
        }
        handlerDir = join(dir, dirname(handlers[0]!))
    } else if (dotPbmParent && handler && languageCodes.includes(endSegment)) {
        shape = 'tree'
        subdir = dir
        dir = parent
        handlerDir = subdir
    } else {
        throw new Error(`Directory ${dir} is not a valid problem directory`)
    }

    // read handler.yml
    const handlerPath = join(handlerDir, 'handler.yml')
    if (!(await exists(handlerPath))) {
        throw new Error(`Could not find handler.yml in ${handlerDir}`)
    }
    const data = await readYaml(handlerPath)
    const handlerInfo = HandlerInfo.parse(data)

    // log debug info
    console.log('dir:', dir)
    console.log('subdir:', subdir)
    console.log('shape:', shape)
    console.log('handlerInfo:', handlerInfo)

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
        problem = new StdProblem(dir, subdir, shape, handlerInfo)
    } else if (type === 'game') {
        problem = new GameProblem(dir, subdir, shape, handlerInfo)
    } else if (type === 'quiz') {
        problem = new QuizProblem(dir, subdir, shape, handlerInfo)
    } else {
        throw new Error(`Unhandled problem type: ${type as string}`)
    }

    await problem.load()

    return problem
}

export class Problem {
    dir: string
    subdir: string
    shape: ProblemShape
    handlerInfo: HandlerInfo
    langs: string[] = []
    problemInfo!: ProblemInfo // language -> problem.yml content
    originalLangInfo!: ProblemOriginalLangInfo

    constructor(dir: string, subdir: string, shape: ProblemShape, handler: HandlerInfo) {
        this.dir = dir
        this.subdir = subdir
        this.shape = shape
        this.handlerInfo = handler
    }

    show() {
        const data = {
            dir: this.dir,
            subdir: this.subdir,
            shape: this.shape,
            handlerInfo: this.handlerInfo,
            langs: this.langs,
            problemInfo: this.problemInfo,
            originalLangInfo: this.originalLangInfo,
        }
        tui.yaml(data)
    }

    async load(): Promise<void> {
        await this.loadLanguages()
        await this.loadProblemInfo()
        await this.getOriginalLangInfo()
    }

    async loadLanguages(): Promise<void> {
        if (this.shape === 'flat') {
            const pattern = `problem.{${languageCodes.join(',')}}.yml`
            const files = await glob(pattern, { cwd: this.dir })
            this.langs = files.map((h) => h.split('.')[1]!).filter((v) => languageCodes.includes(v))
        } else {
            const pattern = `{${languageCodes.join(',')}}/handler.yml`
            const files = await glob(pattern, { cwd: this.dir })
            this.langs = files.map((h) => h.split('/')[0]!).filter((v) => languageCodes.includes(v))
        }
    }

    async loadProblemInfo(): Promise<void> {
        if (await existsInDir(this.dir, 'problem.yml')) {
            this.problemInfo = ProblemInfo.parse(await readYamlInDir(this.dir, 'problem.yml'))
        } else {
            this.problemInfo = ProblemInfo.parse({})
        }
    }

    async getOriginalLangInfo(): Promise<void> {
        const langs: ProblemLangInfo[] = []
        if (this.shape === 'flat') {
            for (const lang of this.langs) {
                const path = `problem.${lang}.yml`
                langs.push(ProblemLangInfo.parse(await readYamlInDir(this.dir, path)))
            }
        } else {
            for (const lang of this.langs) {
                const path = join(lang, `problem.${lang}.yml`)
                langs.push(ProblemLangInfo.parse(await readYamlInDir(this.dir, path)))
            }
        }

        for (const lang of langs) {
            if ('author' in lang) {
                if (this.originalLangInfo) {
                    throw new Error(`Multiple original languages found`)
                }
                this.originalLangInfo = lang
            }
        }
        if (!this.originalLangInfo) {
            throw new Error(`No original language found`)
        }
    }
}

export class StdProblem extends Problem {
    constructor(dir: string, subdir: string, shape: ProblemShape, handlerInfo: HandlerInfo) {
        super(dir, subdir, shape, handlerInfo)
    }

    override async load(): Promise<void> {
        await super.load()
    }
}

export class GameProblem extends Problem {
    constructor(dir: string, subdir: string, shape: ProblemShape, handlerInfo: HandlerInfo) {
        super(dir, subdir, shape, handlerInfo)
    }

    override async load(): Promise<void> {
        await super.load()
    }
}

export class QuizProblem extends Problem {
    constructor(dir: string, subdir: string, shape: ProblemShape, handlerInfo: HandlerInfo) {
        super(dir, subdir, shape, handlerInfo)
    }

    override async load(): Promise<void> {
        await super.load()
    }
}

const p = await loadProblem(process.argv[2] || '.')
p.show()
