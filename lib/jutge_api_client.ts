/**
 * This file has been automatically generated at 2026-03-11T16:58:18.945Z
 *
 * Name:    Jutge API
 * Version: 2.0.0
 *
 * Description: Jutge API
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Models

export type CredentialsIn = {
    email: string
    password: string
}

export type ExamCredentialsIn = {
    email: string
    password: string
    exam: string
    exam_password: string
}

export type CredentialsOut = {
    token: string
    expiration: string | string | string | number
    user_uid: string
    error: string
}

export type CredentialsWithUsernameIn = {
    username: string
    password: string
}

export type Time = {
    full_time: string
    int_timestamp: number
    float_timestamp: number
    time: string
    date: string
}

export type HomepageStats = {
    users: number
    problems: number
    submissions: number
    exams: number
    contests: number
}

export type ColorMapping = Record<string, Record<string, string>>

export type ApiVersion = {
    version: string
    mode: string
    gitHash: string
    gitBranch: string
    gitDate: string
}

export type RequestInformation = {
    url: string
    ip: string
    domain: string
}

export type Language = {
    language_id: string
    eng_name: string
    own_name: string
}

export type Country = {
    country_id: string
    eng_name: string
}

export type Compiler = {
    compiler_id: string
    name: string
    language: string
    extension: string
    description: string | null
    version: string | null
    flags1: string | null
    flags2: string | null
    type: string | null
    warning: string | null
    status: string | null
    notes: string | null
}

export type Driver = {
    driver_id: string
}

export type Verdict = {
    verdict_id: string
    name: string
    description: string
    emoji: string
}

export type Proglang = {
    proglang_id: string
}

export type AllTables = {
    languages: Record<string, Language>
    countries: Record<string, Country>
    compilers: Record<string, Compiler>
    drivers: Record<string, Driver>
    verdicts: Record<string, Verdict>
    proglangs: Record<string, Proglang>
}

export type ProblemSummary = {
    summary_1s: string
    summary_1p: string
    keywords: string
    model: string
    duration: number
}

export type SolutionTags = {
    tags: string
    model: string
    duration: number
}

export type BriefAbstractProblem = {
    problem_nm: string
    author: string | null
    author_email: string | null
    public: number | null
    official: number | null
    compilers: string | null
    driver_id: string | null
    type: string | null
    deprecation: string | null
    created_at: string | string | string | number
    updated_at: string | string | string | number
    solution_tags: SolutionTags | null
}

export type BriefProblem = {
    problem_id: string
    problem_nm: string
    language_id: string
    title: string
    original_language_id: string
    translator: string | null
    translator_email: string | null
    checked: number | null
    summary: ProblemSummary | null
}

export type BriefProblemDict = Record<string, BriefProblem>

export type AbstractProblem = {
    problem_nm: string
    author: string | null
    author_email: string | null
    public: number | null
    official: number | null
    compilers: string | null
    driver_id: string | null
    type: string | null
    deprecation: string | null
    created_at: string | string | string | number
    updated_at: string | string | string | number
    solution_tags: SolutionTags | null
    problems: BriefProblemDict
}

export type AbstractProblemSuppl = {
    compilers_with_ac: string[]
    proglangs_with_ac: string[]
}

export type ProblemSuppl = {
    compilers_with_ac: string[]
    proglangs_with_ac: string[]
    official_solution_checks: Record<string, boolean>
    handler: any
}

export type Problem = {
    problem_id: string
    problem_nm: string
    language_id: string
    title: string
    original_language_id: string
    translator: string | null
    translator_email: string | null
    checked: number | null
    summary: ProblemSummary | null
    abstract_problem: BriefAbstractProblem
}

export type Testcase = {
    name: string
    input_b64: string
    correct_b64: string
}

export type ProblemRich = {
    problem_id: string
    problem_nm: string
    language_id: string
    title: string
    original_language_id: string
    translator: string | null
    translator_email: string | null
    checked: number | null
    summary: ProblemSummary | null
    abstract_problem: BriefAbstractProblem
    sample_testcases: Testcase[]
    html_statement: string
}

export type SearchResult = {
    problem_nm: string
    score: number
}

export type SearchResults = SearchResult[]

export type AllKeys = {
    problems: string[]
    enrolled_courses: string[]
    available_courses: string[]
    lists: string[]
}

export type Profile = {
    user_uid: string
    email: string
    name: string
    username: string | null
    nickname: string | null
    webpage: string | null
    description: string | null
    affiliation: string | null
    birth_year: number | null
    max_subsxhour: number
    max_subsxday: number
    administrator: number
    instructor: number
    parent_email: string | null
    country_id: string | null
    timezone_id: string
    compiler_id: string | null
    language_id: string | null
}

export type NewProfile = {
    name: string
    birth_year: number
    nickname: string
    webpage: string
    affiliation: string
    description: string
    country_id: string
    timezone_id: string
}

export type NewPassword = {
    oldPassword: string
    newPassword: string
}

export type DateValue = {
    date: number
    value: number
}

export type HeatmapCalendar = DateValue[]

export type Distribution = Record<string, number>

export type AllDistributions = {
    verdicts: Distribution
    compilers: Distribution
    proglangs: Distribution
    submissions_by_hour: Distribution
    submissions_by_weekday: Distribution
}

export type Dashboard = {
    stats: Distribution
    heatmap: HeatmapCalendar
    distributions: AllDistributions
}

export type Submission = {
    problem_id: string
    submission_id: string
    compiler_id: string
    annotation: string | null
    state: string
    time_in: string | string | string | number
    veredict: string | null
    veredict_info: string | null
    veredict_publics: string | null
    ok_publics_but_wrong: number
}

export type NewSubmissionIn = {
    problem_id: string
    compiler_id: string
    annotation: string
}

export type NewSubmissionOut = {
    submission_id: string
}

export type SubmissionAnalysis = {
    testcase: string
    execution: string
    verdict: string
}

export type TestcaseAnalysis = {
    testcase: string
    execution: string
    verdict: string
    input_b64: string
    output_b64: string
    expected_b64: string
}

export type GetGameResultIn = {
    problem_id: string
    submission_id: string
}

export type MatchSchema = {
    seed: number
    status: number[]
    players: string[]
    scores: number[]
}

export type ProblemSchema = {
    author: string
    description: string
    email: string
    gamename: string
    title: string
    version: number
}

export type SubmissionSchema = {
    compiler_id: string
    description: string
    email: string
    problem_id: string
}

export type GetGameResultOut = {
    games: MatchSchema[]
    problem: ProblemSchema
    submission: SubmissionSchema
}

export type GetGameOutputIn = {
    problem_id: string
    submission_id: string
    game_id: number
}

export type PublicProfile = {
    email: string
    name: string
    username: string | null
}

export type BriefCourse = {
    course_nm: string
    title: string | null
    description: string | null
    annotation: string | null
    public: number
    official: number
}

export type Course = {
    course_nm: string
    title: string | null
    description: string | null
    annotation: string | null
    public: number
    official: number
    owner: PublicProfile
    lists: string[]
}

export type ListItem = {
    problem_nm: string | null
    description: string | null
}

export type BriefList = {
    list_nm: string
    title: string | null
    description: string | null
    annotation: string | null
    public: number
    official: number
}

export type List = {
    list_nm: string
    title: string | null
    description: string | null
    annotation: string | null
    public: number
    official: number
    items: ListItem[]
    owner: PublicProfile
}

export type ReadyExam = {
    exam_key: string
    title: string
    place: string
    description: string
    exp_time_start: string | string | string | number
    running_time: number
    contest: boolean
}

export type RunningExamProblem = {
    problem_nm: string
    icon: string | null
    caption: string | null
    weight: number | null
}

export type RunningExamDocument = {
    document_nm: string
    title: string
    description: string
}

export type RunningExam = {
    title: string
    description: string
    instructions: string
    time_start: string | string | string | number | null
    exp_time_start: string | string | string | number
    running_time: number
    contest: number
    problems: RunningExamProblem[]
    compilers: string[]
    documents: RunningExamDocument[]
}

export type AbstractStatus = {
    problem_nm: string
    nb_submissions: number
    nb_pending_submissions: number
    nb_accepted_submissions: number
    nb_rejected_submissions: number
    nb_scored_submissions: number
    status: string
}

export type Status = {
    problem_id: string
    problem_nm: string
    nb_submissions: number
    nb_pending_submissions: number
    nb_accepted_submissions: number
    nb_rejected_submissions: number
    nb_scored_submissions: number
    status: string
}

export type Award = {
    award_id: string
    time: string | string | string | number
    type: string
    icon: string
    title: string
    info: string
    youtube: string | null
    submission: Submission | null
}

export type BriefAward = {
    award_id: string
    time: string | string | string | number
    type: string
    icon: string
    title: string
    info: string
    youtube: string | null
}

export type TakeQuizIn = {
    problem_id: string
}

export type TakeQuizOut = {
    submission_id: string
    exam_submission_id: string | null
}

export type SubmitQuizIn = {
    problem_id: string
    submission_id: string
    answers: any
}

export type SubmitQuizOut = null

export type GetQuizDataIn = GetGameResultIn

export type GetQuizDataOut = {
    questions: any
    answers: any
    feedback: any
}

export type Document = {
    document_nm: string
    title: string
    description: string
    created_at: string | string | string | number
    updated_at: string | string | string | number
}

export type DocumentCreation = {
    document_nm: string
    title: string
    description: string
}

export type DocumentUpdate = DocumentCreation

export type InstructorBriefList = {
    list_nm: string
    title: string
    description: string
    annotation: string
    official: number
    public: number
    created_at: string | string | string | number
    updated_at: string | string | string | number
}

export type InstructorListItem = {
    problem_nm: string | null
    description: string | null
}

export type InstructorListItems = InstructorListItem[]

export type InstructorList = {
    list_nm: string
    title: string
    description: string
    annotation: string
    official: number
    public: number
    created_at: string | string | string | number
    updated_at: string | string | string | number
    items: InstructorListItems
}

export type InstructorListCreation = {
    list_nm: string
    title: string
    description: string
    annotation: string
    official: number
    public: number
    items: InstructorListItems
}

export type InstructorListUpdate = InstructorListCreation

export type InstructorBriefCourse = {
    course_nm: string
    title: string
    description: string
    annotation: string
    official: number
    public: number
    created_at: string | string | string | number
    updated_at: string | string | string | number
}

export type CourseMembers = {
    invited: string[]
    enrolled: string[]
    pending: string[]
}

export type InstructorCourse = {
    course_nm: string
    title: string
    description: string
    annotation: string
    official: number
    public: number
    created_at: string | string | string | number
    updated_at: string | string | string | number
    lists: string[]
    students: CourseMembers
    tutors: CourseMembers
}

export type StudentProfile = {
    name: string
    email: string
}

export type InstructorCourseCreation = {
    course_nm: string
    title: string
    description: string
    annotation: string
    official: number
    public: number
    lists: string[] | null
    students: CourseMembers | null
    tutors: CourseMembers | null
}

export type InstructorCourseUpdate = {
    course_nm: string
    title: string | null
    description: string | null
    annotation: string | null
    official: number | null
    public: number | null
    lists: string[] | null
    students: CourseMembers | null
    tutors: CourseMembers | null
}

export type InstructorExamCourse = {
    course_nm: string
    title: string
}

export type InstructorExamDocument = RunningExamDocument

export type InstructorExamCompiler = {
    compiler_id: string
    name: string
}

export type InstructorExamProblem = {
    problem_nm: string
    weight: number | null
    icon: string | null
    caption: string | null
}

export type InstructorExamStudent = {
    email: string
    name: string | null
    code: string | null
    restricted: number
    annotation: string | null
    result: string | null
    finished: number
    banned: number
    reason_ban: string | null
    inc: number | null
    reason_inc: string | null
    taken_exam: number
    emergency_password: string | null
    invited: number
}

export type InstructorExamCreation = {
    exam_nm: string
    course_nm: string
    title: string
    exp_time_start: string | string | string | number
}

export type InstructorExamUpdate = {
    exam_nm: string
    course_nm: string
    title: string
    place: string
    code: string
    description: string
    time_start: string | string | string | number | null
    exp_time_start: string | string | string | number
    running_time: number
    visible_submissions: number
    started_by: string | null
    contest: number
    instructions: string
    avatars: string | null
    anonymous: number
}

export type InstructorNewExamStudent = {
    email: string
    invited: number
    restricted: number
    code: string
    emergency_password: string
    annotation: string
}

export type InstructorExamSubmissionsOptions = {
    problems: string
    include_source: boolean
    include_pdf: boolean
    include_metadata: boolean
    only_last: boolean
    font_size: number
    layout: string
    obscure_private_testcases_names: boolean
}

export type Pack = {
    message: string
    href: string
}

export type InstructorBriefExam = {
    exam_nm: string
    title: string
    place: string | null
    description: string | null
    code: string | null
    time_start: string | string | string | number | null
    exp_time_start: string | string | string | number
    running_time: number
    visible_submissions: number
    started_by: string | null
    contest: number
    instructions: string | null
    avatars: string | null
    anonymous: number
    course: InstructorExamCourse
    created_at: string | string | string | number
    updated_at: string | string | string | number
}

export type InstructorExam = {
    exam_nm: string
    title: string
    place: string | null
    description: string | null
    code: string | null
    time_start: string | string | string | number | null
    exp_time_start: string | string | string | number
    running_time: number
    visible_submissions: number
    started_by: string | null
    contest: number
    instructions: string | null
    avatars: string | null
    anonymous: number
    course: InstructorExamCourse
    created_at: string | string | string | number
    updated_at: string | string | string | number
    documents: RunningExamDocument[]
    compilers: InstructorExamCompiler[]
    problems: InstructorExamProblem[]
    students: InstructorExamStudent[]
}

export type ExamStatisticsEntry = {
    minute: number
    ok: number
    ko: number
}

export type ExamStatistics = {
    submissions: Record<string, Record<string, number>>
    statuses: Record<string, Record<string, number>>
    timeline: ExamStatisticsEntry[]
    compilers: Record<string, Record<string, number>>
    proglangs: Record<string, Record<string, number>>
}

export type RankingResult = {
    problem_nm: string
    submissions: number
    verdict: string | null
    score: number
    time: number
    penalty: number
    wrongs: number
}

export type RankingRow = {
    position: number | null
    name: string
    avatar: string | null
    score: number
    time: number
    invited: boolean
    submissions: number
    rankingResults: RankingResult[]
}

export type Ranking = RankingRow[]

export type WebStream = {
    title: string
    id: string
}

export type ProblemGenerationInfo = {
    title: string
    prompt: string
    model: string
}

export type Deprecation = {
    problem_nm: string
    reason: string | null
}

export type SharingSettings = {
    problem_nm: string
    passcode: string | null
    shared_testcases: boolean
    shared_solutions: boolean
}

export type ProblemAnonymousSubmission = {
    time: string
    anonymous_user_id: string
    problem_id: string
    verdict: string
    compiler_id: string
    proglang: string
}

export type SubmissionQuery = {
    email: string
    problem_nm: string
    problem_id: string
    time: string | string | string | number
    ip: string
    verdict: string
}

export type SubmissionsQuery = SubmissionQuery[]

export type TagsDict = Record<string, string[]>

export type ChatMessage = {
    role: string
    content: string
}

export type ChatPrompt = {
    model: string
    label: string
    messages: ChatMessage[]
    addUsage: boolean
}

export type LlmUsageEntry = {
    id: string
    created_at: string | string | string | number
    model: string
    label: string
    duration: number
    input_tokens: number
    output_tokens: number
    finish_reason: string
}

export type CreateImageInput = {
    model: string
    label: string
    prompt: string
    size: string
}

export type SubmitPlayerInput = {
    problem_id: string
    annotation: string
    source_code: string
    callback_url: string
}

export type SubmitPlayerOutput = NewSubmissionOut

export type SubmitMatchInput = {
    problem_id: string
    annotation: string
    source_codes: string[]
    callback_url: string
}

export type SubmitMatchOutput = NewSubmissionOut

export type GetGameResultOutput = {
    todo: string
}

export type GetMatchSubmissionInput = GetGameResultIn

export type GetMatchSubmissionOutput = GetGameResultOutput

export type InstructorEntry = {
    username: string
    name: string
    email: string
}

export type InstructorEntries = InstructorEntry[]

export type UserCreation = {
    email: string
    name: string
    username: string
    password: string
    administrator: number
    instructor: number
}

export type UserEmailAndName = {
    email: string
    name: string
}

export type UsersEmailsAndNames = UserEmailAndName[]

export type ProfileForAdmin = {
    user_id: string
    user_uid: string
    email: string
    name: string
    username: string | null
    nickname: string | null
    webpage: string | null
    description: string | null
    affiliation: string | null
    birth_year: number | null
    max_subsxhour: number
    max_subsxday: number
    administrator: number
    instructor: number
    parent_email: string | null
    country_id: string | null
    timezone_id: string
    compiler_id: string | null
    language_id: string | null
    locked: number
    banned: number
    nb_bans: number
    reason: string | null
    creation_date: string | string | string | number
}

export type DatabasesInfoItem = {
    name: string
    size: number
    mtime: string | string | string | number
}

export type DatabasesInfo = DatabasesInfoItem[]

export type FreeDiskSpaceItem = {
    disk: string
    filesystem: string
    size: string
    used: string
    available: string
    use: string
    mounted: string
}

export type NullableFreeDiskSpaceItem = FreeDiskSpaceItem | null

export type FreeDiskSpace = Record<string, NullableFreeDiskSpaceItem>

export type RecentConnectedUsers = {
    latest_hour: number
    latest_day: number
    latest_week: number
    latest_month: number
    latest_year: number
}

export type RecentSubmissions = {
    latest_01_minutes: number
    latest_05_minutes: number
    latest_15_minutes: number
    latest_60_minutes: number
}

export type RecentLoadAverages = {
    latest_01_minutes: number
    latest_05_minutes: number
    latest_15_minutes: number
}

export type SubmissionsHistograms = {
    latest_hour: number[]
    latest_day: number[]
}

export type Zombies = {
    ies: number
    pendings: number
}

export type AdminDashboard = {
    databases_info: DatabasesInfo
    free_disk_space: FreeDiskSpace
    recent_load_averages: RecentLoadAverages
    recent_connected_users: RecentConnectedUsers
    recent_submissions: RecentSubmissions
    submissions_histograms: SubmissionsHistograms
    zombies: Zombies
}

export type UpcomingExam = {
    exam_nm: string
    title: string
    username: string
    email: string
    exp_time_start: string | string | string | number
    running_time: number
    students: number
    name: string
    contest: number
}

export type UpcomingExams = UpcomingExam[]

export type SubmissionQueueItem = {
    submission_uid: string
    submission_id: string
    problem_id: string
    compiler_id: string
    time_in: string | string | string | number
    exam_id: string | null
    veredict: string | null
    user_id: string
    user__name: string
    problem__title: string
}

export type SubmissionQueueItems = SubmissionQueueItem[]

export type QueueQuery = {
    verdicts: string[]
    limit: number
}

export type UserRankingEntry = {
    user_id: string
    nickname: string | null
    email: string
    name: string
    problems: number
}

export type UserRanking = UserRankingEntry[]

export type DateRange = {
    start: string
    end: string
}

export type TwoFloats = {
    a: number
    b: number
}

export type TwoInts = {
    a: number
    b: number
}

export type Name = {
    name: string
}

export type SomeType = {
    a: string
    b: number
    c: boolean
    d: boolean
}

// Client types

export interface Meta {
    readonly token: string
}

export interface Download {
    readonly data: Uint8Array
    readonly name: string
    readonly type: string
}

// Exceptions

export class UnauthorizedError extends Error {
    name: string = "UnauthorizedError"
    constructor(public message: string = "Unauthorized") {
        super(message)
    }
}

export class InfoError extends Error {
    name: string = "InfoError"
    constructor(public message: string) {
        super(message)
    }
}

export class NotFoundError extends Error {
    name: string = "NotFoundError"
    constructor(public message: string) {
        super(message)
    }
}

export class InputError extends Error {
    name: string = "InputError"
    constructor(public message: string) {
        super(message)
    }
}

export class ProtocolError extends Error {
    name: string = "ProtocolError"
    constructor(public message: string) {
        super(message)
    }
}

type CacheEntry = {
    output: any
    ofiles: any
    epoch: number
}

/**
 *
 * JutgeApiClient
 *
 */
