# Problem anatomy (WORK IN PROGRESS)

This document describes the anatomy of a common problem in [Jutge.org](https://jutge.org/). It explains the terminology used, the structure of a problem folder, and the purpose of each file that may be present in it.

## Terminology

A **problem** is a programming exercise meant to be solved by writing a program. All the elements of a problem are stored in a problem folder. Problems are meant to be uploaded to [Jutge.org](https://jutge.org/) where users can submit their solutions to be evaluated. The New Jutge Toolkit is a command line app to create, manage and maintain problems.

The task of the problem is described in the **problem statement**. Problem statements may be available in several human languages (Jutge.org currently supports Catalan, Spanish, French, German and English). One of them is considered the **original language** of the problem, and the others are considered **translations**. Problem statements are written in LaTeX format and are processed to generate PDF, HTML, Markdown and Text files that are shown to users. Problem statements may include text, maths, figures, code snippets, test cases, etc. Jutge.org provides LaTeX macros to organize and facilitate the writing of problem statements.

A problem contains a **golden solution**, which is a program that solves the problem correctly. The golden solution is used to generate the correct outputs for the test cases of the problem. A problem may also contain several alternative solutions in different programming languages. When a user submits a solution to a problem in some programming language, the system selects the most appropriate solution to evaluate the submission against.

A problem contains several **test cases**, each consisting of an input file and a correct output file. The test cases are used to evaluate the correctness of user submissions. Some test cases are **public** and are shown to users, while others are **private** and are hidden from users. Public test cases may be marked as **sample** test cases and are included in the problem statement to illustrate the input/output format and clarify the problem. The correct output file for each input test case is generated automatically by running the golden solution on that input file. Alternative solutions are checked against the test cases to ensure they produce the same outputs as the golden solution.

Test cases are usually written by hand or generated using **test cases generators**. A test case generator is a program that produces input files for test cases, often using randomization or specific patterns to cover different scenarios. Generator programs help create a diverse set of test cases that thoroughly test the correctness and efficiency of user submissions.

By default, the correctness of user submissions is evaluated by comparing their output files with the correct output files bit per bit. However, some problems may use custom **checkers** to evaluate the correctness of submissions. A checker is a program that takes the input file, the user's output file, and the correct output file as input and produces a verdict (Accepted, Wrong Answer, Presentation Error, etc.) based on specific criteria defined for the problem.

Some problems may include **scoring** information, which specifies how many points are awarded for passing certain test cases or groups of test cases. This allows problems to have partial credit for submissions that pass some but not all test cases.

Most problems are meant to be solved by a complete program that reads from standard input and writes to standard output. However, some problems may require users to implement specific functions or methods that will be called by a provided **main program**. In such cases, the problem specifies the function signature and behavior that users must implement. In addition, some problems may provide a **code template**, which is a code skeleton that users can fill in with their own implementation. This might be helpful to guide users on how to structure their solution, to provide utility functions or to check they are able to integrate their code correctly.

A certain class of programming languages can have their input test cases be replaced by expressions that are evaluated directly rather than read. This is the case for the RunPython, RunHaskell or RunClojure programming languages.

A problem may also contain **awards**, which are images and text that users receive when they solve the problem for the first time. These awards are meant to motivate users and recognize their achievements.

## Problem structure

A problem is a folder with `.pbm` extension that can be structured in two ways:

- Method 1: test cases and solutions are the same for all human languages (**preferred**)

    ```
    └── problem_folder.pbm
        ├── problem.yml
        ├── handler.yml
        ├── problem.ca.tex
        ├── problem.ca.yml
        ├── problem.en.tex
        ├── problem.en.yml
        ├── sample.inp
        ├── sample.cor
        ├── solution.cc
        └── ...
    ```

- Method 2: different test cases or solutions for different human languages (**discouraged**)

    ```
    └── problem_folder.pbm
        ├── ca
        |	├── handler.yml
        |	├── problem.ca.tex
        |	├── problem.ca.yml
        |	├── sample.inp
        |	├── sample.cor
        |	├── solution.cc
        |	└── ...
        ├── en
        |	├── handler.yml
        |	├── problem.en.tex
        |	├── problem.en.yml
        |	├── sample.inp
        |	├── sample.cor
        |	├── solution.cc
        |	└── ...
        └── problem.yml
    ```

The above structures are just two examples of the structure that a problem can have and therefore should only be considered as a guideline. The purpose of all the files is explained later on this file.

The first method is preferred whenever possible, as it avoids duplication of files and is easier to maintain. The second method is discouraged and should be used only when absolutely necessary, for instance when the test cases or the solutions differ between languages.

## Problem files TODO

A problem should contain the following files:

- `solution.*`: One or more solutions to the problem in different languages. See [Solutions](#solutions) for more information.
- `handler.yml`: Contains the information of how to handle the problem. See [Handler](#handler) for more information.
- `tags.yml`: Contains all the tags associated to the problem as a YAML list of words. Only for instructors, can be left empty. See [Tags](#tags) for more information.
- `*.inp`: All the input test sets. See [Test cases](#test-cases) for more information.
- `*.cor`: All the correct files. Those are generated automatically by the toolkit from the `solution.*` file. See [Test cases](#test-cases) for more information.
- `problem.lang.tex`: Statement LaTeX file for language `lang`. See [Problem statement](#problem-statement) for more information.
- `problem.lang.yml`: Contains the problem information in language `lang`. See [Problem metadata](#problem-metadata) for more information.
- `problem.lang.pdf`: Formatted PDF statement for language `lang`. These are generated automatically by the toolkit.

Additionally, the problem can contain the following optional files:

- `award.png`: Image of the award users will obtain when they get the problem accepted for the first time. See [Awards](#awards) for more information.
- `award.html`: HTML description of the award users will obtain when they get the problem accepted for the first time. See [Awards](#awards) for more information.
- `code.*`: Code provided in the problem to users that is given as a solution template (a function with blanks to be filled, for example).
- `distiller.yml`: File used to specify the parameters of the distillation process. See [Distilled test cases](#distilled-test-cases) for more information.
- `scores.yml`: File that describes the scoring of a problem. See [Scoring](#scoring) for more information.
- `*.ops`: File used to specify some limits for the correction of the problem. See [Test options](#test-options) for more information.

## Problem statement

Problem statement are stored in LaTeX files named `problem.lang.tex`, where `lang` denotes the ISO 639-1 code of the language for which the metadata is given (`ca`, `en`, `es`, `fr`, `de` currently). Problem statements make use of certain macros defined by [Jutge.org](https://jutge.org/).

### Structure

The typical structure of a problem statement is the following:

```latex
\Problem{The title of the problem using LaTeX}

\Statement

This section provides the statement of the problem.

\medskip

Different paragraphs should be separated by the \medskip command.

\Input

This section describes the input of the problem.

\Output

This section describes the output of the problem.

\Sample

```

The `\Sample` section will be automatically replaced to contain the sample test cases. Alternatively, it is possible to adjust the formatting of the sample test cases: `\SampleOneCol` places input and output test cases one below the other, while `\SampleTwoCol` places them side by side.

`RunPython` users should use `\SampleSession` to get their sample test cases properly formatted as interactive Python sessions. [CHECK]

The title inside the `\Problem{}` macro should match the title in the metadata given in the `problem.lang.yml` file, but the title on the LaTeX file can contain math or LaTeX macros.

### Figures

Figures can be inserted using the `\FigureL`, `\FigureC` and `\FigureR` macros, which stand for _left_, _center_ and _right_ respectively. These macros have two parameters:

1. The formatting of the figure (as in `\includegraphics[...]`).

2. The filename of the figure, with no extension. The figure should exist in JPG or PNG format [CHECK]. The use of SVG format might be possible [CHECK]. The use of EPS format is deprecated.

For instance, `\FigureR{width=4.5cm}{image}` will place figure `image` to the right with a width of 4.5 centimeters.

### Quotes

In order to enclose texts between quotes, please use the `\q{...}` (single quotes), `\qq{...}` (double quotes) or `\uq{...}` (no quotes, but same style) macros. [TODO: we have to honor/improve this]

### Code

The `lstlisting` macros may be used in order to include code. Short snippets of code can be written between `@` signs [CHECK].

By default, C++ style is used. It may be changed using standard `lstlisting` definitions. The `\UseHaskell` and `\UsePython` macros are shortcuts to use Haskell or Python styling respectively.

### Scoring

For problems with partial scoring based on passing test cases, use the `\Scoring` macro followed by an explaination of the scoring method (for example, how many points each test case is worth).

### Other sectioning macros

There exist a few other macros that may be used in various situations. Their effect should be straightforward:

- `\Precondition`
- `\Observation`
- `\Observations`
- `\Specification`
- `\Interface`
- `\Hint`
- `\Scores` [CHECK]
- `\Tuples`
- `\ObservationElastic`
- `\ObservationElasticII`
- `\ObservationNoMain`
- `\ObservationNoMainPlural`
- `\ObservationNoMainTuples` [CHECK]
- `\ObservationNoMainTuplesPlural` [CHECK]
- `\ObservationNoMainClasses` [CHECK]

### Other macros

The `\CPP` macro prints C++ in a beautiful way.

The `\Link{...}` macro provides an hyperlink to another problem (without specified language), e.g., `\Link{P68688}`.

## Problem metadata

Problem metadata is stored using YAML syntax in files named `problem.lang.yml`, where `lang` denotes the ISO 639-1 code of the language for which the metadata is given (`en`, `es`, `ca`, ...).

In the case that `lang` denotes the original language of the problem, `problem.lang.yml` should contain the following fields:

- `title`: Title of the problem in the original language.
- `author`: Full name of the problem setter.
- `email`: Email of the problem setter.

If `lang` denotes a translation, `problem.lang.yml` should contain the following fields:

- `translator`: Full name of the problem translator.
- `title`: Title of the problem in the translated language.
- `translator_email`: Email of the problem translator.
- `original_language`: Code for the original language of the problem.

A problem should have one unique original language and may have several translations. All translations should refer to the same original language. The system will find the original author through it.

All the values for the metadata fields should be given as Unicode based plain text. Remember to enclose them in quotes if they contain special characters such as `:` or `'`.

### Examples

`problem.ca.yml`:

```yml
title: Suma de dos enters
author: Jordi Petit
email: jpetit@somewhere.mail.com
```

`problem.en.yml`:

```yml
title: Sum of two integer numbers
translator: Carlos Molina
translator_email: cmolina@somewhere.mail.com
original_language: ca
```

## The `problem.yml` file

Once a problem is uploaded to [Jutge.org](https://jutge.org/), a `problem.yml` file is automatically created in the root of the problem folder. This file contains metadata about the problem that is used by the system. The fields of this file should not be modified by hand. In it, you will find fields such as the problem identifier (eg, X12345), its passcode, the time of creation, and the time of the last modification. Importantly, the presence of this file indicates that the problem has already been uploaded to [Jutge.org](https://jutge.org/).

If you are creating a problem from a copy of an existing problem, be sure to delete the `problem.yml` file before uploading it to [Jutge.org](https://jutge.org/) to not interfere with the existing problem.

## Handler TODO

The file `handler.yml` contains the information of how to handle the problem using YAML syntax. These options will tell the toolkit how to compile the problem. The handler must have two options:

- `handler`: `std` (default option) and `graphic` (used by some Python3 problems).
- `source_modifier`: `none` (default option), `structs` (C++ problems that use structs), `no_main` (problems where only a function is requested, in that case you will need to use the optional option `func_name`).

There are also optional arguments that may be used:

- `checker`: Option that will tell [Jutge.org](https://jutge.org/) how to compare the user's program output with the problem solution. See [Checker](#checker) for more information.

- `compilers`: Compiler that [Jutge.org](https://jutge.org/) will use to correct the problem. If specified, this will be the only compiler available on the website if an user wants to send his submission. You will find a list of available compilers in https://jutge.org/documentation/compilers.

- `func_name`: Name of the function requested in case the problem only asks for a function (this must be used along with `source_modifier: no_main`)

- `invisible_main`: If set to `1`, the `main.cc` file will not be provided to users. This is used by problems that do not require to write a `main` function.

- `presentation_error`: If set to `1 ` (by default), the PE (Presentation Error) verdict will be enabled. Otherwise, the verdict will be WA (Wrong Answer) if the files are not identical.

- `solution`: Programming language of the solution that will be used to generate the correct output test cases. By default, if a compiler is specified under `compilers` it will use that language. Otherwise, it will use the C++ solution.

- `pylibs`: Problems in Python can allow the usage of certain non standard Python libraries. `pylibs` is a list of libraries that may be used to solve the current problem. For instance, `pylibs: [numpy, networkx]`. By default, this list is empty. Available libraries are in https://jutge.org/documentation/pylibs.

By default, the content of `handler.yml ` should be like this:

```
handler: std
source_modifier: none
```

### Limiting the maximum time a submission can take

There are two arguments that can be used to determine the maximum time that a submission can take depending on the time the solution took to solve the problem. The submission will have a maximum time to complete the task which is calculated with the following function:

`Maximum submission time: solution_time * time_factor + time_constant.`

`time_factor` and `time_constant` are arguments that can be specified on the `handler.yml` file. They are a list with a maximum of three values, one for each type of compilers in the following order:

- Fast: Ada, C, C++, D, Fortran, Go, Haskell, Pascal
- Medium: FreeBASIC, C#, Java, Guile
- Slow: Brainfuck, Erlang, JavaScript, CLISP, Lua, PHP, Perl, Python, R, Ruby and Whitespace

If one or two values are missing, they will be calculated using the following formulas: `medium = fast * 5`; `slow = medium * 2`. This applies for both `time_factor` and `time_constant` arguments.

If the arguments have not been specified, the default `time_factor` and `time_constant` values for all the compilers will be `2` and `0.1` respectively.

This is an example of how the arguments would look like in `handler.yml `:

```handler.yml
time_factor: [2, 10, 2]
time_constant: [0.1, 0.01, 0.05]
```

## Test cases

Each test case `test` is described through two files: `test.inp` and `test.cor`.

`test.inp` contains the input of the test case and `test.cor` contains the correct output of the case. In addition, `test` can also make use of a `test.ops` file to describe some options for its correction.

Test case names should be made of letters, digits, dashes and underscores. Do not use special characters in them. Test cases whose name starts with `sample`, `public`, `hint` or `distilled` have an special meaning and will be explained later on. In the case several of these must be present, they often get names such as `sample-1`, `sample-2`, or `sample-short`.

At correction time, public test cases are corrected before the private ones. The cases are processed sequentially, ordered by their name.

As correcting each single test case causes some overhead, it is not advisable to have many different test cases. 20 different test cases may be a reasonable limit.

Input and output test cases should follow these rules:

- They only contain common characters: digits, uppercase and lowercase letters, punctuation ... (specifically those with ASCII codes between 32 and 126, plus the newline). So, no accents such as `À` or `ü`, no characters such as `ç`, `Δ`, `市` or `😊`, and no tabs.

- All lines should end with a newline character (`\n`), including the last line.

In addition, these rules should be taken into account in the output files:

- There must be no spaces before a line break. In particular, there must be no lines with only one or more spaces before the line break.

### Sample test cases

Sample test cases start with `sample` and will be revelaed to users in the problem statement. As such, they should make clear the format of the input and the output for the problem and should be reasonably short.

#### Public test cases

Public test cases start with `public` and will be revelead to users, but will not be shown in the problem statement. Usage of public test cases should be rare, but can be useful in situations where long input/output samples must be delivered.

#### Hint test cases

Hint test cases start with `hint` and will be revealed to users if the submission is not accepted (unless some sample test case also fails).

#### Distilled test cases

Distilled test cases start with `distilled` and will be shown to users whose submission fails on them (unless some sample or hint test case also fails). Distilled test cases are created by the system using the [Distiller Algorithm](http://upcommons.upc.edu/handle/2117/28174) and are added automatically to the problem directory, they are not mean to be created or modified by hand.

File `distiller.yml` is used to specify the parameters of the distillation process. `distillation.yml` is used to get some statistics form the distillation process.

Unfortunately, the distillation process requires some hand work and is not currently fully automated.

### Test options

The `test.ops` file can be used to specify some limits for the correction of the corresponding test case. The options should be written as if they were arguments of a program, with a space between each other. The following options are available:

- `--verbose`: Sets the verbose output level. It has three options: `0` (quiet), `1` (normal) and `2` (all the information).

- `--maxtime`: Sets maximum execution time. It has three values: `cputime`, `limtime` and `clktime`. You can specify only the `cputime`, the `cputime` and the`limtime` or all of them.
    - `cputime` is the maximum time that the program has to use the CPU (processing instructions).

    - `limtime` is the maximum CPU time limit. If not specified, `limtime` will be `cputime+1.5`.

    - `clktime` is the maximum clock time (total time) the program has to run. If not specified, `clktime` will be three times `limtime`.

- `--maxmem`: Set max memory in MB. It has two values: `maxmem` and `maxstack`. `maxmem` is the maximum amount of memory that the program is allowed to use. `maxstack` is the maximum amount of `maxmem` that can be used for the stack. If the `maxstack` is not specified, it will be the same as `maxmem`.

- `--maxfiles`: Sets the maximum number of files that can be open simultaneously.

- `--maxprocs`: Sets the maximum number of processes that the program is allowed to create.

- `--maxoutput`: Sets the maximum file size in MB of the output generated by the program.

- `--maxcore`: Sets the maximum file size in MB of the core file (generated if the program crashes).

- `--basename`: Sets the base name of the input test set.

- `--stdout`: Set path of the output (`.out`) file. If not specified, the output name will be `basename.out`.

- `--stdin`: Set path of the input (`.inp`) file. If not specified, the output name will be `basename.inp`.

- `--stderr`: Set path of the error (`.err`) file. If not specified, the output name will be `basename.err`.

- `--logfile`: Set path of the `.log` file. If not specified, the output name will be `basename.log`.

- `--resfile`: Set path of the `.res` file. If not specified, the output name will be `basename.res`.

## Solutions

Each problem must have, one golden solution and may have several alternative solutions in different programming languages. By default, the golden solution is C++, if you want to change it you can specify it in the `handler.yml` file with the `solution` field (eg, `solution: Python3`). Currently supported programming languages for solutions are C, C++, Java, Python3, Haskell, Clojure, Rust, RunPython, RunHaskell and RunClojure.

Independently of the available solutions, users can submit their solutions in any supported programming language. The system will match the programming language of the submission and the programming languages available for the solution and select the most appropriate one.

Solution files are named `solution.ext`, where `ext` is the standard extension that corresponds to the selected programming language. For instance, a problem may contain `solution.cc` and `solution.py` in order to provide reference solutions in C++ and Python3.

Java solutions must have their `main` function be placed in a `Main` class. See https://jutge.org/documentation/compilers/JDK for some examples.

## Checker

With the `checker` option you can specify how the user's program output is compared with the problem solution. This is especially useful if the order of the output does not matter, for example. There are various `checker` options:

- `std`: The default option, it will just compare the files normally.

- `loosy`: Used for loosy outputs. It is like the standard checker but it will return AC (Accepted) in case a problem gets a PE (Presentation Error) verdict.

- `epsilon`: Used for problems where the output are numbers and can be slightly different than the problem solution. It will check if the user solution is similar to the problem solution. This checker has the following options:
    - `relative`: If set to `1`, the comparison method will be relative. Otherwise, it will be absolute.

- `elastic`: Used to check for outputs whose order is independent. This happens, for instance, for backtracking problems where output order is left without specification. This checker has the following options:
    - `separator`: String that separates one case from another one.

- `elastic2`: Used to check for outputs whose order is independent and the order of these outputs are also independent. This happens, for instance, for subset backtracking problems where output order is left without specification and the order of the subset is also unordered. This checker has the following options:
    - `separator1`: String that separates one case from another one.

    - `separator2`: String that separates one case inside the case from another one.

    - `starting`: String that starts one case.

    - `ending`: String that ends one case.

- `external`: used to check for outputs using an external program that reads the input and the generated output and writes to `stdout` the verdict. This checker has the following options:
    - `external_program`: Name of the external program used. If the program does not exist, an IE (Internal Error) verdict will be returned.

    - `external_timeout`: Time that the external program has to do its work. The default time is 5 seconds. An IE (Internal Error) verdict will be returned it the program runs for more than the timeout.

## Scores

In order to score submissions according to the correct test cases it passes, the file `scores.yml` must exist. `scores.yml` describes the scoring of a problem using YAML syntax. The scores are given through a list of partial scores. Each partial score contains the following fields:

- `part`: Identifier of the partial score.
- `prefix`: Prefix of the test cases that must be passed in this partial score.
- `points`: Number of points assigned to this partial score.

The total number of points is usually 100, but other (integer) values can be used. A submission that receives the totality of points is considered accepted.

### Example

Consider a problem that has the following test cases:

- `sample-1`
- `sample-2`
- `easy-A`
- `easy-B`
- `hard-A`
- `hard-B`
- `hard-C`

The following scores file gives 10 points to submissions passing all sample test cases, 30 points to submissions passing all easy test cases, and 60 points to submissions passing all hard test cases:

`scores.yml`

```yml
- part: Samples
  prefix: sample
  points: 10
- part: Easy
  prefix: easy
  points: 30
- part: Hard
  prefix: hard
  points: 60
```

Overlapping prefixes can be used to create more complex scoring schemes.

## Awards

[Jutge.org](https://jutge.org/) offers awards to users in specific circumstances. Awards are images with a caption and a short description. In the case that a problem contains an image file `award.png` and (optionally) an HTML file `award.html`, users who get the problem accepted for the first time will receive the award.

The `award.png` image file should be a square image in PNG format with a transparent or white background (preferably) of size 200x200 pixels or more. Clip art and colorful images are preferred, no offensive images should be used.

The `award.html` file should contain a description of the award using simple HTML code. If `award.html` is missing but `award.png` exists, a default description will be provided by the system.

## Quick checklist

- Make sure that all file and folder names only contain letters, digits, dots, dashes and underscores. Do not use special characters, blanks or accents in them.

- Make sure that all lines in input and output test cases end with a newline character (`\n`), including the last line.

- Make sure that there are no spaces before a line break in output test cases. In particular, there must be no lines with only one or more spaces before the line break.

- Make sure that all files are encoded in UTF-8.

- Make sure that all test cases files are encoded in 7-bit ASCII.
