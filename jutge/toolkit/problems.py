#!/usr/bin/env python3
# coding=utf-8


# ----------------------------------------------------------------------------
# Importations
# ----------------------------------------------------------------------------

import contextlib
import glob
import sys
import os
import os.path
import argparse
import subprocess
import re
from shutil import which
from colorama import init, Fore, Style
import util
import compilers
import typer
from show import console
from typing_extensions import Annotated


# ----------------------------------------------------------------------------
# Global variables
# ----------------------------------------------------------------------------


app = typer.Typer()

home = os.path.normpath(os.path.dirname(sys.argv[0]) + "/..")
languages = ["ca", "en", "es", "fr", "de"]
errors = []
tex = True


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


# ----------------------------------------------------------------------------
# Check for missing dependencies
# ----------------------------------------------------------------------------


@app.command()
def check_dependencies():
    """Checks for missing dependencies and emits a warning."""

    console.print(f"Checking dependencies", style="bold")

    programs = ["g++", "gcc", "python3", "Rscript", "clj", "ghc", "javac", "java", "runhaskell", "codon", "latex"]

    for program in programs:
        if which(program):
            console.print(f"{program:<12} [green]Seems good[/green]")
        else:
            console.print(f"{program:<12} [red]Missing[/red]")


# ----------------------------------------------------------------------------
# Make executable file
# ----------------------------------------------------------------------------


def make_executable():
    """Compiles the solution in the cwd."""

    print(Style.BRIGHT + "Generating reference solution" + Style.RESET_ALL)

    if not util.file_exists("handler.yml"):
        fatal("handler.yml does not exist")
    handler = util.read_yml("handler.yml")

    global com
    if "compilers" in handler:
        com = compilers.compiler(handler.get("compilers", ""), handler, "solution")
    elif "solution" in handler:
        if handler.get("solution", "") == "Java":
            sol = "JDK"
        elif handler.get("solution", "") == "C":
            sol = "GCC"
        elif handler.get("solution", "") == "C++":
            sol = "GXX"
        else:
            sol = handler.get("solution", "")
        com = compilers.compiler(sol, handler, "solution")
    else:  # if handler.get('solution', '') == 'C++' or not specified
        com = compilers.compiler("GXX", handler, "solution")

    ret = com.compile()
    if not ret:
        sys.exit(0)
    print()
    return com


def make_executable_rec():
    """Makes the executable files for the problem in the cwd"""

    handler = sorted(glob.glob("handler.yml"))
    if handler:
        make_executable()
    else:
        for d in next(os.walk("."))[1]:
            if d in languages:
                print(Style.DIM + os.getcwd() + " " + d + Style.RESET_ALL)
                os.chdir(d)
                make_executable()
                os.chdir("..")
            else:
                print(Style.DIM + "skipping " + d + Style.RESET_ALL)
            print()


# ----------------------------------------------------------------------------
# Make correct files
# ----------------------------------------------------------------------------


def make_corrects(com, iterations=1):
    """Makes all correct files in the cwd."""

    print(Style.BRIGHT + "Generating reference files" + Style.RESET_ALL)

    handler = util.read_yml("handler.yml")

    if not util.file_exists(com.executable()):
        fatal(Fore.RED + com.executable() + " does not exist" + Style.RESET_ALL)
    for f in glob.glob("*.cor"):
        util.del_file(f)
    inps = sorted(glob.glob("*.inp"))
    for inp in inps:
        tst = os.path.splitext(inp)[0]
        time = com.execute(tst, True, iterations)

        if handler["handler"] == "graphic":
            os.rename("output.png", tst + ".cor")
        outsize = os.path.getsize(tst + ".cor")

        try:
            if "Run" not in handler["compilers"]:
                print()
        except Exception:
            print()

        print("time: %f\t\tsize: %s" % (time, util.convert_bytes(outsize)) + Style.RESET_ALL)


def make_corrects_rec():
    """Makes the correct files for the problem in the cwd"""

    handler = sorted(glob.glob("handler.yml"))
    if handler:
        com = make_executable()
        make_corrects(com)
    else:
        for d in next(os.walk("."))[1]:
            if d in languages:
                print(Style.DIM + os.getcwd() + " " + d + Style.RESET_ALL)
                os.chdir(d)
                com = make_executable()
                make_corrects(com)
                os.chdir("..")
            else:
                print(Style.DIM + "skipping " + d + Style.RESET_ALL)
            print()


# ----------------------------------------------------------------------------
# Verify program
# ----------------------------------------------------------------------------


