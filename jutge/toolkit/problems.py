#!/usr/bin/env python3


# ----------------------------------------------------------------------------
# Importations
# ----------------------------------------------------------------------------

import contextlib
import glob
import sys
import os
import os.path
import subprocess
import re
from shutil import which
from typing import Callable
import typer
from typing_extensions import Annotated

from .show import console
from . import util
from . import compilers

# ----------------------------------------------------------------------------
# Global variables
# ----------------------------------------------------------------------------


app = typer.Typer()

languages = ["ca", "en", "es", "fr", "de"]


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------


def fatal(msg: str) -> None:
    """Prints a message and exits."""

    console.print(msg, style="red")
    sys.exit(0)


def exec(cmd: str) -> int:
    """Executes a command and returns the return code."""

    console.print(cmd, style="blue")
    return os.system(cmd)


def find_compiler() -> compilers.Compiler:
    """Finds the compiler to use to compiler reference solution."""

    if not util.file_exists("handler.yml"):
        fatal("handler.yml does not exist")
    handler = util.read_yml("handler.yml")

    if "compilers" in handler:  # note: "compilers" is not a list of compilers, it's just a compiler
        return compilers.compiler(handler.get("compilers", ""), handler, "solution")
    elif "solution" in handler:
        solution_mapping = {
            "Java": "JDK",
            "C": "GCC",
            "C++": "GXX",
            "Haskell": "GHC",
            "Python": "Python3",
            "Python3": "Python3",
            "Clojure": "Clojure",
            "R": "R",
        }
        sol = solution_mapping.get(handler.get("solution", ""), handler.get("solution", ""))
        return compilers.compiler(sol, handler, "solution")
    else:
        return compilers.compiler("GXX", handler, "solution")


def find_compiler_for(program: str) -> compilers.Compiler | None:
    """Finds the compiler to use for the given program file."""

    handler = util.read_yml("handler.yml")
    supported_list = compilers.compiler_extensions(handler.get("compilers"))
    name = os.path.splitext(program)[0]
    ext = os.path.splitext(program)[-1][1:]
    if ext in supported_list:
        return compilers.compiler(supported_list[ext], handler, name)
    return None


def perform(action: Callable[[], None]) -> None:
    """Performs an action in the cwd or in all language subdirectories."""

    if os.path.exists("handler.yml"):
        action()
    else:
        for language in languages:
            if os.path.isdir(language):
                with contextlib.chdir(language):
                    console.print(f"-- {language} " + "-" * 60, style="reverse")
                    action()


# ----------------------------------------------------------------------------
# Make reference solution
# ----------------------------------------------------------------------------


@app.command()
def make_reference_solution() -> None:
    """Make the reference solution."""

    perform(make_reference_solution_in_directory)


def make_reference_solution_in_directory() -> None:
    """Make the reference solution in cwd."""

    console.print("Making the reference solution", style="bold")

    compiler = find_compiler()
    if not compiler.compile():
        fatal("Compilation error")


# ----------------------------------------------------------------------------
# Make reference outputs
# ----------------------------------------------------------------------------


@app.command()
def make_reference_outputs() -> None:
    """Make all reference test otuputs (*.cor) using the reference solution."""

    perform(make_reference_outputs_in_directory)


def make_reference_outputs_in_directory() -> None:
    """Make all reference test otuputs (*.cor) using the reference solution in cwd."""

    console.print("Making reference outputs", style="bold")

    compiler = find_compiler()

    if not util.file_exists(compiler.executable()):
        fatal(f"Reference solution {compiler.executable()} does not exist")

    handler = util.read_yml("handler.yml")

    for f in glob.glob("*.cor"):
        util.del_file(f)

    inputs = sorted(glob.glob("*.inp"))
    for input in inputs:
        tst = os.path.splitext(input)[0]
        time = compiler.execute(tst, True)

        if handler["handler"] == "graphic":
            os.rename("output.png", tst + ".cor")
        outsize = os.path.getsize(tst + ".cor")

        console.print(f"time: {time:.6f}\t\tsize: {util.convert_bytes(outsize)}")


# ----------------------------------------------------------------------------
# Verify program
# ----------------------------------------------------------------------------


