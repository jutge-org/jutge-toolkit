import { z } from 'zod'

export const StatementInfoOriginal = z.object({
    title: z.string(),
    author: z.string(),
    email: z.string(),
})

export const StatementInfoTranslation = z.object({
    title: z.string(),
    translator: z.string(),
    translator_email: z.string(),
})

export const StatementInfo = z.union([StatementInfoOriginal, StatementInfoTranslation])

export type StatementInfoOriginal = z.infer<typeof StatementInfoOriginal>
export type StatementInfoTranslation = z.infer<typeof StatementInfoTranslation>
export type StatementInfo = z.infer<typeof StatementInfo>

export const HandlerInfo = z.object({
    handler: z.enum(['std', 'graphic', 'quiz', 'circuits', 'game']).default('std'),
    solution: z.string().optional(),
    source_modifier: z.enum(['none', 'no_main', 'structs']).optional(),
    compilers: z.string().optional(),
    game: z
        .object({
            hide: z.array(z.string()).default([]),
        })
        .optional(),
})

export type HandlerInfo = z.infer<typeof HandlerInfo>

export const Scores = z.array(
    z.object({
        part: z.string(),
        prefix: z.string(),
        points: z.number().min(0),
    }),
)

export type Scores = z.infer<typeof Scores>

export const Specification = z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Unknown'),
    email: z.string().default('unknown'),
    golden_proglang: z.string(),
    more_proglangs: z.array(z.string()),
    original_language: z.string(),
    more_languages: z.array(z.string()),
    generators: z.array(z.string()),
})

export type Specification = z.infer<typeof Specification>

export const ProblemInfo = z.object({
    problem_nm: z.string().default(''),
    email: z.string().default(''),
    passcode: z.string().default(''),
    created_at: z.string().default(''),
    updated_at: z.string().default(''),
})

export type ProblemInfo = z.infer<typeof ProblemInfo>

export const Settings = z.object({
    name: z.string().min(1).default('John Doe'),
    email: z.string().email().default('john.doe@example.com'),
    defaultModel: z.string().default('google/gemini-2.5-flash-lite'),
    notifications: z.boolean().default(false),
    showPrompts: z.boolean().default(false),
    showAnswers: z.boolean().default(false),
    developer: z.boolean().default(false),
})

export type Settings = z.infer<typeof Settings>

export const QuizRootQuestion = z.object({
    title: z.string().nonempty(),
    file: z.string().nonempty(),
    score: z.int().min(0),
})

export type QuizRootQuestion = z.infer<typeof QuizRootQuestion>

export const QuizRoot = z.object({
    title: z.string().default('Untitled Quiz'),
    statement: z.string(),
    shuffle: z.boolean().default(false),
    questions: z.array(QuizRootQuestion),
})

export type QuizRoot = z.infer<typeof QuizRoot>

export const QuizzFillIn = z.object({
    type: z.literal('FillIn'),
    text: z.string(),
    context: z.string(),
    items: z.record(
        z.string().nonempty(),
        z.object({
            maxlength: z.int(),
            placeholder: z.string().optional(),
            correct: z.union([z.string(), z.number()]),
            ignorecase: z.boolean().default(false),
            trim: z.boolean().default(true),
        }),
    ),
})

export type QuizzFillIn = z.infer<typeof QuizzFillIn>

export const QuizzOrdering = z.object({
    type: z.literal('Ordering'),
    text: z.string(),
    label: z.string().nonempty(),
    items: z.array(z.string().nonempty()),
    nota: z.string().optional(),
})

export type QuizzOrdering = z.infer<typeof QuizzOrdering>

export const QuizzMatching = z.object({
    type: z.literal('Matching'),
    text: z.string(),
    labels: z.array(z.string().nonempty()),
    left: z.array(z.string().nonempty()),
    right: z.array(z.string().nonempty()),
})

export type QuizzMatching = z.infer<typeof QuizzMatching>

export const QuizzSingleChoice = z.object({
    type: z.literal('SingleChoice'),
    text: z.string(),
    choices: z.array(
        z.object({
            text: z.string(),
            correct: z.boolean().optional().default(false),
            hint: z.string().optional(),
        }),
    ),
})

export type QuizzSingleChoice = z.infer<typeof QuizzSingleChoice>

export const QuizzMultipleChoice = z.object({
    type: z.literal('MultipleChoice'),
    text: z.string(),
    choices: z.array(
        z.object({
            text: z.string(),
            correct: z.boolean().optional().default(false),
            hint: z.string().optional(),
        }),
    ),
})

export type QuizzMultipleChoice = z.infer<typeof QuizzMultipleChoice>

export const QuizzOpenQuestion = z.object({
    type: z.literal('OpenQuestion'),
    text: z.string(),
    placeholder: z.string().default(''),
})

export type QuizzOpenQuestion = z.infer<typeof QuizzOpenQuestion>

export const QuizzQuestion = z.discriminatedUnion('type', [
    QuizzFillIn,
    QuizzOrdering,
    QuizzMatching,
    QuizzSingleChoice,
    QuizzMultipleChoice,
    QuizzOpenQuestion,
])

export type QuizzQuestion = z.infer<typeof QuizzQuestion>

function getDefinedCompilerIds(): string[] {
    return [
        'BEEF',
        'Chicken',
        'Circuits',
        'Clang',
        'Clang++17',
        'CLISP',
        'Clojure',
        'Codon',
        'Crystal',
        'Erlang',
        'F2C',
        'FBC',
        'FPC',
        'G++',
        'G++11',
        'G++17',
        'GCC',
        'GCJ',
        'GDC',
        'GFortran',
        'GHC',
        'GNAT',
        'Go',
        'GObjC',
        'GPC',
        'Guile',
        'IVL08',
        'JDK',
        'Julia',
        'Kotlin',
        'Lua',
        'MakePRO2',
        'MonoCS',
        'MyPy',
        'Nim',
        'nodejs',
        'P1++',
        'P2C',
        'Perl',
        'PHP',
        'PRO2',
        'Python',
        'Python3',
        'Quiz',
        'R',
        'Ruby',
        'RunClojure',
        'RunHaskell',
        'RunPython',
        'Rust',
        'Stalin',
        'WS',
        'Zig',
    ]
}