def verify_program(program, correct_extension="", iterations=1):
    """Verify that program compiles and gets AC for each test."""

    if not util.file_exists("handler.yml"):
        fatal("handler.yml does not exist")
    handler = util.read_yml("handler.yml")
    if handler["handler"] != "std" and handler["handler"] != "graphic":
        fatal("unknown handler")

    # compile
    available_list = []
    supported_list = compilers.compiler_extensions(handler.get("compilers"))

    file_list = [x for x in sorted(glob.glob(program + ".*")) if not x.endswith(".exe")]
    if file_list == []:
        file_list = [program]

    solution_list = []
    excluded_extensions = ["exe", "dir"]
    # excluded_extensions = ["exe", "dir", correct_extension]
    for file in file_list:
        exclude = False
        for extension in excluded_extensions:
            if file.split(".")[-1] == extension:
                exclude = True
        if not exclude:
            solution_list.append(file)
    if solution_list == []:
        return

    print(Style.BRIGHT + "Compiling solutions" + Style.RESET_ALL)
    for solution in solution_list:
        name = os.path.splitext(solution)[0]
        ext = os.path.splitext(solution)[-1][1:]
        if ext in supported_list:
            com = compilers.compiler(supported_list[ext], handler, name)
            ret = com.compile()
            available_list.append([solution, com])

    print()
    unsupported_list = [
        x for x in solution_list if (x not in [y[0] for y in available_list] and x[-1] != "~" and not x.endswith("bak"))
    ]
    if unsupported_list != []:
        print(
            Fore.YELLOW + "NOTICE: The following solutions are still not supported and will NOT be verified: ", end=""
        )
        for elem in unsupported_list:
            if elem != unsupported_list[-1]:
                print(elem, end=", ")
            else:
                print(elem + "\n" + Style.RESET_ALL)

    for f in glob.glob("*.out"):
        util.del_file(f)
    # execute on tests
    has_failed = False
    tests = sorted(glob.glob("*.inp"))
    for solution, compiler in sorted(available_list, key=lambda tup: tup[0].lower()):
        print(Style.BRIGHT + "Verifying " + solution + Style.RESET_ALL)
        ext = os.path.splitext(solution)[-1]
        for test in tests:
            tst = os.path.splitext(test)[0]
            time = compiler.execute(tst, False, iterations)
            if handler["handler"] == "graphic":
                os.rename("output.png", tst + ext + ".out")
            outsize = os.path.getsize(tst + ext + ".out")

            r = subprocess.call(["cmp", tst + ext + ".out", tst + ".cor"])
            if r:
                has_failed = True
                msg = "WA"
            else:
                msg = "OK"
                util.del_file(tst + ext + ".out")
            print(
                (Fore.GREEN if msg == "OK" else Fore.RED)
                + "%s.inp:\t\t%s\ntime: %f\t\tsize: %s" % (tst, msg, time, util.convert_bytes(outsize))
                + Style.RESET_ALL
            )
            if outsize > 2000000 and not os.path.isfile(tst + ext + ".ops"):
                print(
                    Fore.YELLOW
                    + "Warning: The output file is bigger than 2MB, you may need a .ops file for this test case."
                )
        print()

    if has_failed:
        print(Fore.RED + "Some solutions are not correct! Please check them and try again." + Style.RESET_ALL)
        sys.exit(0)


# ----------------------------------------------------------------------------
# Clean files
# ----------------------------------------------------------------------------


@app.command()
def clean_files(force: Annotated[bool, typer.Option("--force")] = False) -> None:
    """Removes all generated files (*.exe, *.cor, *.pdf, ...). Does its best."""

    console.print(f"Cleaning files", style="bold")

    files_to_remove = []
    for dirpath, dirnames, filenames in os.walk("."):
        for filename in filenames:
            if re.match(
                r"__pycache__|solution-modified*|.*\.exe|.*\.cor|problem\..*\.pdf|problem\..*\.ps|a\.out|.*\.class|.*~",
                filename,
            ):
                files_to_remove.append(dirpath + "/" + filename)

    if files_to_remove:
        console.print("The following files will be removed:")
        for file in files_to_remove:
            console.print("    ", file, style="purple")

        if not force:
            delete = typer.confirm("Are you sure you want to delete them?")
            if not delete:
                console.print("No files cleaned", style="green")
                return

        for file in files_to_remove:
            os.remove(file)

        console.print("Files cleaned", style="green")
    else:
        console.print("No files to clean", style="green")


# ----------------------------------------------------------------------------
# Make PDFs
# ----------------------------------------------------------------------------


@app.command()
def make_pdf() -> None:
    """Makes the pdf files for the problem in the cwd."""

    pbms = sorted(glob.glob("problem.*.tex"))
    if pbms:
        for pbm in pbms:
            language = pbm.replace("problem.", "").replace(".tex", "")
            make_pdf_for_language(language)
    else:
        for language in languages:
            if os.path.isdir(language):
                os.chdir(language)
                make_pdf_for_language(language)
                os.chdir("..")