export class JutgeApiClient {
    //

    /** Client TTL values (in seconds) */
    clientTTLs: Map<string, number> = new Map()

    /** Whether to use cache or not */
    useCache: boolean = true

    /** Whether to log cache or not */
    logCache: boolean = false

    /** The cache */
    private cache: Map<string, CacheEntry> = new Map()

    /** URL to talk with the API */
    JUTGE_API_URL = process.env.JUTGE_API_URL || "https://api.jutge.org/api"

    /** Headers to include in the API requests */
    headers: Record<string, string> = {}

    /** Meta information */
    meta: Meta | null = null

    /** Function that sends a request to the API and returns the response. **/
    async execute(func: string, input: any, ifiles: File[] = []): Promise<[any, Download[]]> {
        //

        const caching = this.useCache && this.clientTTLs.has(func) && ifiles.length === 0

        // check cache
        if (caching) {
            const key = JSON.stringify({ func, input })
            const entry = this.cache.get(key)
            if (entry !== undefined) {
                if (this.logCache) console.log("found")
                const ttl = this.clientTTLs.get(func)!
                if (entry.epoch + ttl * 1000 > new Date().valueOf()) {
                    if (this.logCache) console.log("used")
                    return [entry.output, entry.ofiles]
                } else {
                    if (this.logCache) console.log("expired")
                    this.cache.delete(key)
                }
            }
        }
        if (this.logCache) console.log("fetch")

        // prepare form
        const iform = new FormData()
        const idata = { func, input, meta: this.meta }
        iform.append("data", JSON.stringify(idata))
        for (const index in ifiles) iform.append(`file_${index}`, ifiles[index])

        // send request
        const response = await fetch(this.JUTGE_API_URL, {
            method: "POST",
            body: iform,
            headers: this.headers,
        })

        // process response
        const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase()
        if (contentType !== "multipart/form-data") {
            throw new ProtocolError("The content type is not multipart/form-data")
        }

        const oform = await response.formData()
        const odata = oform.get("data")
        const { output, error, duration, operation_id, time } = JSON.parse(odata as string)

        if (error) {
            this.throwError(error, operation_id)
        }

        // extract ofiles
        const ofiles = []
        for (const key of oform.keys()) {
            const value = oform.get(key)
            if (value instanceof File) {
                ofiles.push({
                    data: new Uint8Array(await value.arrayBuffer()),
                    name: value.name,
                    type: value.type,
                })
            }
        }

        // update cache
        if (caching) {
            if (this.logCache) console.log("saved")
            const key = JSON.stringify({ func, input })
            this.cache.set(key, { output, ofiles, epoch: new Date().valueOf() })
        }

        return [output, ofiles]
    }

