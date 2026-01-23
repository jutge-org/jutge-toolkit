import { Compiler } from './base'

export class GHC_Compiler extends Compiler {
    id(): string {
        return 'GHC'
    }

    name(): string {
        return 'GHC'
    }

    type(): string {
        return 'compiler'
    }

    language(): string {
        return 'Haskell'
    }

    async version(): Promise<string> {
        return await this.getVersion('ghc --version', 0)
    }

    flags1(): string {
        return '-O3'
    }

    flags2(): string {
        return '-O3'
    }

    tool(): string {
        return 'ghc'
    }

    extension(): string {
        return 'hs'
    }
}
