import { z } from 'zod'

export const ProblemOriginalLangYml = z.object({
    title: z.string(),
    author: z.string(),
    email: z.string(),
})

export const ProblemTranslationLangYml = z.object({
    title: z.string(),
    translator: z.string(),
    translator_email: z.string(),
})

export const ProblemLangYml = z.union([ProblemOriginalLangYml, ProblemTranslationLangYml])

export const Handler = z.object({
    handler: z.enum(['std', 'graphic', 'quiz', 'circuits', 'game']).default('std'),
    solution: z.string().default('C++'),
    source_modifier: z.enum(['none', 'no_main', 'structs']).default('none'),
    compilers: z.string().optional(),
    game: z
        .object({
            hide: z.array(z.string()).default([]),
        })
        .optional(),
})

export type Handler = z.infer<typeof Handler>

// scores.yml file

export const Scores = z.array(
    z.object({
        part: z.string(),
        prefix: z.string(),
        points: z.number().min(0),
    }),
)

export type Scores = z.infer<typeof Scores>

// problem.yml file

export const ProblemInfo = z.object({
    problem_nm: z.string().default(''),
    email: z.string().default(''),
    passcode: z.string().default(''),
    shared_testcases: z.boolean().default(false),
    shared_solutions: z.boolean().default(false),
    created_at: z.string().default(''),
    updated_at: z.string().default(''),
})

export type ProblemInfo = z.infer<typeof ProblemInfo>

// settings.yml file

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

// quizzes

export const QuizRootQuestion = z.object({
    title: z.string().nonempty(),
    file: z.string().nonempty(),
    score: z.int().min(0).max(100),
})

export type QuizRootQuestion = z.infer<typeof QuizRootQuestion>

/*
partial_answer means “use partial credit” for that question: proportional score and “correct” when at least one part is right. When it’s false, the question is all-or-nothing (full credit only when everything is correct). 
*/

export const QuizRoot = z
    .object({
        title: z.string().default('Untitled Quiz'),
        statement: z.string(),
        questions: z.array(QuizRootQuestion),
        shuffle: z.coerce.boolean().default(false),
    })
    .refine(
        // make sure the scores sum to 100
        (data) => data.questions.reduce((sum, q) => sum + q.score, 0) === 100,
        { message: 'Question scores must sum to 100', path: ['questions'] },
    )

export type QuizRoot = z.infer<typeof QuizRoot>

export const QuizFillInItem = z.object({
    maxlength: z.int().default(100),
    placeholder: z.coerce.string().optional(),
    correct: z.coerce.string(),
    ignorecase: z.boolean().default(true),
    trim: z.boolean().default(true),
    options: z.array(z.coerce.string().nonempty()).optional(),
    partial_answer: z.coerce.boolean().default(false),
})

export type QuizFillInItem = z.infer<typeof QuizFillInItem>

export const QuizzFillIn = z
    .object({
        type: z.literal('FillIn'),
        hide_score: z.coerce.boolean().default(false),
        text: z.coerce.string(),
        context: z.coerce.string(),
        items: z.record(z.coerce.string().nonempty(), QuizFillInItem),
        partial_answer: z.coerce.boolean().default(false),
    })
    .refine(
        // make sure that for dropdown items, the correct answer is in the options list
        (data) => {
            for (const item of Object.values(data.items)) {
                if (item.options !== undefined && item.options.length > 0) {
                    if (!item.options.includes(item.correct)) return false
                }
            }
            return true
        },
        { message: 'For dropdown items, the correct answer must be in the options list', path: ['items'] },
    )

export type QuizzFillIn = z.infer<typeof QuizzFillIn>

export const QuizzOrdering = z.object({
    type: z.literal('Ordering'),
    hide_score: z.coerce.boolean().default(false),
    text: z.coerce.string(),
    label: z.string().nonempty(),
    items: z.array(z.coerce.string().nonempty()),
    shuffle: z.coerce.boolean().default(true),
    partial_answer: z.coerce.boolean().default(false),
})

export type QuizzOrdering = z.infer<typeof QuizzOrdering>

export const QuizzMatching = z.object({
    type: z.literal('Matching'),
    hide_score: z.coerce.boolean().default(false),
    text: z.coerce.string(),
    labels: z.array(z.string().nonempty()),
    left: z.array(z.coerce.string().nonempty()),
    right: z.array(z.coerce.string().nonempty()),
    shuffle: z.coerce.boolean().default(true),
    partial_answer: z.coerce.boolean().default(false),
})

export type QuizzMatching = z.infer<typeof QuizzMatching>

export const QuizzSingleChoice = z
    .object({
        type: z.literal('SingleChoice'),
        hide_score: z.coerce.boolean().default(false),
        text: z.coerce.string(),
        choices: z.array(
            z.object({
                text: z.coerce.string(),
                correct: z.boolean().optional().default(false),
                hint: z.string().optional(),
            }),
        ),
        shuffle: z.coerce.boolean().default(true),
        partial_answer: z.coerce.boolean().default(false),
    })
    .refine(
        // make sure that at most one correct answer is provided
        (data) => data.choices.filter((c) => c.correct).length === 1,
        { message: 'SingleChoice questions must have exactly one correct answer', path: ['choices'] },
    )
    .refine(
        // make sure there are no repeated text choices
        (data) =>
            data.choices.map((c) => c.text).filter((t, index, self) => self.indexOf(t) === index).length ===
            data.choices.length,
        { message: 'SingleChoice questions must have no repeated text choices', path: ['choices'] },
    )

export type QuizzSingleChoice = z.infer<typeof QuizzSingleChoice>

export const QuizzMultipleChoice = z.object({
    type: z.literal('MultipleChoice'),
    hide_score: z.coerce.boolean().default(false),
    text: z.coerce.string(),
    choices: z.array(
        z.object({
            text: z.coerce.string(),
            correct: z.boolean().optional().default(false),
            hint: z.string().optional(),
        }),
    ),
    shuffle: z.coerce.boolean().default(true),
    partial_answer: z.coerce.boolean().default(false),
})

export type QuizzMultipleChoice = z.infer<typeof QuizzMultipleChoice>

export const QuizzOpenQuestion = z.object({
    type: z.literal('OpenQuestion'),
    hide_score: z.coerce.boolean().default(false),
    text: z.coerce.string(),
    placeholder: z.coerce.string().default(''),
    partial_answer: z.coerce.boolean().default(false),
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

// type of the credentials.json file of jutge-cli

export const Credential = z.object({
    email: z.string(),
    user_uid: z.string(),
    token: z.string().optional(),
    expiration: z.iso.datetime().optional(),
    savedPassword: z.string().optional(),
    active: z.boolean().optional(),
})

export type Credential = z.infer<typeof Credential>

export const Credentials = z.record(z.string(), Credential)

export type Credentials = z.infer<typeof Credentials>