    /** Function that throws the exception received through the API */
    throwError(error: Record<string, any>, operation_id: string | undefined) {
        const message = error.message || "Unknown error"
        if (error.name === "UnauthorizedError") {
            throw new UnauthorizedError(message)
        } else if (error.name === "InfoError") {
            throw new InfoError(message)
        } else if (error.name === "NotFoundError") {
            throw new NotFoundError(message)
        } else if (error.name === "InputError") {
            throw new InputError(message)
        } else {
            throw new Error(message)
        }
    }

    /** Simple login setting meta */

    async login({ email, password }: { email: string; password: string }): Promise<CredentialsOut> {
        const [credentials, _] = await this.execute("auth.login", { email, password })
        if (credentials.error) throw new UnauthorizedError(credentials.error)
        this.meta = { token: credentials.token }
        return credentials
    }

    /** Simple login to exam setting meta */
    async loginExam({
        email,
        password,
        exam,
        exam_password,
    }: {
        email: string
        password: string
        exam: string
        exam_password: string
    }): Promise<CredentialsOut> {
        const [credentials, _] = await this.execute("auth.loginExam", { email, password, exam, exam_password })
        if (credentials.error) throw new UnauthorizedError(credentials.error)
        this.meta = { token: credentials.token }
        return credentials
    }

    /** Simple logout */
    async logout(): Promise<void> {
        await this.execute("auth.logout", null)
        this.meta = null
    }

    /** Clear the contents of the cache */
    clearCache() {
        if (this.logCache) console.log("clear")
        this.cache = new Map()
    }

    /** Provide a new value to the cache */
    setCache(newCache: string) {
        const obj = JSON.parse(newCache)
        this.cache = new Map(Object.entries(obj))
        this.removeExpired()
    }

    /** Get current value of the cache */
    getCache(): string {
        this.removeExpired()
        const obj = Object.fromEntries(this.cache.entries())
        return JSON.stringify(obj)
    }

    /** Remove expired entries from cache */
    private removeExpired() {
        for (const [key, entry] of this.cache) {
            const { func } = JSON.parse(key)
            const ttl = this.clientTTLs.get(func)
            if (ttl !== undefined && entry.epoch + ttl * 1000 < new Date().getTime()) {
                this.cache.delete(key)
            }
        }
    }

    readonly clients: Module_clients
    readonly auth: Module_auth
    readonly misc: Module_misc
    readonly tables: Module_tables
    readonly problems: Module_problems
    readonly student: Module_student
    readonly instructor: Module_instructor
    readonly games: Module_games
    readonly admin: Module_admin
    readonly testing: Module_testing

    constructor() {
        this.clients = new Module_clients(this)
        this.auth = new Module_auth(this)
        this.misc = new Module_misc(this)
        this.tables = new Module_tables(this)
        this.problems = new Module_problems(this)
        this.student = new Module_student(this)
        this.instructor = new Module_instructor(this)
        this.games = new Module_games(this)
        this.admin = new Module_admin(this)
        this.testing = new Module_testing(this)

        this.clientTTLs.set("misc.getAvatarPacks", 3600)
        this.clientTTLs.set("misc.getExamIcons", 3600)
        this.clientTTLs.set("misc.getDemosForCompiler", 3600)
        this.clientTTLs.set("tables.get", 300)
        this.clientTTLs.set("tables.getLanguages", 300)
        this.clientTTLs.set("tables.getCountries", 300)
        this.clientTTLs.set("tables.getCompilers", 300)
        this.clientTTLs.set("tables.getDrivers", 300)
        this.clientTTLs.set("tables.getVerdicts", 300)
        this.clientTTLs.set("tables.getProglangs", 300)
        this.clientTTLs.set("problems.getAllAbstractProblems", 3600)
    }
}

/**
 *
 * Module to download clients.
 *
 */
class Module_clients {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get Python client.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async python(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("clients.python", data)
        return [output, ofiles[0]]
    }

    /**
     * Get TypeScript client.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async typescript(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("clients.typescript", data)
        return [output, ofiles[0]]
    }

    /**
     * Get JavaScript client.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async javascript(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("clients.javascript", data)
        return [output, ofiles[0]]
    }

    /**
     * Get Java client.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async java(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("clients.java", data)
        return [output, ofiles[0]]
    }

    /**
     * Get Cpp client.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async cpp(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("clients.cpp", data)
        return [output, ofiles[0]]
    }

    /**
     * Get PHP client.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async php(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("clients.php", data)
        return [output, ofiles[0]]
    }
}

/**
 *
 * Module to provide authentication functions.
 *
 */
class Module_auth {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Login: Get an access token.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns a token on success. Throws UnauthorizedError on failure.
     */
    async login(data: CredentialsIn): Promise<CredentialsOut> {
        const [output, ofiles] = await this.root.execute("auth.login", data)
        return output
    }

    /**
     * Logout: Discard the access token.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async logout(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("auth.logout", data)
        return output
    }

    /**
     * Login to an exam: Get an access token for an exam.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns a token on success. Throws UnauthorizedError on failure.
     */
    async loginExam(data: ExamCredentialsIn): Promise<CredentialsOut> {
        const [output, ofiles] = await this.root.execute("auth.loginExam", data)
        return output
    }

    /**
     * Login: Get an access token.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns a token on success. Throws UnauthorizedError on failure. Created for backward compatibility, do not use.
     */
    async loginWithUsername(data: CredentialsWithUsernameIn): Promise<CredentialsOut> {
        const [output, ofiles] = await this.root.execute("auth.loginWithUsername", data)
        return output
    }
}

/**
 *
 * Module with miscellaneous endpoints
 *
 */
class Module_misc {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get version information of the API.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getApiVersion(data: SubmitQuizOut): Promise<ApiVersion> {
        const [output, ofiles] = await this.root.execute("misc.getApiVersion", data)
        return output
    }

    /**
     * Get requestion information.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getRequestInformation(data: SubmitQuizOut): Promise<RequestInformation> {
        const [output, ofiles] = await this.root.execute("misc.getRequestInformation", data)
        return output
    }

    /**
     * Get a fortune message.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getFortune(data: SubmitQuizOut): Promise<string> {
        const [output, ofiles] = await this.root.execute("misc.getFortune", data)
        return output
    }

    /**
     * Get server time.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getTime(data: SubmitQuizOut): Promise<Time> {
        const [output, ofiles] = await this.root.execute("misc.getTime", data)
        return output
    }

    /**
     * Get homepage stats.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getHomepageStats(data: SubmitQuizOut): Promise<HomepageStats> {
        const [output, ofiles] = await this.root.execute("misc.getHomepageStats", data)
        return output
    }

    /**
     * Get Jutge.org logo as a PNG file.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getLogo(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("misc.getLogo", data)
        return [output, ofiles[0]]
    }

    /**
     * Returns all packs of avatars.
     *
     * 🔐 Authentication: any
     * No warnings
     * Avatars are used in exams and contests to identify students or participants.
     */
    async getAvatarPacks(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("misc.getAvatarPacks", data)
        return output
    }

    /**
     * Returns all exam icons.
     *
     * 🔐 Authentication: any
     * No warnings
     * Exam icon are used in exams and contests to identify problems.
     */
    async getExamIcons(data: SubmitQuizOut): Promise<TagsDict> {
        const [output, ofiles] = await this.root.execute("misc.getExamIcons", data)
        return output
    }

    /**
     * Returns color mappings using colornames notation.
     *
     * 🔐 Authentication: any
     * No warnings
     * Color mappings may be used to colorize keys in the frontends. Color names are as defined in https://github.com/timoxley/colornames
     */
    async getColors(data: SubmitQuizOut): Promise<ColorMapping> {
        const [output, ofiles] = await this.root.execute("misc.getColors", data)
        return output
    }

    /**
     * Returns color mappings using hexadecimal color notation.
     *
     * 🔐 Authentication: any
     * No warnings
     * Color mappings may be used to colorize keys in the frontends.
     */
    async getHexColors(data: SubmitQuizOut): Promise<ColorMapping> {
        const [output, ofiles] = await this.root.execute("misc.getHexColors", data)
        return output
    }

    /**
     * Returns code demos for a given compiler as a dictionary of base64 codes indexed by problem_nm.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getDemosForCompiler(compiler_id: string): Promise<Record<string, string>> {
        const [output, ofiles] = await this.root.execute("misc.getDemosForCompiler", compiler_id)
        return output
    }
}

/**
 *
 * Module with quite static tables
 *
 */
class Module_tables {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Returns all tables.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns all compilers, countries, drivers, languages, proglangs, and verdicts in a single request. This data does not change often, so you should only request it once per session.
     */
    async get(data: SubmitQuizOut): Promise<AllTables> {
        const [output, ofiles] = await this.root.execute("tables.get", data)
        return output
    }

    /**
     * Returns all languages.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns all languages as a dictionary of objects, indexed by id.
     */
    async getLanguages(data: SubmitQuizOut): Promise<Record<string, Language>> {
        const [output, ofiles] = await this.root.execute("tables.getLanguages", data)
        return output
    }