def make_pdf_for_language(language: str) -> None:
    """Makes the pdf file in the cwd for the given language."""

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
    os.system("rm -f jutge-statement.*")

    console.print(f"Success", style="green")


# ----------------------------------------------------------------------------
# Make everything in a problem directory
# ----------------------------------------------------------------------------


def make_all(iterations=1):
    """Makes exe, cors, pdf files for the problem in the cwd."""

    pbms = sorted(glob.glob("problem.*.tex"))
    if pbms:
        com = make_executable()
        make_corrects(com)
        print()
        verify_program("solution", com.extension(), iterations)
        if tex:
            for pbm in pbms:
                lang = pbm.replace("problem.", "").replace(".tex", "")
                print()
                make_pdf_for_language(lang)
    else:
        for d in next(os.walk("."))[1]:
            if d in languages:
                os.chdir(d)
                print(Style.BRIGHT + "Working on " + os.getcwd() + Style.RESET_ALL)
                print()
                com = make_executable()
                print()
                make_corrects(com)
                print()
                verify_program("solution", com.extension(), iterations)
                if tex:
                    print()
                    make_pdf_for_language(d)
                os.chdir("..")
                print()
            else:
                print(Style.DIM + "skipping " + d + Style.RESET_ALL)

    found_png = False
    found_html = False
    for dirpath, dirnames, filenames in os.walk("."):
        if "award.png" in filenames:
            found_png = True
        if "award.html" in filenames:
            found_html = True

    if not found_png:
        if found_html:
            print(Fore.YELLOW + "\nWARNING: award.html was found but there's no award.png!" + Style.RESET_ALL)
        else:
            print(Fore.YELLOW + "\nWARNING: this problem doesn't have awards")


# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------


def old_main():
    init()  # Start colorama
    check_dependencies()

    # Create and configure the option parser
    parser = argparse.ArgumentParser(
        usage="%(prog)s [options] [paths]",
        description="Make different tasks in problem directories. If no arguments are specified, the script will compile the programs and generate the correct output of the problems. Then, it will check if all the possible solutions in different languages are correct. Finally it'll generate the .pdf files of the problem.",
    )

    parser.add_argument("--executable", help="make executable in the cwd", action="store_true")
    parser.add_argument("--corrects", help="make correct files in the cwd", action="store_true")
    parser.add_argument("--pdf", help="make printable files in the cwd", action="store_true")
    parser.add_argument(
        "--all", help="make executable, correct and printable files in the cwd (default)", action="store_true"
    )
    parser.add_argument("--recursive", help="make all recursively (cwd if ommitted)", action="store_true")
    parser.add_argument("--list", help="list all recursively (cwd if ommitted)", action="store_true")
    parser.add_argument(
        "--iterations",
        help="choose how many times the programs will be executed in order to get a more accurate execution time",
        type=int,
        default=1,
    )
    parser.add_argument(
        "--verify",
        help="verify correctness of a program",
        action="store",
        dest="verify",
        type=str,
        nargs="?",
        metavar="PROGRAM",
    )
    parser.add_argument("--clean", help="removes all generated files (*.exe, *.cor, *.pdf)", action="store_true")
    parser.add_argument("-f", "--force", help="don't prompt when removing generated files", action="store_true")
    parser.add_argument(
        "--stop-on-error",
        help="stop on first error (for --mk-rec) NOT YET IMPLEMENTED",
        action="store_true",
        default=False,
    )

    # Parse options with real arguments
    args = parser.parse_args()

    # Do the work
    done = False
    if args.executable:
        done = True
        make_executable_rec()
    if args.corrects:
        done = True
        make_corrects_rec()
    if args.pdf:
        done = True
        if tex:
            make_prints()
    if args.all:
        done = True
        make_all(args.iterations)
    if args.recursive:
        done = True
        make_recursive(".")
    if args.list:
        done = True
        make_list(".")
    if args.verify:
        done = True
        verify_program(args.verify, iterations=args.iterations)
        for d in next(os.walk("."))[1]:
            os.chdir(d)
            if args.verify in " ".join(glob.glob("*")):
                print(Style.BRIGHT + "Working on " + os.getcwd() + Style.RESET_ALL)
                print()
                verify_program(args.verify, iterations=args.iterations)
            os.chdir("..")
    if args.clean:
        done = True
        if args.force:
            clean_files(force=True)
        else:
            clean_files()
    if not done:
        make_all(args.iterations)


if __name__ == "__main__":
    app()
