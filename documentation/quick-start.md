# Quickstart guide for the jutge-toolkit

To create problems you have two options: use the `jutge-toolkit` or use the Docker image provided with all the necessary tools.

## jutge-toolkit

If you want to create problems, you will have to install the `jutge-toolkit` with `pip3 install jutge-toolkit`.

`jutge-toolkit`is a set of tools that will help you create your problems and quizzes. It requires at least `g++` and `gcc` compilers to work.

We recommend you to install `build-essential` with `sudo apt install build-essential`. LaTeX may also be useful to generate the problem `.pdf` files. If not installed, the `.pdf` files will not be generated. You also need to install the compilers you are going to use to create the problems. Supported compilers can be found by typing `jutge-compilers`. You can also check all available compilers on your computer by running `jutge-available-compilers`.

After installing all the packages needed, you will be able to make problems by adapting the examples available on the [problems-toolkit repository](https://github.com/jutge-org/jutge-toolkit/tree/master/examples). There are two main types of problems:

- Common problems: programs that, with a given input, they have to provide an exact output. These types of problems are prepared with `jutge-make-problem`.
- Quizzes: a set of questions that need to be answered. There are different types of questions: open ended, single choice, multiple choice, etc. They are prepared with `jutge-make-quiz`.

### jutge-make-problem

The common scenario is to run `make-problem` in the command line within a directory containing a problem. This will generate the correct outputs for each test case input using the defined solution and will /also generate the PDF with the problem statement.

`make-problem` supports the following arguments:

- `--executable`: Makes the executables of the problems.
- `--corrects `: Generates the solution files of the problems.
- `--prints`: Creates the printable files in `.pdf` format.
- `--all` : Does everything mentioned above.
- `--recursive`: The toolkit searches recursively for problems.
- `--list`: Lists all the problems found recursively.
- `--iterations`: Choose how many times the programs will be executed in order to get a more accurate execution time.
- `--clean`: Removes all generated files (_.exe, _.cor, \*.pdf).
- `--force` or `-f`: Don't prompt when removing generated files.
- `--verify`: Verify the correctness of a program.
- `--help` or `-h` : Shows a help message with available arguments.

For full details, please refer to the [common problem documentation](documentation/problems.md).

### jutge-make-quiz

In order to generate a quiz, simply execute `make-quiz` inside a directory that contains the quiz, passing as a unique parameter an integer number that will be used as the random seed. The output will be a JSON file with the generated quiz.

For full details, please refer to the [quiz problem documentation](documentation/quizzes.md).

## Docker

If you prefer an all-in-one solution, you can download the Docker images that will bring you the same environment as the website so you can test how the problem is going to be corrected. The images contain the necessary tools and compilers to create problems and quizzes without the need to configure anything.

There are several types of images:

- `full`: includes all required dependencies.
- `lite`: includes all required dependencies, except exotic compilers.
- `server`: includes all required dependencies, except LaTeX.
- `test`: includes all required dependencies, except LaTeX and exotic compilers.

To download one of them you just have to install Docker and run the next command:

```
docker pull jutgeorg/jutge-full
```

### jutge-run

We have also prepared the `jutge-run` shortcut, which facilitates the usage of the Jutge Docker container. `jutge-run` is included on the `jutge-toolkit` that can be installed with `pip3 install jutge-toolkit`.

```
jutge-run command [ arg1 arg2 ... ]
```

`jutge-run` wrapper lets you run the following commands:

- `jutge-make-problem`: Check the program correctness, verify if all the solutions are correct and generate the .pdf files.
- `jutge-make-quiz`: Generate the json file for a quiz based on a seed.
- `jutge-compilers`: Lists all supported compilers.
- `jutge-available-compilers`: Lists all available compilers.
- `jutge-submit`: Correct a Jutge.org submission just as if it was sent to the website.

The first four commands are the same as the `jutge-toolkit`. The last one, `jutge-submit`, lets you correct a submission just as if it was sent to [Jutge.org](jutge.org).

### jutge-submit

To correct a Jutge.org submission just like [Jutge.org](https://jutge.org/) would do, run `submit` and redirect the content of the `.tar` file you want to correct to the input and redirect the output to another `.tar`file that will contain the correction results.

```
j submit < input_problem.tar > output_problem.tar
```

The input `.tar` file must have the following structure:

```
└── input_problem.tar
	├── com
	|	├── start.py
	|	└── util.py
	├── driver.tgz (may differ depending on the problem)
	├── problem.tgz (different structure possiblities, see make-problem)
	|	├── handler.yml
	|	├── problem.ca.tex
	|	├── problem.ca.yml
	|	├── problem.en.tex
	|	├── problem.en.yml
	|	├── sample.inp
	|	├── sample.cor
	|	├── tags.yml
	|	└── ...
	└── submission.tgz
		├── program.cc (file sent by the user)
		└── submission.yml
```

The `com` folder contains the necessary files to start the problem correction. The `driver.tgz` file contains the scripts that will be in charge of correcting the problem.

`problem.tgz` is the problem solution (generated with the `make-problem` command) and `submission.tgz` is the submission that the user sent to the website along with some metadata such as the user email, the submission number, the compiler id or the problem id (stored on the file `submission.yml`).