    /**
     * Returns all countries.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns all countries as a dictionary of objects, indexed by id.
     */
    async getCountries(data: SubmitQuizOut): Promise<Record<string, Country>> {
        const [output, ofiles] = await this.root.execute("tables.getCountries", data)
        return output
    }

    /**
     * Returns all compilers.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns all compilers as a dictionary of objects, indexed by id.
     */
    async getCompilers(data: SubmitQuizOut): Promise<Record<string, Compiler>> {
        const [output, ofiles] = await this.root.execute("tables.getCompilers", data)
        return output
    }

    /**
     * Returns all drivers.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns all drivers as a dictionary of objects, indexed by id.
     */
    async getDrivers(data: SubmitQuizOut): Promise<Record<string, Driver>> {
        const [output, ofiles] = await this.root.execute("tables.getDrivers", data)
        return output
    }

    /**
     * Returns all verdicts.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns all verdicts as a dictionary of objects, indexed by id.
     */
    async getVerdicts(data: SubmitQuizOut): Promise<Record<string, Verdict>> {
        const [output, ofiles] = await this.root.execute("tables.getVerdicts", data)
        return output
    }

    /**
     * Returns all proglangs.
     *
     * 🔐 Authentication: any
     * No warnings
     * Returns all proglangs (porgramming languages) as a dictionary of objects, indexed by id.
     */
    async getProglangs(data: SubmitQuizOut): Promise<Record<string, Proglang>> {
        const [output, ofiles] = await this.root.execute("tables.getProglangs", data)
        return output
    }
}

/**
 *
 * Module with endpoints related to problems.

There are two types of problems: *abstract problems* and *problems*. An abstract
problem is a group of problems. A problem is an instance of an abstract problem
in a particular language. Abstract problems are identified by a `problem_nm` (such
as 'P68688'), while problems are identified by a `problem_id` including its
`language_id` (such as 'P68688_en'). Abstract problems have a list of problems,
while problems have an abstract problem. Abstract problems have an author, while
problems have a translator.

Available problems depend on the actor issuing the request. For example, non
authenticated users can only access public problems, while authenticated
users can potentially access more problems.

 *
 */
class Module_problems {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get all available abstract problems.
     *
     * 🔐 Authentication: any
     * No warnings
     * Includes problems.
     */
    async getAllAbstractProblems(data: SubmitQuizOut): Promise<Record<string, AbstractProblem>> {
        const [output, ofiles] = await this.root.execute("problems.getAllAbstractProblems", data)
        return output
    }

    /**
     * Get available abstract problems whose keys are in `problem_nms`.
     *
     * 🔐 Authentication: any
     * No warnings
     * Includes problems.
     */
    async getAbstractProblems(problem_nms: string): Promise<Record<string, AbstractProblem>> {
        const [output, ofiles] = await this.root.execute("problems.getAbstractProblems", problem_nms)
        return output
    }

    /**
     * Get available abstract problems that belong to a list.
     *
     * 🔐 Authentication: any
     * No warnings
     * Includes problems.
     */
    async getAbstractProblemsInList(list_key: string): Promise<Record<string, AbstractProblem>> {
        const [output, ofiles] = await this.root.execute("problems.getAbstractProblemsInList", list_key)
        return output
    }

    /**
     * Get an abstract problem.
     *
     * 🔐 Authentication: any
     * No warnings
     * Includes problems
     */
    async getAbstractProblem(problem_nm: string): Promise<AbstractProblem> {
        const [output, ofiles] = await this.root.execute("problems.getAbstractProblem", problem_nm)
        return output
    }

    /**
     * Get supplementary information of an abstract problem.
     *
     * 🔐 Authentication: any
     * No warnings
     * Includes accepted compilers and accepted proglangs
     */
    async getAbstractProblemSuppl(problem_nm: string): Promise<AbstractProblemSuppl> {
        const [output, ofiles] = await this.root.execute("problems.getAbstractProblemSuppl", problem_nm)
        return output
    }

    /**
     * Get a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     * Includes abstract problem.
     */
    async getProblem(problem_id: string): Promise<Problem> {
        const [output, ofiles] = await this.root.execute("problems.getProblem", problem_id)
        return output
    }

    /**
     * Get supplementary information of a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     * Includes accepted compilers, accepted proglangs, official solutions
    checks and handler specifications
     */
    async getProblemSuppl(problem_id: string): Promise<ProblemSuppl> {
        const [output, ofiles] = await this.root.execute("problems.getProblemSuppl", problem_id)
        return output
    }

    /**
     * Get sample testcases of a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getSampleTestcases(problem_id: string): Promise<Testcase[]> {
        const [output, ofiles] = await this.root.execute("problems.getSampleTestcases", problem_id)
        return output
    }

    /**
     * Get public testcases of a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     * Public testcases are like sample testcases, but are not meant to be shown in the problem statatement, because of their long length.
     */
    async getPublicTestcases(problem_id: string): Promise<Testcase[]> {
        const [output, ofiles] = await this.root.execute("problems.getPublicTestcases", problem_id)
        return output
    }

    /**
     * Get ZIP archive of a problem. This includes its statements, templates and public testcases.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getZipStatement(problem_id: string): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("problems.getZipStatement", problem_id)
        return [output, ofiles[0]]
    }

    /**
     * Get PDF statement of a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getPdfStatement(problem_id: string): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("problems.getPdfStatement", problem_id)
        return [output, ofiles[0]]
    }

    /**
     * Get Html statement of a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getHtmlStatement(problem_id: string): Promise<string> {
        const [output, ofiles] = await this.root.execute("problems.getHtmlStatement", problem_id)
        return output
    }

    /**
     * Get Text statement of a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getTextStatement(problem_id: string): Promise<string> {
        const [output, ofiles] = await this.root.execute("problems.getTextStatement", problem_id)
        return output
    }

    /**
     * Get Markdown statement of a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getMarkdownStatement(problem_id: string): Promise<string> {
        const [output, ofiles] = await this.root.execute("problems.getMarkdownStatement", problem_id)
        return output
    }

    /**
     * Get short Html statement of a problem (does not include title or author).
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getShortHtmlStatement(problem_id: string): Promise<string> {
        const [output, ofiles] = await this.root.execute("problems.getShortHtmlStatement", problem_id)
        return output
    }

    /**
     * Get short Text statement of a problem (does not include title or author).
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getShortTextStatement(problem_id: string): Promise<string> {
        const [output, ofiles] = await this.root.execute("problems.getShortTextStatement", problem_id)
        return output
    }

    /**
     * Get short Markdown statement of a problem (does not include title or author).
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getShortMarkdownStatement(problem_id: string): Promise<string> {
        const [output, ofiles] = await this.root.execute("problems.getShortMarkdownStatement", problem_id)
        return output
    }

    /**
     * Get list of template files of a problem (`main.*`, `code.*`, `public.tar`, etc.).
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getTemplates(problem_id: string): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("problems.getTemplates", problem_id)
        return output
    }

    /**
     * Get a template file of a problem.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async getTemplate(data: { problem_id: string; template: string }): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("problems.getTemplate", data)
        return [output, ofiles[0]]
    }

    /**
     * Get results for a semantic search for statement problems. The array is sorted by score (better at the top).
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async semanticSearch(data: { query: string; limit: number }): Promise<SearchResults> {
        const [output, ofiles] = await this.root.execute("problems.semanticSearch", data)
        return output
    }

    /**
     * Get results for a full text search for statement problems. The array is sorted by score (better at the top). Queries are matched against titles and statements and can use boolean operators.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async fullTextSearch(data: { query: string; limit: number }): Promise<SearchResults> {
        const [output, ofiles] = await this.root.execute("problems.fullTextSearch", data)
        return output
    }
}

/**
 *
 * These operations are available to all users, provided they are authenticated.
 *
 */
class Module_student {
    private readonly root: JutgeApiClient

    readonly keys: Module_student_keys
    readonly profile: Module_student_profile
    readonly dashboard: Module_student_dashboard
    readonly submissions: Module_student_submissions
    readonly courses: Module_student_courses
    readonly lists: Module_student_lists
    readonly exam: Module_student_exam
    readonly statuses: Module_student_statuses
    readonly awards: Module_student_awards
    readonly quizzes: Module_student_quizzes

    constructor(root: JutgeApiClient) {
        this.root = root
        this.keys = new Module_student_keys(root)
        this.profile = new Module_student_profile(root)
        this.dashboard = new Module_student_dashboard(root)
        this.submissions = new Module_student_submissions(root)
        this.courses = new Module_student_courses(root)
        this.lists = new Module_student_lists(root)
        this.exam = new Module_student_exam(root)
        this.statuses = new Module_student_statuses(root)
        this.awards = new Module_student_awards(root)
        this.quizzes = new Module_student_quizzes(root)
    }
}

/**
 *
 * This module exposes all valid keys for problems, courses and lists that a user can access.
 *
 */
class Module_student_keys {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get problem, courses (as enrolled and available) and list keys.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async get(data: SubmitQuizOut): Promise<AllKeys> {
        const [output, ofiles] = await this.root.execute("student.keys.get", data)
        return output
    }

    /**
     * Get problem keys.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getProblems(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("student.keys.getProblems", data)
        return output
    }

    /**
     * Get enrolled course keys.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getEnrolledCourses(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("student.keys.getEnrolledCourses", data)
        return output
    }

    /**
     * Get available course keys.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAvailableCourses(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("student.keys.getAvailableCourses", data)
        return output
    }

    /**
     * Get list keys.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getLists(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("student.keys.getLists", data)
        return output
    }
}

/**
 *
 * This module exposes the user profile.
 *
 */
class Module_student_profile {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get the profile.
     *
     * 🔐 Authentication: user
     * No warnings
     * In case of exams, some fields are not nullified to avoid cheating.
     */
    async get(data: SubmitQuizOut): Promise<Profile> {
        const [output, ofiles] = await this.root.execute("student.profile.get", data)
        return output
    }