@app.command()
def verify_program(program: str, iterations=1) -> bool:
    """Verify that a program is correct."""

    console.print(f"Verifying {program}", style="bold")

    if not util.file_exists("handler.yml"):
        fatal("handler.yml does not exist")
    handler = util.read_yml("handler.yml")
    if handler["handler"] != "std" and handler["handler"] != "graphic":
        fatal("unknown handler")

    compiler = find_compiler_for(program)
    if compiler is None:
        console.print(f"Ignoring {program}", style="red")
        return True

    if not compiler.compile():
        console.print("Compilation error", style="red")
        return False

    ext = os.path.splitext(program)[-1]

    good = True
    for test in sorted(glob.glob("*.inp")):
        tst = os.path.splitext(test)[0]
        time = compiler.execute(tst, False, 1)
        if handler["handler"] == "graphic":
            os.rename("output.png", tst + ext + ".out")
        outsize = os.path.getsize(tst + ext + ".out")

        differents = subprocess.call(["cmp", tst + ext + ".out", tst + ".cor"])
        if differents:
            msg, color = "WA", "red"
            good = False
        else:
            msg, color = "AC", "green"
        console.print(
            f"{tst:>16}.inp verdict: [{color}]{msg}[/{color}] time: {time:.6f} size: {util.convert_bytes(outsize)}"
        )
    if good:
        console.print("Verdict: AC", style="green")
    else:
        console.print("Verdict: WA", style="red")
    return good


# ----------------------------------------------------------------------------
# Verifiy all solutions
# ----------------------------------------------------------------------------


@app.command()
def verify_all_solutions() -> None:
    """Verify that all solutions are correct."""

    perform(verify_all_solutions_in_directory)


def verify_all_solutions_in_directory() -> None:
    """Verify that all solutions are correct in cwd."""

    console.print("Verify all solutions", style="bold")

    good = True
    for program in glob.glob("solution.*"):
        if os.path.splitext(program)[-1] not in [".exe", ".class", ".o", ".hs"]:
            good = verify_program(program) and good

    if good:
        console.print("All processed solutions are correct", style="green")
    else:
        console.print("Some solutions are wrong", style="red")


# ----------------------------------------------------------------------------
# Make PDFs
# ----------------------------------------------------------------------------


@app.command()
def make_pdf() -> None:
    """Make the pdf files for the problem."""

    perform(make_pdf_in_directory)


def make_pdf_in_directory() -> None:
    """Make the pdf files in cwd."""

    problems = sorted(glob.glob("problem.*.tex"))
    for problem in problems:
        language = problem.replace("problem.", "").replace(".tex", "")
        make_pdf_for_language(language)


