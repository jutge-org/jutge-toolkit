import { Compiler } from './base'

export class Rust_Compiler extends Compiler {
    id(): string {
        return 'Rust'
    }

    name(): string {
        return 'Rust Compiler'
    }

    type(): string {
        return 'compiler'
    }

    language(): string {
        return 'Rust'
    }

    async version(): Promise<string> {
        return await this.getVersion('rustc --version', 0)
    }

    flags1(): string {
        return '-C opt-level=2 -D warnings'
    }

    flags2(): string {
        return '-C opt-level=2 -D warnings'
    }

    tool(): string {
        return 'rustc'
    }

    extension(): string {
        return 'rs'
    }
}
