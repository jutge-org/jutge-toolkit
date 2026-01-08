import { Compiler } from './base'

export class GXX_Compiler extends Compiler {
    id(): string {
        return 'GXX'
    }

    name(): string {
        return 'GNU C++ Compiler'
    }

    type(): string {
        return 'compiler'
    }

    language(): string {
        return 'C++'
    }

    async version(): Promise<string> {
        return await this.getVersion('g++ --version', 0)
    }

    flags1(): string {
        return '-std=c++17 -D_JUDGE_ -O2 -DNDEBUG -Wall -Wextra -Wno-sign-compare -Wshadow'
    }

    flags2(): string {
        return '-std=c++17 -D_JUDGE_ -O2 -DNDEBUG -Wall -Wextra -Wno-sign-compare -Wshadow'
    }

    tool(): string {
        return 'g++'
    }

    extension(): string {
        return 'cc'
    }
}
