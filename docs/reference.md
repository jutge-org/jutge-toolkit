# Jutge toolkit — command reference

This document describes the **jutge-toolkit**, which helps you **author, build, check, and publish programming problems** for [Jutge.org](https://jutge.org): a platform where students submit code that is automatically judged against test cases.

If you are new to the command line: you run commands in a **terminal** (also called a shell). You type the program name, then optional **subcommands** (verbs like `upload` or `make`), then **arguments** (things the command acts on), and **options** (flags like `-d` that change behavior). Options often have a short form (`-d`) and a long form (`--directory`); they mean the same thing.

---

## How to invoke the program

The same program is available under several names:

| Command         | Typical use                                            |
| --------------- | ------------------------------------------------------ |
| `jtk`           | Short alias; use this once installed.                  |
| `jutge-toolkit` | Full name; same as `jtk`.                              |
| `jtk-dev`       | Runs the toolkit from source during development (Bun). |

Examples in this document use **`jtk`**. Replace with `jutge-toolkit` if you prefer.

---

## Getting help

- **`jtk --help`** — Lists all top-level commands and global options.
- **`jtk help`** or **`jtk help <command>`** — Shows help for the main program or for a specific command (e.g. `jtk help make`).
- **`jtk <command> --help`** — Same idea for a single command (e.g. `jtk make --help`).

Global options on the main program:

- **`-V`, `--version`** — Print the toolkit version and exit.
- **`-h`, `--help`** — Show help.

More documentation: [toolkit docs on GitHub](https://github.com/jutge-org/new-jutge-toolkit/tree/main/docs).

---

## Problems and directories

Most commands work on a **problem directory**: a folder that contains your problem’s sources, statements, tests, and metadata (these must have a `.pbm` suffix in the name, e.g. `my-problem.pbm`). Many commands accept:

- **`-d`, `--directory <path>`** — Which folder to use.

The default is often the current directory `.`.

Paths can be relative (e.g. `.` or `../other-problem.pbm`) or absolute.

---

## Command overview (top level)

| Command                       | Purpose (short)                                                       |
| ----------------------------- | --------------------------------------------------------------------- |
| `make`                        | Build generated files (executables, statements, correct outputs, …).  |
| `upload`                      | Send the problem to Jutge.org (create or update).                     |
| `remove`                      | Delete the problem from Jutge.org (when allowed).                     |
| `share`                       | Control sharing (passcode, testcases, solutions) and email passcodes. |
| `clean`                       | Remove disposable/generated files from disk.                          |
| `clone`                       | Create a new problem from a template.                                 |
| `download`                    | Fetch an existing problem from Jutge.org into a folder.               |
| `generate`                    | Use JutgeAI to generate or extend problem content.                    |
| `verify`                      | Check that candidate solutions match the golden solution on tests.    |
| `lint`                        | Validate problem configuration and files.                             |
| `metrics`                     | Print code metrics for source files.                                  |
| `submit`                      | Submit solutions to Jutge.org as a student would.                     |
| `convert`                     | One-off conversions (e.g. statement LaTeX syntax).                    |
| `stage`                       | Prepare a “staged” view of the problem for packaging or checks.       |
| `doctor`                      | Check that compilers and tools are installed on your machine.         |
| `config`                      | Read or edit toolkit configuration (name, email, AI model, …).        |
| `upgrade`                     | Update the toolkit to the latest version.                             |
| `completion`                  | Install or print shell tab-completion scripts.                        |
| `about`                       | Show version, authors, and links.                                     |
| `ask`                         | Ask questions about the toolkit via JutgeAI (needs login).            |
| `for-dummies` / `interactive` | Guided menus for users who prefer not to type commands.               |

The sections below describe each command in more detail.

---

## `make`

**Purpose:** **Build** everything needed for a problem locally: compile solutions, generate **correct outputs** (`.cor`) for test cases, build **PDF/HTML/Markdown/text** statements, and so on. This is the main “compile my problem” command while you are editing it.

**Arguments:**

- **`[tasks...]`** — What to build. If omitted, defaults to **`all`**. You cannot combine `all` with other task names.

**Tasks:**

| Task                | Meaning                                                   |
| ------------------- | --------------------------------------------------------- |
| `all`               | Full build (default).                                     |
| `info`              | Problem metadata (largely covered during initialization). |
| `exe`               | Build executables / solution binaries as needed.          |
| `cor`               | Generate correct outputs for test cases.                  |
| `pdf`               | Build PDF statements.                                     |
| `txt`, `md`, `html` | Build full and short textual statements in those formats. |

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`). Can resolve to multiple problem folders when the path expands that way.
- **`-i`, `--ignore-errors`** — If something fails in one directory, log the error and continue with others (default: false).
- **`-e`, `--only-errors`** — In the final summary, only list directories that had errors (default: false).
- **`-p`, `--problem_nm <id>`** — Problem identifier to use when needed (default: `DRAFT`).
- **`-w`, `--watch`** — **Watch** files for changes and rebuild incrementally. Experimental: only the first directory is watched if several are given; quiz/game handlers may not benefit. While watching, you can use key shortcuts (e.g. full rebuild, lint, quit) as shown in the terminal.

---

## `upload`

**Purpose:** **Publish** your problem to Jutge.org. If `problem.yml` already exists, the problem is **updated** using that metadata (including its id). If there is no `problem.yml`, a **new** problem is created and `problem.yml` is written for you.

**Tip:** Run **`clean`** first so you do not upload unnecessary build artifacts (unless you intend to).

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).

---

## `remove`

**Purpose:** **Remove** a problem **from the server** (not only delete local files). Only problems with **few submissions** can be removed; Jutge.org enforces this. On success, local **`problem.yml`** is deleted.

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).
- **`-y`, `--yes`** — Do not ask for confirmation.

---

## `share`

**Purpose:** Manage **who can see what** for a problem on Jutge.org: passcode, sharing **test cases**, sharing **solutions**. The command syncs with the server, applies your changes, then refreshes **`problem.yml`** and shows the result.

### `share` (default)

Runs the update flow with optional flags:

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).
- **`--passcode [code]`** — Set a passcode; if you omit `code`, you are prompted securely.
- **`--no-passcode`** — Remove the passcode.
- **`--testcases`** — Enable sharing test cases.
- **`--no-testcases`** — Stop sharing test cases.
- **`--solutions`** — Enable sharing solutions.
- **`--no-solutions`** — Stop sharing solutions.

### `share show`

**Purpose:** Display current sharing settings **without** changing them.

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).

### `share with`

**Purpose:** **Email** the passcode to Jutge.org users by address. Invalid or unknown addresses are skipped; valid users get the passcode on their account and an informational email.

**Arguments:**

- **`<emails...>`** — One or more email addresses.

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).
- **`-t`, `--text <text>`** — Extra text included in the email (default: empty).

---

## `clean`

**Purpose:** **Delete disposable files** in a problem directory: build artifacts, toolkit temp files, object files, etc. Use **`--all`** to also remove generated statements and correct outputs (more aggressive).

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).
- **`-a`, `--all`** — Include generated statements and `.cor` files, etc. (default: false).
- **`-f`, `--force`** — Delete listed files **without** asking for confirmation (cannot be used together with `--dry-run`).
- **`-n`, `--dry-run`** — Described in `jtk clean --help` as listing candidates without removing them; cannot be used together with `--force`. _If in doubt, run without `--force`: the tool lists what it would remove and asks you to confirm before deleting._

---

## `clone`

**Purpose:** **Create a new problem folder** from a **template** (starter structure and config). If you omit the template name, the tool guides you interactively.

**Arguments:**

- **`[template]`** — Template name (optional; interactive if omitted).

**Options:**

- **`-d`, `--directory <path>`** — Where to create the problem (default: `new-problem.pbm`).

---

## `download`

**Purpose:** **Download** a problem you have access to on Jutge.org into a local `.pbm` directory.

**Arguments:**

- **`<problem_nm>`** — Server-side problem name / id.

**Options:**

- **`-d`, `--directory <path>`** — Output folder. If omitted, defaults to **`<problem_nm>.pbm`**. Must end with **`.pbm`**.

---

## `generate`

**Purpose:** Use **JutgeAI** (requires being logged in to Jutge) to generate drafts: full problems, translations, statements from code, alternative solutions, mains, test generators, or award assets.

Running **`jtk generate`** with no subcommand prints help.

### `generate problem`

**Purpose:** Create a **new** problem directory from a specification, using AI. Treat the result as a **draft** to edit by hand afterward.

**Kinds:**

- **`io`** — Classic stdin/stdout problems (several languages supported).
- **`funcs`** — Implement-one-or-more-functions style (Python, Haskell, Clojure via specific compilers).

**Options:**

- **`-k`, `--kind <kind>`** — `io` or `funcs` (default: `io`).
- **`-d`, `--directory <path>`** — Output directory; must end with **`.pbm`** and must not exist.
- **`-i`, `--input <path>`** — Read specification from a file.
- **`-o`, `--output <path>`** — Write the specification to a file.
- **`-n`, `--do-not-ask`** — Non-interactive when combined with `--input` (default: false).
- **`-m`, `--model <model>`** — AI model id (default: from settings).

### `generate translations`

**Purpose:** Add **statement translations** for given natural languages. May overwrite existing translation files.

**Arguments:**

- **`<languages...>`** — Language codes (e.g. `en`, `ca`, `es`, `fr`, `de`).

**Options:**

- **`-d`, `--directory <path>`** — Problem directory (default: `.`).
- **`-m`, `--model <model>`** — AI model (default: from settings).

### `generate statement`

**Purpose:** Generate a **`problem.<lang>.tex`** statement from an existing **solution**, using AI.

**Arguments:**

- **`<proglang>`** — Solution language key (e.g. `cc`, `py`, `hs`, …).
- **`<language>`** — Target statement language (e.g. `en`, `ca`).
- **`[prompt]`** — Optional extra instructions for the AI.

**Options:**

- **`-d`, `--directory <path>`** — Problem directory (default: `.`).
- **`-m`, `--model <model>`** — AI model (default: from settings).

### `generate solutions`

**Purpose:** Add **alternative solutions** in other programming languages, using the golden solution as reference. May overwrite files.

**Arguments:**

- **`<proglangs...>`** — One or more language keys (e.g. `py`, `java`, `rs`).

**Options:**

- **`-d`, `--directory <path>`** — Problem directory (default: `.`).
- **`-m`, `--model <model>`** — AI model (default: from settings).

### `generate mains`

**Purpose:** Generate **main** entry files for languages where the student implements functions/classes (not a full program).

**Arguments:**

- **`<proglangs...>`** — Target languages.

**Options:**

- **`-d`, `--directory <path>`** — Problem directory (default: `.`).
- **`-m`, `--model <model>`** — AI model (default: from settings).

### `generate generators`

**Purpose:** Generate **Python test-case generator** scripts (random, hard, efficiency).

**Options:**

- **`--random`** — Generator for random tests.
- **`--hard`** — Generator for hard tests.
- **`--efficiency`** — Generator for efficiency tests.
- **`--all`** — All three.
- **`-d`, `--directory <path>`** — Problem directory (default: `.`).
- **`-o`, `--output <path>`** — Output filename pattern (default: `generator-{{type}}.py`).
- **`-m`, `--model <model>`** — AI model (default: from settings).

### `generate award.png`

**Purpose:** Generate an **award image** (shown when a user solves the problem) via an image model.

**Arguments:**

- **`[prompt]`** — What to depict; if empty, a default prompt is used.

**Options:**

- **`-d`, `--directory <path>`** — Problem directory (default: `.`).
- **`-m`, `--model <model>`** — Image model (default: `openai/dall-e-3`).

### `generate award.html`

**Purpose:** Generate a short **award message** (HTML) for successful solvers.

**Arguments:**

- **`[prompt]`** — Instructions for the message (default prompt is built in).

**Options:**

- **`-d`, `--directory <path>`** — Problem directory (default: `.`).
- **`-m`, `--model <model>`** — AI model (default: from settings).

---

## `verify`

**Purpose:** Check that **candidate solutions** (e.g. `solution.py`, `alt.cc`) produce the **same outputs** as the **golden** solution on the problem’s tests—without submitting to the website.

**Arguments:**

- **`<programs...>`** — Solution filenames to verify.

**Options:**

- **`-d`, `--directory <path>`** — Problem directory (default: `.`).

---

## `lint`

**Purpose:** **Validate** your problem folder: configuration (`handler.yml`, schemas, …) and related rules. Use this to catch mistakes before **`make`** or **`upload`**.

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).
- **`-v`, `--verbose`** — Also show checks that passed.

Exit code is non-zero if there are **errors** (warnings alone may still pass depending on implementation).

---

## `metrics`

**Purpose:** Print **multimetric “overall”** complexity-style metrics for the given **source files** (useful for reviewing student or solution code). This is **not** the same as `lint`; it analyzes listed files.

**Arguments:**

- **`<files...>`** — One or more source file paths (required).

---

## `submit`

**Purpose:** **Submit** programs to Jutge.org **as if you were a student**, to see verdicts (useful for authors testing their own problem). Uses login and browser integration as configured.

**Arguments:**

- **`<programs...>`** — Files to submit (e.g. `solution.cc` `slow.py`).

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).
- **`-c`, `--compiler <id>`** — Compiler id (default: `auto` — detect from file extension).
- **`-l`, `--language <code>`** — Statement/UI language (e.g. `ca`, `es`, `en`; default: `en`).
- **`-n`, `--no-wait`** — Do not wait for judging to finish.
- **`--no-browser`** — Do not open the submission page in a browser; still prints URL and/or waits in the terminal depending on other flags.
- **`-a`, `--annotation <text>`** — Label for the submission (default: auto-generated `jtk-submit-…`).

---

## `convert`

**Purpose:** **Migrate** old statement markup to new formats. With no subcommand, prints help.

### `convert transform-at-signs`

**Purpose:** In each `problem.<lang>.tex`, replace legacy **`@code@`** inline markers with LaTeX **`\lstinline|...|`**. Backs up the original as `problem.<lang>.tex.original.bak` when changes are made.

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).

---

## `stage`

**Purpose:** **Stage** the problem: prepare a layout suitable for packaging or further processing (implementation details depend on the stager). Authors use this as a step before distribution or checks.

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).
- **`-p`, `--problem_nm <id>`** — Problem id (default: `DRAFT`).

---

## `doctor`

**Purpose:** **Diagnose your machine**: check that interpreters, compilers, and tools the toolkit may call (Python, GCC, Haskell, Clojure, Java, Rust, Verilog, R, CodeMetrics, XeLaTeX, Pandoc, terminal capabilities) are installed and usable. Use this when **`make`** or **`verify`** fails and you suspect a missing dependency.

No arguments or options at the top level.

---

## `config`

**Purpose:** Manage **toolkit settings** stored in a YAML file (path is printed when you run `jtk config --help` or `config show`). Typical keys include your **name**, **email**, **default AI model**, **notifications**, and **developer** flag.

Running **`jtk config`** with no subcommand prints help.

### `config show` (alias: `config list`)

**Purpose:** Print the full configuration as YAML.

### `config get <key>`

**Purpose:** Print a **single** setting value.

### `config set <key> <value>`

**Purpose:** Set a key. Values are parsed (booleans, numbers, strings) automatically.

### `config edit`

**Purpose:** Open the configuration in your **editor** (`$EDITOR` or `$VISUAL`). Invalid YAML/schema errors are reported; you can retry or cancel.

### `config reset`

**Purpose:** Restore **defaults**.

**Options:**

- **`-f`, `--force`** — Skip confirmation.

---

## `upgrade`

**Purpose:** **Update** the installed toolkit to the **latest** version (mechanism depends on how you installed the package).

No arguments or options.

---

## `completion`

**Purpose:** **Tab completion**: print scripts or install them so your shell can suggest `jtk` subcommands and options when you press Tab.

Running **`jtk completion`** with no subcommand prints help.

### `completion bash` | `completion zsh` | `completion fish` | `completion powershell`

**Purpose:** Print the completion script for that shell to **stdout** (you can save it manually).

### `completion install [shell]`

**Purpose:** **Install** completion for the current shell, or for a named shell: `bash`, `zsh`, `fish`, or `powershell`. May create or update files under your home directory and print **restart** or **source** instructions.

---

## `about`

**Purpose:** Show the toolkit **version**, **description**, **homepage**, **authors**, **contributors**, and a link to documentation.

No arguments or options.

---

## `ask`

**Purpose:** Ask a **natural-language question** about the toolkit; answers are generated by **JutgeAI** using bundled docs and source as context. **Not authoritative**—use for hints; verify against this reference and official docs.

**Arguments:**

- **`[question]`** — Your question (optional; can be empty in edge cases).

**Options:**

- **`-m`, `--model <model>`** — AI model (default: from settings).

Requires **login** to Jutge like other AI features.

---

## `for-dummies` / `interactive`

**Purpose:** **Interactive menus** that walk you through choosing a command and entering arguments/options via prompts—useful if you do not remember command names or prefer not to type flags.

No required arguments; the command navigates subcommands of the main program and then runs the selected tool.

---

## `quiz`

**Purpose:** Work with **quiz** handler problems (different from standard stdin/stdout tasks).

Running **`jtk quiz`** with no subcommand prints help.

### `quiz lint`

**Purpose:** Run **quiz-specific** checks in the problem directory.

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).

### `quiz run`

**Purpose:** **Execute** the quiz and print the resulting object (random seed if not given).

**Options:**

- **`-d`, `--directory <directory>`** — Problem directory (default: `.`).
- **`-s`, `--seed <seed>`** — Random seed (integer).
- **`-f`, `--format <format>`** — `json` or `yaml` (default: `json`).

### `quiz play`

**Purpose:** **Interactive** quiz session: answer questions, optionally review, then see results. Input can be a JSON file from **`quiz run`**, or a new run from a directory.

**Options:**

- **`-i`, `--input <file>`** — JSON from `quiz run`.
- **`-o`, `--output <file>`** — Write results (answers, correctness, scores).
- **`-d`, `--directory <directory>`** — Used when `--input` is omitted (default: `.`).
- **`-s`, `--seed <seed>`** — Used when `--input` is omitted.

---

## Configuration keys (reference)

These are the settings keys defined in the toolkit schema (see `jtk config show`):

| Key             | Meaning                                                         |
| --------------- | --------------------------------------------------------------- |
| `name`          | Display name (default placeholder in schema).                   |
| `email`         | Your email (for identification / account-related features).     |
| `defaultModel`  | Default AI model id for `generate`, `ask`, etc.                 |
| `notifications` | Toggle notifications (meaning depends on platform integration). |
| `showPrompts`   | Whether to show prompts in interactive flows.                   |
| `showAnswers`   | Whether to show answers in teaching/quiz-style flows.           |
| `developer`     | Enable extra commands (`quiz`, `compilers`).                    |