def make_pdf_for_language(language: str) -> None:
    """Make the pdf file in the cwd for the given language."""

    console.print(f"Making problem.{language}.pdf", style="bold")

    cwd = os.path.realpath(os.getcwd())
    root = os.path.dirname(os.path.abspath(__file__))

    for f in glob.glob(f"{root}/sty/*.sty"):
        util.copy_file(f, ".")

    dat = util.current_time()
    usr = util.get_username()
    hst = util.get_hostname()
    src = f"{usr}@{hst}:{cwd}"

    sample1 = ""
    sample2 = ""
    tsts = sorted(glob.glob("sample*.inp"))

    handler = util.read_yml("handler.yml")

    graphic = ""
    i = 0
    for tst in tsts:
        i += 1
        tst_base = os.path.splitext(tst)[0]
        if len(tsts) == 1:
            num = ""
        else:
            num = str(i)

        if handler["handler"] == "graphic":
            size = subprocess.getoutput(f"identify -format '(%%w$\\\\times$%%h)' {tst_base}.cor")
            graphic = f"[{size}]"
            r = os.system(f"convert {tst_base}.cor {tst_base}.cor.eps")
            if r != 0:
                console.print("ImageMagick error", style="red")
                if r == 256:
                    console.print(
                        "You must change ImageMagick security policy to be able to convert the images to EPS.",
                        style="red",
                    )
                sys.exit(1)

        sample2 += f"\\SampleTwoColInputOutput{graphic}{{{tst_base}}}{{{num}}}"
        sample1 += f"\\SampleOneColInputOutput{graphic}{{{tst_base}}}{{{num}}}"

    scores = ""
    if util.file_exists("scores.yml"):
        scores = "scores.yml: \\verbatimtabinput{scores.yml}"

    tex = f"""

\\documentclass[11pt]{{article}}

\\usepackage{{jutge}}
\\usepackage{{lang.{language}}}
\\lstMakeShortInline@

\\begin{{document}}
\\newcommand{{\\SampleTwoCol}}{{{sample2}}}
\\newcommand{{\\SampleOneCol}}{{{sample1}}}
\\DoProblem{{{language}}}

\\subsection*{{Metadata}}
\\begin{{verbatim}}
language: {language}
source: {src}
generation-time: {dat}\\end{{verbatim}}
problem.{language}.yml: \\verbatimtabinput{{problem.{language}.yml}}
handler.yml: \\verbatimtabinput{{handler.yml}}
{scores}
\\end{{document}}

    """

    util.write_file("jutge-statement.tex", tex)

    if exec("latex -interaction scrollmode jutge-statement > jutge-statement.err") != 0:
        os.system("cat jutge-statement.err")
        fatal("LaTeX error")

    if exec("dvips jutge-statement -o 1> /dev/null 2>/dev/null") != 0:
        fatal("dvips error")

    if exec("ps2pdf jutge-statement.ps jutge-statement.pdf 1> /dev/null 2>/dev/null") != 0:
        fatal("ps2pdf error")

    os.remove("jutge-statement.ps")
    os.system(f"mv jutge-statement.pdf problem.{language}.pdf")
    os.system("rm -f jutge-statement.* *.sty")


# ----------------------------------------------------------------------------
# Clean files
# ----------------------------------------------------------------------------


@app.command()
def clean_garbage_files(force: Annotated[bool, typer.Option("--force")] = False) -> None:
    """Clean gargabe files (*.exe, *.cor, *.pdf, ...). Does its best."""

    perform(lambda: clean_garbage_files_in_directory(force))


def clean_garbage_files_in_directory(force: bool) -> None:
    """Clean gargabe files in cwd."""

    console.print(f"Cleaning garbage files", style="bold")

    files_to_remove = []
    for dirpath, dirnames, filenames in os.walk("."):
        for filename in filenames:
            if re.match(
                r"__pycache__|solution-modified*|.*\.exe|.*\.cor|problem\..*\.pdf|problem\..*\.ps|.*\.out|.*\.sty|.*\.class|.*~",
                filename,
            ):
                files_to_remove.append(dirpath + "/" + filename)

    if files_to_remove:
        console.print("The following garbage files will be removed:")
        for file in files_to_remove:
            console.print("    ", file, style="purple")

        if not force:
            delete = typer.confirm("Are you sure you want to delete them?")
            if not delete:
                console.print("No garbage files cleaned", style="green")
                return

        for file in files_to_remove:
            os.remove(file)

        console.print("Narbage files cleaned", style="green")
    else:
        console.print("No garbage files to clean", style="green")


# ----------------------------------------------------------------------------
# Make everything in a problem directory
# ----------------------------------------------------------------------------


@app.callback(invoke_without_command=True)
@app.command()
def make_all():
    """Makes reference solution, correct outputs, verifies programs and makes pdfs."""

    perform(make_all_in_directory)


def make_all_in_directory() -> None:
    """Makes reference solution, correct outputs, verifies programs and makes pdfs in cwd."""

    make_reference_solution_in_directory()
    make_reference_outputs_in_directory()
    verify_all_solutions_in_directory()
    make_pdf_in_directory()


# ----------------------------------------------------------------------------
# Check for missing dependencies
# ----------------------------------------------------------------------------


@app.command()
def check_dependencies():
    """Check for missing dependencies and emits a warning."""

    console.print(f"Checking dependencies", style="bold")

    programs = ["g++", "gcc", "python3", "Rscript", "clj", "ghc", "javac", "java", "runhaskell", "codon", "latex"]

    for program in programs:
        if which(program):
            console.print(f"{program:<12} [green]Seems good[/green]")
        else:
            console.print(f"{program:<12} [red]Missing[/red]")


# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------


def main() -> None:
    app()


if __name__ == "__main__":
    main()
