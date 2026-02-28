# Quiz anatomy

This document describes the anatomy of a **quiz problem** in [Jutge.org](https://jutge.org/). It explains the terminology used, the structure of a quiz, and the purpose of each file. Quiz problems are a type of problem where users answer multiple-choice, fill-in, ordering, matching, or open-ended questions instead of submitting a program. Quiz questions and answers may be randomized for each run. For the general structure of a problem folder (e.g. `.pbm` extension, `problem.yml`, statement files), see [Problem anatomy](problem-anatomy.md).

## Terminology

A **quiz** is a problem whose handler is set to `quiz`. It is made of a **quiz root** and a list of **questions**. The quiz root is defined in `quiz.yml` and holds the quiz title, author, statement, whether questions are shuffled, and the list of questions with their scores. Each **question** is defined in a separate YAML file (e.g. `single-choice.yml`) and has a `type`: SingleChoice, MultipleChoice, FillIn, Ordering, Matching, or OpenQuestion.

Quiz content can be **localized**: the same quiz can have different `quiz.yml` and question files per language (e.g. under `en/` and `ca/`). The toolkit runs or lints the quiz for a given directory, so you typically run it from a language-specific subdirectory. Each language should live inside its own folder.

**Variable substitution** allows question text and options to depend on values generated at run time. If a question file is named `example.yml`, the toolkit looks for `example.py` in the same directory. When present, it runs the Python script with a random `seed` and collects the script’s global variables. Those variables can be referenced in the question YAML with `$name` or `${name}`. This makes it possible to have different numbers, strings, or options for each run while keeping the same correct answer logic (e.g. “What is $a + $b?” with `a` and `b` random).

**Scoring**: Each question has a `score` between 0–100, and the total of all question scores listed in `quiz.yml` must add up to 100. Users earn points for each question.

## Quiz structure

A quiz lives inside a problem folder (e.g. a `.pbm`). Each language should live inside its own folder (e.g. `en/`, `ca/`) .

Example with multiple languages:

```
problem_folder.pbm
├── en
│   ├── handler.yml
│   ├── quiz.yml
│   ├── some-question.yml
│   ├── some-question.py
│   └── ...
├── ca
│   ├── handler.yml
│   ├── quiz.yml
│   ├── some-question.yml
│   ├── some-question.py
│   └── ...
└── problem.yml
```

You run or lint the quiz from the directory that contains `quiz.yml` (e.g. `jtk quiz run -d en` or `cd en && jtk quiz run`).

`yml` files are YAML (YAML Ain't Markup Language) files. YAML is a human-readable data-serialization language; see [YAML documentation](https://yaml.org/) for more details. Also, see [YAML multiline info](https://yaml-multiline.info/) for more details on how to write multiline strings in YAML.

Many items are written in Markdown. See [Markdown documentation](https://www.markdownguide.org/) for more details. In addition, you can use a small subset of LaTeX for mathematical expressions but these have to be enclosed between `·` signs, not standard `$` signs.

## The `quiz.yml` file

The file `quiz.yml` defines the quiz root.

- `title`: Title of the quiz.
- `author`: Author of the quiz.
- `statement`: Short description or instructions shown for the quiz (Markdown).
- `questions`: List of question entries. Each entry has:
    - `title`: Title of the question (e.g. for display in a table of contents).
    - `file`: Base name of the question file, without the `.yml` extension (e.g. `question` for `question.yml`).
    - `score`: Integer from 0 to 100. The sum of all `score` values in the list must be 100.
- `shuffle` (optional): Whether to shuffle the order of questions when running the quiz. Defaults to `false`.

### Example

```yaml
title: Demo quiz

author: Jordi Petit

statement: This quiz showcases the possibilities of the quiz problems at Jutge.org.

shuffle: true

questions:
    - title: Single choice question
      file: single-choice
      score: 10

    - title: Multiple choice question
      file: multiple-choice
      score: 10

    - title: Fill in question
      file: fill-in-1
      score: 20

    - title: Ordering question
      file: ordering
      score: 10

    - title: Matchings question
      file: matchings
      score: 20
```

## Question types

Each question is stored in a YAML file whose name matches the `file` field in `quiz.yml` (e.g. `question.yml`). The file must contain a `type` field that identifies the kind of question. Variable substitution applies to text fields and options when a corresponding `.py` file exists. All question types support an optional `hide_score` (default `false`) and an optional `partial_answer` (default `false`).

The `partial_answer` option is set per question in the question YAML:

- If `partial_answer` is set to `false` (default), users get full points for that question only when their answer is completely correct; any mistake gives zero points for that question.

- If `partial_answer` is set to `true`, users can receive partial points for that question when the answer is partially correct (e.g. proportional to how many parts are right), and the response may still be marked as "correct" if at least one part is right.

The `hide_score` option is set per question in the question YAML. If set to `true`, the question score is not shown to the user.

### SingleChoice

One correct option among several. Exactly one choice must have `correct: true`. Choices can be shuffled (optional `shuffle`, default `true`). Each choice can have an optional `hint`. Duplicate choice text is not allowed.

- `text`: Question text (supports `$var` and `${var}`).
- `choices`: List of `{ text, correct?, hint? }`. One and only one choice must have `correct: true`.
- `shuffle` (optional): Whether to shuffle choices. Defaults to `true`.
- `partial_answer` (optional): Whether to award partial credit for this question. Defaults to `false`.

Example:

```yaml
type: SingleChoice

text: 'What is the result of the evaluation of `$a + $b`?'

choices:
    - text: '`$s1`'
      correct: true
      hint: 'You did well'
    - text: '`$s2`'
      hint: 'Sorry...'
    - text: '`$s3`'
```

Variables `a`, `b`, `s1`, `s2`, `s3` would be produced by a `single-choice.py` script in the same directory.

### MultipleChoice

Zero or more correct options. Multiple choices can have `correct: true`. Choices can be shuffled (optional `shuffle`, default `true`).

- `text`: Question text (supports variables).
- `choices`: List of `{ text, correct?, hint? }`.
- `shuffle` (optional): Whether to shuffle choices. Defaults to `true`.
- `partial_answer` (optional): Whether to award partial credit for this question. Defaults to `false`.

Example:

```yaml
type: MultipleChoice

text: 'Which of the following expressions are `true`?'

choices:
    - text: '`$s == $a + $b`'
      correct: true
    - text: '`$s != $a + $b`'
      hint: 'Sorry...'
    - text: '`$a + $b >= $s`'
      correct: true
```

### FillIn

One or more blanks in a text or code block. Each blank is identified by a placeholder (e.g. `S1`, `XXXX`) and has a correct answer and optional options (dropdown). If `options` are given, the correct answer must be one of them.

- `text`: Question or instructions (supports variables).
- `context`: Text containing placeholders (e.g. `S1`, `S2`, `XXXX`). Placeholders are the keys in `items`.
- `items`: Map from placeholder name to an item object:
    - `correct`: Correct answer (string).
    - `options` (optional): List of strings; if present, the blank is shown as a dropdown and `correct` must be in this list.
    - `maxlength` (optional): Max length for the answer. Defaults to 100.
    - `placeholder` (optional): Placeholder text in the input (e.g. `"?"`).
    - `ignorecase` (optional): Whether to ignore case when checking. Defaults to `true`.
    - `trim` (optional): Whether to trim spaces. Defaults to `true`.
    - `partial_answer` (optional): Whether this blank contributes to partial credit for the question. Defaults to `false`.
- `partial_answer` (optional, at question level): Whether to award partial credit for this question. Defaults to `false`.

Example with dropdowns:

```yaml
type: FillIn

text: 'Fill in the blanks.'

context: |
    A/An S1 is a self-contained step-by-step set of operations...
    A/An S2 is a collection of instructions...

items:
    S1:
        correct: algorithm
        options:
            - program
            - algorithm
            - pseudocode
    S2:
        correct: program
        options:
            - program
            - algorithm
```

Example with free-text blanks (e.g. numeric):

````yaml
type: FillIn

text: |
    Fill in the blanks of the given program.

context: |
    ```python
    def sum (L):
        s = XXXX
        for x in L:
            s = s YYYY x
        return s
    ```

items:
    XXXX:
        maxlength: 5
        correct: 0
    YYYY:
        correct: '+'
        options:
            - '+'
            - '-'
            - '*'
            - '/'
````

### Ordering

User must order a list of items (e.g. chronological order). Items can be shown in shuffled order (optional `shuffle`, default `true`).

- `text`: Question text (supports variables).
- `label`: Label for the list (e.g. “Programming language”).
- `items`: List of strings in the correct order.
- `shuffle` (optional): Whether to show items in random order. Defaults to `true`.
- `partial_answer` (optional): Whether to award partial credit for this question. Defaults to `false`.

Example:

```yaml
type: Ordering

text: Drag and drop the item to order the programming languages by date of appearance (older on top).

label: Programming language

items:
    - Fortran
    - C
    - C++
    - Python
    - Java
    - Julia
```

### Matching

Two columns: user matches each left item with one right item. Left and right lists can be shuffled (optional `shuffle`, default `true`).

- `text`: Question text (supports variables).
- `labels`: Two strings, e.g. `["Countries", "Capitals"]`.
- `left`: List of strings (e.g. countries).
- `right`: List of strings (e.g. capitals), in the same order as `left` (left[i] matches right[i]).
- `shuffle` (optional): Whether to shuffle left and right columns. Defaults to `true`.
- `partial_answer` (optional): Whether to award partial credit for this question. Defaults to `false`.

Example:

```yaml
type: Matching

text: Match the countries with their capitals.

labels:
    - Countries
    - Capitals

left:
    - France
    - Germany
    - Spain
    - Italy
    - Andorra

right:
    - Paris
    - Berlin
    - Madrid
    - Rome
    - Andorra la Vella
```

### OpenQuestion

Free-text answer with no automatic correction. Useful for open-ended or reflective answers.

- `text`: Question text (supports variables).
- `placeholder` (optional): Placeholder for the text area. Defaults to `""`. Supports variables.
- `partial_answer` (optional): Whether to award partial credit for this question. Defaults to `false`.

Example:

```yaml
type: OpenQuestion

text: Talk about yourself.

placeholder: 'My name is **$name** and I want to pass this course.'
```

The variable `name` can be set by an optional `open-ended.py` (or the same base name as the question file) in the same directory.

## Variable substitution (`.py` files)

If a question file is named `example.yml`, the toolkit looks for `example.py` in the same directory. When present:

1. The Python script is run with a given `seed` (passed as an argument by the toolkit) so that the run is reproducible.
2. The script’s global variables (that are JSON-serializable and whose names do not start with `__`) are collected.
3. In the question YAML, any string field that supports substitution can use `$name` or `${name}` to be replaced by the value of `name`.

This allows different runs to show different numbers or options while keeping the same correct answer (e.g. “What is $a + $b?” with `a` and `b` random and one choice `$s1 = a + b` marked correct).

Example `question.py`:

```python
import random

a = random.randint(1, 10)
b = random.randint(1, 10)

s1 = a + b
s2 = a + b - 1
s3 = a + b + 1
s4 = a - b
s5 = a * b
```

Used with a SingleChoice question where the correct answer is `$s1`, so each run has different numbers but the same structure.

## The `handler.yml` file

For a quiz problem, the problem’s `handler.yml` must set the handler to `quiz`:

```yaml
handler: quiz
```

Other handler options (e.g. `std`, `graphic`) are for non-quiz problems. See [Problem anatomy — handler.yml](problem-anatomy.md#the-handleryml-file) for the full list of handler and option descriptions.

## Linting, running and playing quizzes

From the toolkit CLI:

- `jtk quiz lint` — lint a quiz (validate `quiz.yml` and all referenced question YAML files):

    ```bash
    jtk quiz lint -d <directory>
    ```

    Use the directory that contains `quiz.yml` (e.g. the `en` subdirectory).

- `jtk quiz run` — run a quiz (build questions, apply variables, output JSON or YAML):

    ```bash
    jtk quiz run -d <directory> [-s <seed>] [-f json|yaml]
    ```

    If no seed is provided, a random one is used. Running the quiz applies variable substitution and, if `shuffle` is true, shuffles question order (and, per question, choices or ordering/matching items when their `shuffle` is true).

- `jtk quiz play` — play a quiz in the terminal:
    ```bash
    jtk quiz play -d <directory> [-i <input>] [-o <output>] [-s <seed>]
    ```
    If no seed is provided, a random one is used. Playing the quiz applies variable substitution and, if `shuffle` is true, shuffles question order (and, per question, choices or ordering/matching items when their `shuffle` is true).

## Quick checklist

- Use a problem folder with `handler: quiz` in `handler.yml`.
- Place `quiz.yml` in the root (single-language) or in a per-language subdirectory (e.g. `en/`, `ca/`).
- Ensure every `file` in `quiz.yml` has a corresponding `file.yml` in the same directory.
- Ensure question scores in `quiz.yml` sum to 100.
- For SingleChoice, set exactly one choice with `correct: true`.
- For FillIn with `options`, ensure `correct` is in the `options` list.
- For Matching, ensure `left` and `right` have the same length and are in matching order.
- Use variable names in `$name` / `${name}` that are produced by the optional `file.py` script; the script is run with the toolkit’s seed for reproducibility.