    /**
     * Returns the avatar as a PNG file.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAvatar(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("student.profile.getAvatar", data)
        return [output, ofiles[0]]
    }

    /**
     * Update the profile
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async update(data: NewProfile): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("student.profile.update", data)
        return output
    }

    /**
     * Update the avatar with new PNG.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async updateAvatar(data: SubmitQuizOut, ifile: File): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("student.profile.updateAvatar", data, [ifile])
        return output
    }

    /**
     * Update password.
     *
     * 🔐 Authentication: user
     * No warnings
     * Receives the old password and the new one, and changes the password if the old one is correct and the new one strong enough.
     */
    async updatePassword(data: NewPassword): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("student.profile.updatePassword", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_student_dashboard {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get the ranking of the user over all users in the system.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAbsoluteRanking(data: SubmitQuizOut): Promise<number> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getAbsoluteRanking", data)
        return output
    }

    /**
     * Get all distributions.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAllDistributions(data: SubmitQuizOut): Promise<AllDistributions> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getAllDistributions", data)
        return output
    }

    /**
     * Get compilers distribution.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getCompilersDistribution(data: SubmitQuizOut): Promise<Distribution> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getCompilersDistribution", data)
        return output
    }

    /**
     * Get dashboard.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getDashboard(data: SubmitQuizOut): Promise<Dashboard> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getDashboard", data)
        return output
    }

    /**
     * Get heatmap calendar of submissions.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getHeatmapCalendar(data: SubmitQuizOut): Promise<HeatmapCalendar> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getHeatmapCalendar", data)
        return output
    }

    /**
     * Get programming languages distribution.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getProglangsDistribution(data: SubmitQuizOut): Promise<Distribution> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getProglangsDistribution", data)
        return output
    }

    /**
     * Get dashboard stats.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getStats(data: SubmitQuizOut): Promise<Distribution> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getStats", data)
        return output
    }

    /**
     * Get fancy Jutge level.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getLevel(data: SubmitQuizOut): Promise<string> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getLevel", data)
        return output
    }

    /**
     * Get submissions by hour distribution.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getSubmissionsByHour(data: SubmitQuizOut): Promise<Distribution> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getSubmissionsByHour", data)
        return output
    }

    /**
     * Get submissions by weekday distribution.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getSubmissionsByWeekDay(data: SubmitQuizOut): Promise<Distribution> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getSubmissionsByWeekDay", data)
        return output
    }

    /**
     * Get verdicts distribution.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getVerdictsDistribution(data: SubmitQuizOut): Promise<Distribution> {
        const [output, ofiles] = await this.root.execute("student.dashboard.getVerdictsDistribution", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_student_submissions {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get index of all submissions for an abstract problem.
     *
     * 🔐 Authentication: user
     * No warnings
     * Grouped by problem.
     */
    async indexForAbstractProblem(problem_nm: string): Promise<Record<string, Record<string, Submission>>> {
        const [output, ofiles] = await this.root.execute("student.submissions.indexForAbstractProblem", problem_nm)
        return output
    }

    /**
     * Get index of all submissions for a problem.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async indexForProblem(problem_id: string): Promise<Record<string, Submission>> {
        const [output, ofiles] = await this.root.execute("student.submissions.indexForProblem", problem_id)
        return output
    }

    /**
     * Get all submissions.
     *
     * 🔐 Authentication: user
     * No warnings
     * Flat array of submissions in chronological order.
     */
    async getAll(data: SubmitQuizOut): Promise<Submission[]> {
        const [output, ofiles] = await this.root.execute("student.submissions.getAll", data)
        return output
    }

    /**
     * Submit a solution to the Judge, easy interface.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async submit(data: { problem_id: string; compiler_id: string; code: string; annotation: string }): Promise<string> {
        const [output, ofiles] = await this.root.execute("student.submissions.submit", data)
        return output
    }

    /**
     * Submit a solution to the Judge, full interface.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async submitFull(data: NewSubmissionIn, ifiles: File[]): Promise<NewSubmissionOut> {
        const [output, ofiles] = await this.root.execute("student.submissions.submitFull", data, ifiles)
        return output
    }

    /**
     * Get a submission.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async get(data: GetGameResultIn): Promise<Submission> {
        const [output, ofiles] = await this.root.execute("student.submissions.get", data)
        return output
    }

    /**
     * Get code for a submission as a string in base64.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getCodeAsB64(data: GetGameResultIn): Promise<string> {
        const [output, ofiles] = await this.root.execute("student.submissions.getCodeAsB64", data)
        return output
    }

    /**
     * Get code metrics for a submission as JSON.
     *
     * 🔐 Authentication: user
     * ❌ Warning: TODO: add more documentation
     * See https://github.com/jutge-org/jutge-code-metrics for details.
     */
    async getCodeMetrics(data: GetGameResultIn): Promise<any> {
        const [output, ofiles] = await this.root.execute("student.submissions.getCodeMetrics", data)
        return output
    }

    /**
     * Get list of awards ids for a submission.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAwards(data: GetGameResultIn): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("student.submissions.getAwards", data)
        return output
    }

    /**
     * Get analysis of a submission.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAnalysis(data: GetGameResultIn): Promise<SubmissionAnalysis[]> {
        const [output, ofiles] = await this.root.execute("student.submissions.getAnalysis", data)
        return output
    }

    /**
     * Get a (public) testcase analysis of a submission.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getTestcaseAnalysis(data: {
        problem_id: string
        submission_id: string
        testcase: string
    }): Promise<TestcaseAnalysis> {
        const [output, ofiles] = await this.root.execute("student.submissions.getTestcaseAnalysis", data)
        return output
    }

    /**
     * Get the result of a game submission.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getGameResult(data: GetGameResultIn): Promise<GetGameResultOut> {
        const [output, ofiles] = await this.root.execute("student.submissions.getGameResult", data)
        return output
    }

    /**
     * Get the output of a game in a game submission.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getGameOutput(data: GetGameOutputIn): Promise<string> {
        const [output, ofiles] = await this.root.execute("student.submissions.getGameOutput", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_student_courses {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get index of all available courses.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async indexAvailable(data: SubmitQuizOut): Promise<Record<string, BriefCourse>> {
        const [output, ofiles] = await this.root.execute("student.courses.indexAvailable", data)
        return output
    }

    /**
     * Get index of all enrolled courses.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async indexEnrolled(data: SubmitQuizOut): Promise<Record<string, BriefCourse>> {
        const [output, ofiles] = await this.root.execute("student.courses.indexEnrolled", data)
        return output
    }

    /**
     * Get an available course.
     *
     * 🔐 Authentication: user
     * No warnings
     * Includes owner and lists.
     */
    async getAvailable(course_key: string): Promise<Course> {
        const [output, ofiles] = await this.root.execute("student.courses.getAvailable", course_key)
        return output
    }

    /**
     * Get an enrolled course.
     *
     * 🔐 Authentication: user
     * No warnings
     * Includes owner and lists.
     */
    async getEnrolled(course_key: string): Promise<Course> {
        const [output, ofiles] = await this.root.execute("student.courses.getEnrolled", course_key)
        return output
    }

    /**
     * Enroll in an available course.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async enroll(course_key: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("student.courses.enroll", course_key)
        return output
    }

    /**
     * Unenroll from an enrolled course.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async unenroll(course_key: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("student.courses.unenroll", course_key)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_student_lists {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get all lists.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAll(data: SubmitQuizOut): Promise<Record<string, BriefList>> {
        const [output, ofiles] = await this.root.execute("student.lists.getAll", data)
        return output
    }

    /**
     * Get a list.
     *
     * 🔐 Authentication: user
     * No warnings
     * Includes items, owner.
     */
    async get(list_key: string): Promise<List> {
        const [output, ofiles] = await this.root.execute("student.lists.get", list_key)
        return output
    }
}

/**
 *
 * ‼️ The state of this module is UNDER CONSTRUCTION. It is not ready for production use. The output of some function is capped if the exam has not started yet.
 *
 */
class Module_student_exam {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get list of ready exams.
     *
     * 🔐 Authentication: any
     * No warnings
     * An exam is ready if the current time is between its expected start time minus two days and its expected end time plus two days. Exams are sorted by their distance to the current time and by title order in case of ties.
     */
    async getReadyExams(data: SubmitQuizOut): Promise<ReadyExam[]> {
        const [output, ofiles] = await this.root.execute("student.exam.getReadyExams", data)
        return output
    }

    /**
     * Get current exam.
     *
     * 🔐 Authentication: exam
     * No warnings
     *
     */
    async get(data: SubmitQuizOut): Promise<RunningExam> {
        const [output, ofiles] = await this.root.execute("student.exam.get", data)
        return output
    }

    /**
     * Get a document in an exam.
     *
     * 🔐 Authentication: exam
     * No warnings
     *
     */
    async getDocument(document_nm: string): Promise<RunningExamDocument> {
        const [output, ofiles] = await this.root.execute("student.exam.getDocument", document_nm)
        return output
    }

    /**
     * Get PDF of a document in an exam.
     *
     * 🔐 Authentication: exam
     * No warnings
     *
     */
    async getDocumentPdf(document_nm: string): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("student.exam.getDocumentPdf", document_nm)
        return [output, ofiles[0]]
    }

