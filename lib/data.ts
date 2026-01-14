import { invert } from 'radash'

export const languageNames: Record<string, string> = {
    en: 'English',
    ca: 'Catalan',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
}

export const languageKeys = Object.keys(languageNames)

export const proglangNames: Record<string, string> = {
    c: 'C',
    cc: 'C++',
    py: 'Python3',
    hs: 'Haskell',
    clj: 'Clojure',
    java: 'Java',
    rs: 'Rust',
    v: 'Verilog',
}

export const proglangExtensions: Record<string, string> = invert(proglangNames)

export const proglangKeys = Object.keys(proglangNames)
