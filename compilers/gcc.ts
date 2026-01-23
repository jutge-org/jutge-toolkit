import { Compiler } from './base'

export class GCC_Compiler extends Compiler {
    id(): string {
        return 'GCC'
    }

    name(): string {
        return 'GNU C Compiler'
    }

    type(): string {
        return 'compiler'
    }

    language(): string {
        return 'C'
    }

    async version(): Promise<string> {
        return await this.getVersion('gcc --version', 0)
    }

    flags1(): string {
        return '-D_JUDGE_ -O2 -DNDEBUG -Wall -Wextra -Wno-sign-compare'
    }

    flags2(): string {
        return ''
    }

    tool(): string {
        return 'gcc'
    }

    extension(): string {
        return 'c'
    }
}