    /**
     * Get ranking of the current contest.
     *
     * 🔐 Authentication: exam
     * No warnings
     *
     */
    async getRanking(data: SubmitQuizOut): Promise<Ranking> {
        const [output, ofiles] = await this.root.execute("student.exam.getRanking", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_student_statuses {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get statuses for all abstract problems.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAll(data: SubmitQuizOut): Promise<Record<string, AbstractStatus>> {
        const [output, ofiles] = await this.root.execute("student.statuses.getAll", data)
        return output
    }

    /**
     * Get status for an abstract problem.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getForAbstractProblem(problem_nm: string): Promise<AbstractStatus> {
        const [output, ofiles] = await this.root.execute("student.statuses.getForAbstractProblem", problem_nm)
        return output
    }

    /**
     * Get status for a problem.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getForProblem(problem_id: string): Promise<Status> {
        const [output, ofiles] = await this.root.execute("student.statuses.getForProblem", problem_id)
        return output
    }
}

/**
 *
 * This module is not yet finished.
 *
 */
class Module_student_awards {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get all awards.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getAll(data: SubmitQuizOut): Promise<Record<string, BriefAward>> {
        const [output, ofiles] = await this.root.execute("student.awards.getAll", data)
        return output
    }

    /**
     * Get an award.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async get(award_id: string): Promise<Award> {
        const [output, ofiles] = await this.root.execute("student.awards.get", award_id)
        return output
    }
}

/**
 *
 * This module exposes the quizzes. UNDER CONSTRUCTION.
 *
 */
class Module_student_quizzes {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Take a quiz.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async takeQuiz(data: TakeQuizIn): Promise<TakeQuizOut> {
        const [output, ofiles] = await this.root.execute("student.quizzes.takeQuiz", data)
        return output
    }

    /**
     * Submit a quiz.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async submitQuiz(data: SubmitQuizIn): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("student.quizzes.submitQuiz", data)
        return output
    }

    /**
     * Get the data of a submitted quiz.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async getQuizData(data: GetGameResultIn): Promise<GetQuizDataOut> {
        const [output, ofiles] = await this.root.execute("student.quizzes.getQuizData", data)
        return output
    }
}

/**
 *
 * This module is meant to be used by instructors
 *
 */
class Module_instructor {
    private readonly root: JutgeApiClient

    readonly documents: Module_instructor_documents
    readonly lists: Module_instructor_lists
    readonly courses: Module_instructor_courses
    readonly exams: Module_instructor_exams
    readonly problems: Module_instructor_problems
    readonly queries: Module_instructor_queries
    readonly tags: Module_instructor_tags
    readonly jutgeai: Module_instructor_jutgeai

    constructor(root: JutgeApiClient) {
        this.root = root
        this.documents = new Module_instructor_documents(root)
        this.lists = new Module_instructor_lists(root)
        this.courses = new Module_instructor_courses(root)
        this.exams = new Module_instructor_exams(root)
        this.problems = new Module_instructor_problems(root)
        this.queries = new Module_instructor_queries(root)
        this.tags = new Module_instructor_tags(root)
        this.jutgeai = new Module_instructor_jutgeai(root)
    }
}

/**
 *
 * No description yet
 *
 */
class Module_instructor_documents {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get index of all documents.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async index(data: SubmitQuizOut): Promise<Record<string, Document>> {
        const [output, ofiles] = await this.root.execute("instructor.documents.index", data)
        return output
    }

    /**
     * Get a document.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * The PDF file is not included in the response.
     */
    async get(document_nm: string): Promise<Document> {
        const [output, ofiles] = await this.root.execute("instructor.documents.get", document_nm)
        return output
    }

    /**
     * Get PDF of a document.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getPdf(document_nm: string): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("instructor.documents.getPdf", document_nm)
        return [output, ofiles[0]]
    }

    /**
     * Create a new document.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async create(data: DocumentCreation, ifile: File): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.documents.create", data, [ifile])
        return output
    }

    /**
     * Update a document.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async update(data: DocumentCreation, ifile: File): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.documents.update", data, [ifile])
        return output
    }

    /**
     * Remove a document.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async remove(document_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.documents.remove", document_nm)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_instructor_lists {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get index of all lists.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async index(data: SubmitQuizOut): Promise<Record<string, InstructorBriefList>> {
        const [output, ofiles] = await this.root.execute("instructor.lists.index", data)
        return output
    }

    /**
     * Get a list.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async get(list_nm: string): Promise<InstructorList> {
        const [output, ofiles] = await this.root.execute("instructor.lists.get", list_nm)
        return output
    }

    /**
     * Create a new list.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async create(data: InstructorListCreation): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.lists.create", data)
        return output
    }

    /**
     * Update an existing list.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async update(data: InstructorListCreation): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.lists.update", data)
        return output
    }

    /**
     * Delete an existing list.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async remove(list_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.lists.remove", list_nm)
        return output
    }

    /**
     * Get the list of lists that are archived.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * At some point, endpoints related to archiving lists should change as the archive bit will be an attribute of each list.
     */
    async getArchived(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("instructor.lists.getArchived", data)
        return output
    }

    /**
     * Archive a list.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async archive(list_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.lists.archive", list_nm)
        return output
    }

    /**
     * Unarchive a list.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async unarchive(list_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.lists.unarchive", list_nm)
        return output
    }
}

/**
 *
 *
This module manages the courses that an instructor is teaching. It allows the instructor to manage the course, including getting and updating its lists, students and tutors. It can also send invites to pending students and tutors.

The course name is a unique slug for the course. It is used to reference the course in the system.

The course title is the human-readable title of the course.

The course description is a human-readable description of the course.

Students and tutors are managed in three lists: invited, enrolled and pending. These contains the emails of these users. Invited students and tutors are those who have been invited to the course. Enrolled students and tutors are those who have accepted the invitation and are part of the course. Pending students and tutors are those who have been invited to join the course but have not yet accepted. Enrolled and pending students and tutors are managed by the system and cannot not be modified directly.

 *
 */
class Module_instructor_courses {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get index of all courses.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async index(data: SubmitQuizOut): Promise<Record<string, InstructorBriefCourse>> {
        const [output, ofiles] = await this.root.execute("instructor.courses.index", data)
        return output
    }

    /**
     * Get a course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async get(course_nm: string): Promise<InstructorCourse> {
        const [output, ofiles] = await this.root.execute("instructor.courses.get", course_nm)
        return output
    }

    /**
     * Create a new course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Only invited students and tutors are taken into account. Enrolled and pending students and tutors are ignored, as these are managed by the system.
     */
    async create(data: InstructorCourseCreation): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.courses.create", data)
        return output
    }

    /**
     * Update an existing course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Only invited students and tutors are taken into account. Enrolled and pending students and tutors are ignored, as these are managed by the system.
     */
    async update(data: InstructorCourseUpdate): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.courses.update", data)
        return output
    }

    /**
     * Delete an existing course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * A course should not be deleted. Ask a system administrator to remove it if you really need it.
     */
    async remove(course_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.courses.remove", course_nm)
        return output
    }

    /**
     * Send invite email to pending students in the course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Please do not abuse.
     */
    async sendInviteToStudents(course_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.courses.sendInviteToStudents", course_nm)
        return output
    }

    /**
     * Send invite email to pending tutors in the course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Please do not abuse.
     */
    async sendInviteToTutors(course_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.courses.sendInviteToTutors", course_nm)
        return output
    }

    /**
     * Get the profiles of the students enrolled in the course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getStudentProfiles(course_nm: string): Promise<Record<string, StudentProfile>> {
        const [output, ofiles] = await this.root.execute("instructor.courses.getStudentProfiles", course_nm)
        return output
    }

    /**
     * Get the profiles of the tutors enrolled in the course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getTutorProfiles(course_nm: string): Promise<Record<string, StudentProfile>> {
        const [output, ofiles] = await this.root.execute("instructor.courses.getTutorProfiles", course_nm)
        return output
    }

    /**
     * Get the list of courses that are archived.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * At some point, endpoints related to archiving courses should change as the archive bit will be an attribute of each course.
     */
    async getArchived(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("instructor.courses.getArchived", data)
        return output
    }

    /**
     * Archive a course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async archive(course_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.courses.archive", course_nm)
        return output
    }

    /**
     * Unarchive a course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async unarchive(course_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.courses.unarchive", course_nm)
        return output
    }
}

/**
 *
 *

This module manages the exams that an instructor is teaching. It allows the instructor to manage the exam, including getting and updating its documents, problems, students and submissions.

Exams objects are quite complex. Thus, this interface is also a bit complex. Each part of an exam can be get or updated in a separate endpoint. The main endpoint is the get endpoint, which returns the full exam object.

 *
 */
class Module_instructor_exams {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get index of all exams.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async index(data: SubmitQuizOut): Promise<Record<string, InstructorBriefExam>> {
        const [output, ofiles] = await this.root.execute("instructor.exams.index", data)
        return output
    }

    /**
     * Get an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async get(exam_nm: string): Promise<InstructorExam> {
        const [output, ofiles] = await this.root.execute("instructor.exams.get", exam_nm)
        return output
    }

    /**
     * Get documents of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getDocuments(exam_nm: string): Promise<RunningExamDocument[]> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getDocuments", exam_nm)
        return output
    }

    /**
     * Get problems of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getProblems(exam_nm: string): Promise<InstructorExamProblem[]> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getProblems", exam_nm)
        return output
    }

    /**
     * Get students of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getStudents(exam_nm: string): Promise<InstructorExamStudent[]> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getStudents", exam_nm)
        return output
    }

    /**
     * Get an student of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getStudent(data: { exam_nm: string; email: string }): Promise<InstructorExamStudent> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getStudent", data)
        return output
    }

    /**
     * Get submissions of an exam as a webstream.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Meant for real-time streaming of submissions, most instructors will possibly prefer getSubmissionsPack.
     */
    async getSubmissions(data: { exam_nm: string; options: InstructorExamSubmissionsOptions }): Promise<WebStream> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getSubmissions", data)
        return output
    }

    /**
     * Get submissions of an exam as a pack.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * This endpoint will prepare the pack in the background and return a link to download it later. Packs take some time to be prepared, and are deleted after 24 hours. This is the preferred endpoint for most instructors, as it is simpler to use than getSubmissions.
     */
    async getSubmissionsPack(data: { exam_nm: string; options: InstructorExamSubmissionsOptions }): Promise<Pack> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getSubmissionsPack", data)
        return output
    }

    /**
     * Get statistics of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getStatistics(exam_nm: string): Promise<ExamStatistics> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getStatistics", exam_nm)
        return output
    }

    /**
     * Create a new exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async create(data: InstructorExamCreation): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.create", data)
        return output
    }

    /**
     * Update an existing exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async update(data: InstructorExamUpdate): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.update", data)
        return output
    }

    /**
     * Update documents of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async updateDocuments(data: { exam_nm: string; document_nms: string[] }): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.updateDocuments", data)
        return output
    }

    /**
     * Update compilers of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async updateCompilers(data: { exam_nm: string; compiler_ids: string[] }): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.updateCompilers", data)
        return output
    }

    /**
     * Update problems of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async updateProblems(data: { exam_nm: string; problems: InstructorExamProblem[] }): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.updateProblems", data)
        return output
    }

    /**
     * Update students of an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async updateStudents(data: { exam_nm: string; students: InstructorExamStudent[] }): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.updateStudents", data)
        return output
    }

    /**
     * Add students to an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async addStudents(data: { exam_nm: string; students: InstructorExamStudent[] }): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.addStudents", data)
        return output
    }

    /**
     * Remove students from an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async removeStudents(data: { exam_nm: string; emails: string[] }): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.removeStudents", data)
        return output
    }

    /**
     * Delete an existing exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Note: An exam can only be deleted if it has not started.
     */
    async remove(exam_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.remove", exam_nm)
        return output
    }

    /**
     * Get the list of exams that are archived.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * At some point, endpoints related to archiving exams should change as the archive bit will be an attribute of each exam.
     */
    async getArchived(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getArchived", data)
        return output
    }

    /**
     * Archive an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async archive(exam_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.archive", exam_nm)
        return output
    }

    /**
     * Unarchive an exam.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async unarchive(exam_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.exams.unarchive", exam_nm)
        return output
    }

    /**
     * Get the ranking.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Under development.
     */
    async getRanking(exam_nm: string): Promise<Ranking> {
        const [output, ofiles] = await this.root.execute("instructor.exams.getRanking", exam_nm)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_instructor_problems {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get the list of own problems.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getOwnProblems(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("instructor.problems.getOwnProblems", data)
        return output
    }

    /**
     * Set the sharing settings of a problem.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
            Without a passcode, the problem is visible to all users.
            With a passcode, the problem is only visible to users with the correct passcode.
            With shared testcases, the testcases are shared with instructors.
            With shared solutions, the solutions are shared with instructors.

     */
    async setSharingSettings(data: SharingSettings): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.problems.setSharingSettings", data)
        return output
    }

    /**
     * Get the sharing settings of a problem.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getSharingSettings(problem_nm: string): Promise<SharingSettings> {
        const [output, ofiles] = await this.root.execute("instructor.problems.getSharingSettings", problem_nm)
        return output
    }

    /**
     * Get the sharing settings of all problems.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getAllSharingSettings(data: SubmitQuizOut): Promise<SharingSettings[]> {
        const [output, ofiles] = await this.root.execute("instructor.problems.getAllSharingSettings", data)
        return output
    }

    /**
     * Set the deprecation of a problem.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * If the reason is null or empty, the problem is undeprecated.
     */
    async setDeprecation(data: Deprecation): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.problems.setDeprecation", data)
        return output
    }

    /**
     * Get anonymous submissions for an abstract problem.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * This function is useful to produce statistics about the submissions for an abstract problem. The user ids are anonymized using a nonce.
     */
    async getAnonymousSubmissions(problem_nm: string): Promise<ProblemAnonymousSubmission[]> {
        const [output, ofiles] = await this.root.execute("instructor.problems.getAnonymousSubmissions", problem_nm)
        return output
    }

    /**
     * Download a problem as a ZIP file.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async download(problem_nm: string): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("instructor.problems.download", problem_nm)
        return [output, ofiles[0]]
    }

    /**
     * Create a problem from a ZIP archive.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * This endpoint uses terminal web streaming: It returns an id from which the problem feedback is streamed over <URL>/api/webstreams/<id>.
     */
    async create(passcode: string, ifile: File): Promise<WebStream> {
        const [output, ofiles] = await this.root.execute("instructor.problems.create", passcode, [ifile])
        return output
    }

    /**
     * Update a problem from a ZIP archive.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * This endpoint uses terminal web streaming: It returns an id from which the problem feedback is streamed over <URL>/api/webstreams/<id>.
     */
    async update(problem_nm: string, ifile: File): Promise<WebStream> {
        const [output, ofiles] = await this.root.execute("instructor.problems.update", problem_nm, [ifile])
        return output
    }

    /**
     * Remove a problem.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * A problem can only be removed if it has few submissions.
     */
    async remove(problem_nm: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("instructor.problems.remove", problem_nm)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_instructor_queries {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get submissions for a problem in a course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Returns a list of submissions for a given problem for all students of a given course. Each submission includes the email, time, problem name, problem id, verdict, and IP address. The list is ordered by email and time. Known as ricard01 in the past.
     */
    async getCourseProblemSubmissions(data: { course_nm: string; problem_nm: string }): Promise<SubmissionsQuery> {
        const [output, ofiles] = await this.root.execute("instructor.queries.getCourseProblemSubmissions", data)
        return output
    }

    /**
     * Get submissions for all problems in a list in a course.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Returns a list of submissions for all problems in a given list for all students of a given course. Each submission includes the email, time, problem name, problem id, verdict, and IP address. The list is ordered by email, problem id and time. Known as ricard02 in the past.
     */
    async getCourseListSubmissions(data: { course_nm: string; list_nm: string }): Promise<SubmissionsQuery> {
        const [output, ofiles] = await this.root.execute("instructor.queries.getCourseListSubmissions", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_instructor_tags {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get list of all tags.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async index(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("instructor.tags.index", data)
        return output
    }

    /**
     * Get all tags with their problems.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getDict(data: SubmitQuizOut): Promise<TagsDict> {
        const [output, ofiles] = await this.root.execute("instructor.tags.getDict", data)
        return output
    }

    /**
     * Get all problems with a given tag.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async get(tag: string): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("instructor.tags.get", tag)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_instructor_jutgeai {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get the list of supported models.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async supportedModels(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("instructor.jutgeai.supportedModels", data)
        return output
    }

    /**
     * Get the list of supported image models.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async supportedImageModels(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("instructor.jutgeai.supportedImageModels", data)
        return output
    }

    /**
     * Chat with an AI model using a list of messages.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Send a conversation (list of system|user|assistant messages) and get the next assistant reply. Models are listed in the `supportedModels` endpoint. This endpoint uses terminal web streaming: It returns an id from which the chat is streamed over <URL>/api/webstreams/<id>. If `addUsage` is true, the usage of the model will be added at the end of the response as a JSON object between `---USAGE_JSON_START---` and `---USAGE_JSON_END---`.
     */
    async chat(data: ChatPrompt): Promise<WebStream> {
        const [output, ofiles] = await this.root.execute("instructor.jutgeai.chat", data)
        return output
    }

    /**
     * Create an image using an AI image model.
     *
     * 🔐 Authentication: instructor
     * No warnings
     * Some models only accept certain sizes and aspect ratios.
     */
    async createImage(data: CreateImageInput): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("instructor.jutgeai.createImage", data)
        return [output, ofiles[0]]
    }

    /**
     * Get audit usage of LLM models.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async getLlmUsage(data: SubmitQuizOut): Promise<LlmUsageEntry[]> {
        const [output, ofiles] = await this.root.execute("instructor.jutgeai.getLlmUsage", data)
        return output
    }
}

/**
 *
 * Module to allow playing Jutge.org games. All operations require the `competitions` user. This module is still under development and is not yet ready for production.
 *
 */
class Module_games {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get list of problems that are games.
     *
     * 🔐 Authentication: competitions
     * No warnings
     *
     */
    async getGames(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("games.getGames", data)
        return output
    }

    /**
     * Get dummy player for a game.
     *
     * 🔐 Authentication: competitions
     * No warnings
     *
     */
    async getDummy(problem_id: string): Promise<string> {
        const [output, ofiles] = await this.root.execute("games.getDummy", problem_id)
        return output
    }

    /**
     * Get a ZIP file with the viewer for a game.
     *
     * 🔐 Authentication: competitions
     * No warnings
     *
     */
    async getViewer(problem_id: string): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("games.getViewer", problem_id)
        return [output, ofiles[0]]
    }

    /**
     * Submit a match for a game.
     *
     * 🔐 Authentication: competitions
     * No warnings
     *
     */
    async submitMatch(data: SubmitMatchInput): Promise<NewSubmissionOut> {
        const [output, ofiles] = await this.root.execute("games.submitMatch", data)
        return output
    }
}

/**
 *
 * Module with administration endpoints. Not meant for regular users. It still lacks lots of endpoints
 *
 */
class Module_admin {
    private readonly root: JutgeApiClient

    readonly instructors: Module_admin_instructors
    readonly users: Module_admin_users
    readonly dashboard: Module_admin_dashboard
    readonly queue: Module_admin_queue
    readonly tasks: Module_admin_tasks
    readonly stats: Module_admin_stats
    readonly problems: Module_admin_problems

    constructor(root: JutgeApiClient) {
        this.root = root
        this.instructors = new Module_admin_instructors(root)
        this.users = new Module_admin_users(root)
        this.dashboard = new Module_admin_dashboard(root)
        this.queue = new Module_admin_queue(root)
        this.tasks = new Module_admin_tasks(root)
        this.stats = new Module_admin_stats(root)
        this.problems = new Module_admin_problems(root)
    }
}

/**
 *
 * No description yet
 *
 */
class Module_admin_instructors {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get instructors.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async get(data: SubmitQuizOut): Promise<InstructorEntries> {
        const [output, ofiles] = await this.root.execute("admin.instructors.get", data)
        return output
    }

    /**
     * Add an instructor.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async add(data: { email: string; username: string }): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.instructors.add", data)
        return output
    }

    /**
     * Remove an instructor.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async remove(email: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.instructors.remove", email)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_admin_users {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Count users
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async count(data: SubmitQuizOut): Promise<number> {
        const [output, ofiles] = await this.root.execute("admin.users.count", data)
        return output
    }

    /**
     * Create a user
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async create(data: UserCreation): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.users.create", data)
        return output
    }

    /**
     * Remove a user
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async remove(email: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.users.remove", email)
        return output
    }

    /**
     * Set a password for a user
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async setPassword(data: { email: string; password: string; message: string }): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.users.setPassword", data)
        return output
    }

    /**
     * Get all profiles of users whose email or name contains a specific string
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getProfiles(data: string): Promise<ProfileForAdmin[]> {
        const [output, ofiles] = await this.root.execute("admin.users.getProfiles", data)
        return output
    }

    /**
     * Get all users (well, just email and name) whose email contains a specific string
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getAllWithEmail(data: string): Promise<UsersEmailsAndNames> {
        const [output, ofiles] = await this.root.execute("admin.users.getAllWithEmail", data)
        return output
    }

    /**
     * Get a list of emails of spam users
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getSpamUsers(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("admin.users.getSpamUsers", data)
        return output
    }

    /**
     * Remove spam users
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async removeSpamUsers(data: string[]): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.users.removeSpamUsers", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_admin_dashboard {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get all admin dashboard items.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getAll(data: SubmitQuizOut): Promise<AdminDashboard> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getAll", data)
        return output
    }

    /**
     * Get database info.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDatabasesInfo(data: SubmitQuizOut): Promise<DatabasesInfo> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getDatabasesInfo", data)
        return output
    }

    /**
     * Get free disk space.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getFreeDiskSpace(data: SubmitQuizOut): Promise<FreeDiskSpace> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getFreeDiskSpace", data)
        return output
    }

    /**
     * Get recent connected users.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getRecentConnectedUsers(data: SubmitQuizOut): Promise<RecentConnectedUsers> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getRecentConnectedUsers", data)
        return output
    }

    /**
     * Get recent load averages.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getRecentLoadAverages(data: SubmitQuizOut): Promise<RecentLoadAverages> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getRecentLoadAverages", data)
        return output
    }

    /**
     * Get recent submissions.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getRecentSubmissions(data: SubmitQuizOut): Promise<RecentSubmissions> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getRecentSubmissions", data)
        return output
    }

    /**
     * Get submissions histograms.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getSubmissionsHistograms(data: SubmitQuizOut): Promise<SubmissionsHistograms> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getSubmissionsHistograms", data)
        return output
    }

    /**
     * Get zombies.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getZombies(data: SubmitQuizOut): Promise<Zombies> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getZombies", data)
        return output
    }

    /**
     * Get upcoming exams
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getUpcomingExams(data: { daysBefore: number; daysAfter: number }): Promise<UpcomingExams> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getUpcomingExams", data)
        return output
    }

    /**
     * Get pm2 status
     *
     * 🔐 Authentication: admin
     * No warnings
     * This endpoint retrieves the status of PM2 processes as reported by `pm2 jlist`.
     */
    async getPM2Status(data: SubmitQuizOut): Promise<any> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getPM2Status", data)
        return output
    }

    /**
     * Get docker status
     *
     * 🔐 Authentication: admin
     * No warnings
     * This endpoint retrieves the status of docker processes as reported by `docker ps --all`.
     */
    async getDockerStatus(data: SubmitQuizOut): Promise<any> {
        const [output, ofiles] = await this.root.execute("admin.dashboard.getDockerStatus", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_admin_queue {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get the lattest submissions from the queue in descending chronological order for a certain verdict.
     *
     * 🔐 Authentication: admin
     * No warnings
     * The `limit` parameter tells the number of submissions to retrieve. The `verdicts` parameter is an array of verdicts to filter the submissions. If no verdicts are provided, all submissions will be retrieved.
     */
    async getQueue(data: QueueQuery): Promise<SubmissionQueueItems> {
        const [output, ofiles] = await this.root.execute("admin.queue.getQueue", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_admin_tasks {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Purge expired access tokens.
     *
     * 🔐 Authentication: admin
     * No warnings
     * Purge expired access tokens (call it from time to time, it does not hurt)
     */
    async purgeAuthTokens(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.tasks.purgeAuthTokens", data)
        return output
    }

    /**
     * Clear all memoization caches.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async clearCaches(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.tasks.clearCaches", data)
        return output
    }

    /**
     * Fatalize IE submissions.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async fatalizeIEs(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.tasks.fatalizeIEs", data)
        return output
    }

    /**
     * Fatalize pending submissions.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async fatalizePendings(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.tasks.fatalizePendings", data)
        return output
    }

    /**
     * Resubmit IE submissions.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async resubmitIEs(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.tasks.resubmitIEs", data)
        return output
    }

    /**
     * Resubmit pending submissions.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async resubmitPendings(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.tasks.resubmitPendings", data)
        return output
    }

    /**
     * Get full text search database status.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getFullTextSearchDatabase(data: SubmitQuizOut): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("admin.tasks.getFullTextSearchDatabase", data)
        return [output, ofiles[0]]
    }

    /**
     * Update semantic search database.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async updateSemanticSearchDatabase(data: string, ifile: File): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("admin.tasks.updateSemanticSearchDatabase", data, [ifile])
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_admin_stats {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get counters.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getCounters(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getCounters", data)
        return output
    }

    /**
     * Get distribution of verdicts.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfVerdicts(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfVerdicts", data)
        return output
    }

    /**
     * Get distribution of verdicts by year.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfVerdictsByYear(data: SubmitQuizOut): Promise<Record<string, number>[]> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfVerdictsByYear", data)
        return output
    }

    /**
     * Get distribution of compilers.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfCompilers(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfCompilers", data)
        return output
    }

    /**
     * Get distribution of proglangs.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfProglangs(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfProglangs", data)
        return output
    }

    /**
     * Get distribution of registered users by year.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfUsersByYear(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfUsersByYear", data)
        return output
    }

    /**
     * Get distribution of registered users by country.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfUsersByCountry(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfUsersByCountry", data)
        return output
    }

    /**
     * Get distribution of registered users by submissions using a custom bucket size.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfUsersBySubmissions(data: number): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfUsersBySubmissions", data)
        return output
    }

    /**
     * Get ranking of users.
     *
     * 🔐 Authentication: admin
     * ❌ Warning: Input type is not correct
     *
     */
    async getRankingOfUsers(limit: number): Promise<UserRanking> {
        const [output, ofiles] = await this.root.execute("admin.stats.getRankingOfUsers", limit)
        return output
    }

    /**
     * Get distribution of submissions by hour.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfSubmissionsByHour(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfSubmissionsByHour", data)
        return output
    }

    /**
     * Get distribution of submissions by proglang.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfSubmissionsByProglang(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfSubmissionsByProglang", data)
        return output
    }

    /**
     * Get distribution of submissions by compiler.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfSubmissionsByCompiler(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfSubmissionsByCompiler", data)
        return output
    }

    /**
     * Get distribution of submissions by weekday.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfSubmissionsByWeekday(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfSubmissionsByWeekday", data)
        return output
    }

    /**
     * Get distribution of submissions by year.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfSubmissionsByYear(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfSubmissionsByYear", data)
        return output
    }

    /**
     * Get distribution of submissions by year for a proglang.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfSubmissionsByYearForProglang(proglang: string): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute(
            "admin.stats.getDistributionOfSubmissionsByYearForProglang",
            proglang,
        )
        return output
    }

    /**
     * Get distribution of submissions by day.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfSubmissionsByDay(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfSubmissionsByDay", data)
        return output
    }

    /**
     * Get heatmap calendar of submissions.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getHeatmapCalendarOfSubmissions(data: DateRange): Promise<any> {
        const [output, ofiles] = await this.root.execute("admin.stats.getHeatmapCalendarOfSubmissions", data)
        return output
    }

    /**
     * Get distribution of domains of users' emails.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getDistributionOfDomains(data: SubmitQuizOut): Promise<Record<string, number>> {
        const [output, ofiles] = await this.root.execute("admin.stats.getDistributionOfDomains", data)
        return output
    }
}

/**
 *
 * No description yet
 *
 */
class Module_admin_problems {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Get list of proglangs for which the problem has an official solution.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getSolutions(problem_id: string): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("admin.problems.getSolutions", problem_id)
        return output
    }

    /**
     * Get official solution for a problem in proglang as a string in base64.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getSolutionAsB64(data: { problem_id: string; proglang: string }): Promise<string> {
        const [output, ofiles] = await this.root.execute("admin.problems.getSolutionAsB64", data)
        return output
    }

    /**
     * Get official solution for a problem in proglang as a file.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getSolutionAsFile(data: { problem_id: string; proglang: string }): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("admin.problems.getSolutionAsFile", data)
        return [output, ofiles[0]]
    }

    /**
     * Get summary for a problem.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getProblemSummary(problem_id: string): Promise<ProblemSummary | null> {
        const [output, ofiles] = await this.root.execute("admin.problems.getProblemSummary", problem_id)
        return output
    }

    /**
     * Get list of problems with summary.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getProblemsWithSummary(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("admin.problems.getProblemsWithSummary", data)
        return output
    }

    /**
     * Get list of problems without summary.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getProblemsWithoutSummary(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("admin.problems.getProblemsWithoutSummary", data)
        return output
    }

    /**
     * Get solution tags for an abstract problem.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getAbstractProblemSolutionTags(data: { problem_nm: string }): Promise<SolutionTags | null> {
        const [output, ofiles] = await this.root.execute("admin.problems.getAbstractProblemSolutionTags", data)
        return output
    }

    /**
     * Get list of abstract problems with solution tags.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getAbstractProblemsWithSolutionTags(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("admin.problems.getAbstractProblemsWithSolutionTags", data)
        return output
    }

    /**
     * Get list of abstract problems without solution tags.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async getAbstractProblemsWithoutSolutionTags(data: SubmitQuizOut): Promise<string[]> {
        const [output, ofiles] = await this.root.execute("admin.problems.getAbstractProblemsWithoutSolutionTags", data)
        return output
    }
}

/**
 *
 * Module with testing endpoints. Not meant for regular users.
 *
 */
class Module_testing {
    private readonly root: JutgeApiClient

    readonly check: Module_testing_check
    readonly playground: Module_testing_playground

    constructor(root: JutgeApiClient) {
        this.root = root
        this.check = new Module_testing_check(root)
        this.playground = new Module_testing_playground(root)
    }
}

/**
 *
 * This module is intended for internal use and contains functions to check the actor of the query. General public should not rely on it.
 *
 */
class Module_testing_check {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Checks that query actor is a user.
     *
     * 🔐 Authentication: user
     * No warnings
     *
     */
    async checkUser(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("testing.check.checkUser", data)
        return output
    }

    /**
     * Checks that query actor is an instructor.
     *
     * 🔐 Authentication: instructor
     * No warnings
     *
     */
    async checkInstructor(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("testing.check.checkInstructor", data)
        return output
    }

    /**
     * Checks that query actor is an admin.
     *
     * 🔐 Authentication: admin
     * No warnings
     *
     */
    async checkAdmin(data: SubmitQuizOut): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("testing.check.checkAdmin", data)
        return output
    }

    /**
     * Throw an exception of the given type.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async throwError(exception: string): Promise<SubmitQuizOut> {
        const [output, ofiles] = await this.root.execute("testing.check.throwError", exception)
        return output
    }
}

/**
 *
 * This module is intended for internal use. General users should not rely on it.
 *
 */
class Module_testing_playground {
    private readonly root: JutgeApiClient

    constructor(root: JutgeApiClient) {
        this.root = root
    }

    /**
     * Upload a file.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async upload(data: Name, ifile: File): Promise<string> {
        const [output, ofiles] = await this.root.execute("testing.playground.upload", data, [ifile])
        return output
    }

    /**
     * Get negative of an image.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async negate(data: SubmitQuizOut, ifile: File): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("testing.playground.negate", data, [ifile])
        return [output, ofiles[0]]
    }

    /**
     * Download a file.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async download(data: Name): Promise<[SubmitQuizOut, Download]> {
        const [output, ofiles] = await this.root.execute("testing.playground.download", data)
        return [output, ofiles[0]]
    }

    /**
     * Download a file with a string.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async download2(data: Name): Promise<[string, Download]> {
        const [output, ofiles] = await this.root.execute("testing.playground.download2", data)
        return [output, ofiles[0]]
    }

    /**
     * Ping the server to get a pong string.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async ping(data: SubmitQuizOut): Promise<string> {
        const [output, ofiles] = await this.root.execute("testing.playground.ping", data)
        return output
    }

    /**
     * Returns the given string in uppercase.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async toUpperCase(s: string): Promise<string> {
        const [output, ofiles] = await this.root.execute("testing.playground.toUpperCase", s)
        return output
    }

    /**
     * Returns the sum of two integers.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async add2i(data: TwoInts): Promise<number> {
        const [output, ofiles] = await this.root.execute("testing.playground.add2i", data)
        return output
    }

    /**
     * Returns the sum of two floats.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async add2f(data: TwoFloats): Promise<number> {
        const [output, ofiles] = await this.root.execute("testing.playground.add2f", data)
        return output
    }

    /**
     * increment two numbers.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async inc(data: TwoInts): Promise<TwoInts> {
        const [output, ofiles] = await this.root.execute("testing.playground.inc", data)
        return output
    }

    /**
     * Returns the sum of three integers.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async add3i(data: { a: number; b: number; c: number }): Promise<number> {
        const [output, ofiles] = await this.root.execute("testing.playground.add3i", data)
        return output
    }

    /**
     * Returns a type with defaults.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async something(data: SomeType): Promise<SomeType> {
        const [output, ofiles] = await this.root.execute("testing.playground.something", data)
        return output
    }

    /**
     * Get a webstream with clok data.
     *
     * 🔐 Authentication: any
     * No warnings
     *
     */
    async clock(data: SubmitQuizOut): Promise<WebStream> {
        const [output, ofiles] = await this.root.execute("testing.playground.clock", data)
        return output
    }
}
