#!/usr/bin/env python3
# coding=utf-8


# ----------------------------------------------------------------------------
# Importations
# ----------------------------------------------------------------------------

import glob
import sys
import os
import os.path
import argparse
import subprocess
import re
from shutil import which
from colorama import init, Fore, Style

from jutge import util
from . import compilers

# ----------------------------------------------------------------------------
# Global variables
# ----------------------------------------------------------------------------

home = os.path.normpath(os.path.dirname(sys.argv[0]) + "/..")
languages = ["ca", "en", "es", "fr", "de"]

errors = []

tex = True


# ----------------------------------------------------------------------------
# Check for missing dependencies
# ----------------------------------------------------------------------------

def check_dependencies():
    check_list = ['g++', 'gcc', 'tex']
    missing_list = []

    for program in check_list:
        if which(program) is None:
            missing_list.append(program)

    if 'tex' in missing_list:
        print(Fore.YELLOW + 'Warning: tex is not installed, .pdf files will not be generated!\n' + Style.RESET_ALL)
        global tex
        tex = False
        missing_list.remove('tex')

    if missing_list:
        print(Fore.RED + 'The following dependencies are missing, please install them and try again: ', end='')
        for missing_dep in missing_list:
            if missing_dep != missing_list[-1]:
                print(missing_dep, end=', ')
            else:
                print(missing_dep + Style.RESET_ALL)
        sys.exit(0)


# ----------------------------------------------------------------------------
# Make executable file
# ----------------------------------------------------------------------------

def make_executable():
    """Compiles the solution in the cwd."""
    print(Style.BRIGHT + "Generating correct executable..." + Style.RESET_ALL)

    if not util.file_exists("handler.yml"):
        raise Exception("handler.yml does not exist")
    handler = util.read_yml("handler.yml")

    global com
    if 'compilers' in handler:
        com = compilers.compiler(handler.get(
            'compilers', ''), handler, 'solution')
    elif 'solution' in handler:
        if handler.get('solution', '') == 'Java':
            sol = 'JDK'
        elif handler.get('solution', '') == 'C':
            sol = 'GCC'
        elif handler.get('solution', '') == 'C++':
            sol = 'GXX'
        else:
            sol = handler.get('solution', '')
        com = compilers.compiler(sol, handler, 'solution')
    else:  # if handler.get('solution', '') == 'C++' or not specified
        com = compilers.compiler('GXX', handler, 'solution')

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
        for d in next(os.walk('.'))[1]:
            if d in languages:
                print(Style.DIM + os.getcwd() + ' ' + d + Style.RESET_ALL)
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
    print(Style.BRIGHT + "Generating correct files..." + Style.RESET_ALL)

    handler = util.read_yml("handler.yml")

    if not util.file_exists(com.executable()):
        raise Exception(Fore.RED + com.executable() +
                        " does not exist" + Style.RESET_ALL)
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
            if 'Run' not in handler['compilers']:
                print()
        except Exception:
            print()

        print(Style.DIM + 'time: %f\t\tsize: %s' % (time, util.convert_bytes(outsize)) + Style.RESET_ALL)


def make_corrects_rec():
    """Makes the correct files for the problem in the cwd"""

    handler = sorted(glob.glob("handler.yml"))
    if handler:
        com = make_executable()
        make_corrects(com)
    else:
        for d in next(os.walk('.'))[1]:
            if d in languages:
                print(Style.DIM + os.getcwd() + ' ' + d + Style.RESET_ALL)
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


def verify_program(program, correct_extension='', iterations=1):
    """Verify that program compiles and gets AC for each test."""

    if not util.file_exists("handler.yml"):
        raise Exception("handler.yml does not exist")
    handler = util.read_yml("handler.yml")
    if handler["handler"] != "std" and handler["handler"] != "graphic":
        raise Exception("unknown handler")

    # compile
    available_list = []
    supported_list = compilers.compiler_extensions(handler.get('compilers'))

    file_list = [x for x in sorted(glob.glob(program + ".*")) if not x.endswith('.exe')]
    if file_list == []:
        file_list = [program]

    solution_list = []
    excluded_extensions = ['exe', 'dir', correct_extension]
    for file in file_list:
        exclude = False
        for extension in excluded_extensions:
            if file.split('.')[-1] == extension: exclude = True
        if not exclude: solution_list.append(file)
    if solution_list == []: return

    print(Style.BRIGHT + "Compiling supported programs..." + Style.RESET_ALL)
    for solution in solution_list:
        name = os.path.splitext(solution)[0]
        ext = os.path.splitext(solution)[-1][1:]
        if ext in supported_list:
            com = compilers.compiler(supported_list[ext], handler, name)
            ret = com.compile()
            available_list.append([solution, com])

    print()
    unsupported_list = [x for x in solution_list if (x not in [
        y[0] for y in available_list] and x[-1] != '~' and not x.endswith('bak'))]
    if unsupported_list != []:
        print(Fore.YELLOW + "NOTICE: The following solutions are still not supported and will NOT be verified: ", end='')
        for elem in unsupported_list:
            if elem != unsupported_list[-1]:
                print(elem, end=', ')
            else:
                print(elem + '\n' + Style.RESET_ALL)

    for f in glob.glob("*.out"):
        util.del_file(f)
    # execute on tests
    has_failed = False
    tests = sorted(glob.glob("*.inp"))
    for solution, compiler in sorted(available_list, key=lambda tup: tup[0].lower()):
        print("Verifying " + solution + "...")
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
            print((Fore.GREEN if msg == 'OK' else Fore.RED) +
                  "%s.inp:\t\t%s\ntime: %f\t\tsize: %s" %
                  (tst, msg, time, util.convert_bytes(outsize)) + Style.RESET_ALL)
            if outsize > 2000000 and not os.path.isfile(tst + ext + ".ops"):
                print(Fore.YELLOW + 'Warning: The output file is bigger than 2MB, you may need a .ops file for this test case.')
        print()

    if has_failed:
        print(Fore.RED + "Some solutions are not correct! Please check them and try again." + Style.RESET_ALL)
        sys.exit(0)

# ----------------------------------------------------------------------------
# Clean files
# ----------------------------------------------------------------------------

def clean_files(forced=False):
    removed_list = []
    for dirpath, dirnames, filenames in os.walk('.'):
        for filename in filenames:
            if re.match('.*\.exe|.*\.cor|problem\..*\.pdf|problem\..*\.ps|a\.out|.*\.class|.*~', filename):
                removed_list.append(dirpath + '/' + filename)

    if removed_list == []:
        print("The directories are clean, no files will be removed.")
        return

    print("The following files " + Style.BRIGHT + "will be" + Style.RESET_ALL + " removed:")
    for elem in sorted(removed_list):
        print(Style.DIM + elem + Style.RESET_ALL)
    print()

    if not forced:
        answer = input("Are you sure? (Type yes to confirm): ")
        if answer != 'yes': return

    print("\nCleaning problem...")
    for elem in removed_list:
        os.remove(elem)

    print(Fore.GREEN + 'Done!' + Style.RESET_ALL)

# ----------------------------------------------------------------------------
# Make printable files (pdf)
# ----------------------------------------------------------------------------

def make_prints_3(lang, ori):

    ori = os.path.realpath(ori)
    dat = util.current_time()
    usr = util.get_username()
    hst = util.get_hostname()
    src = "%s@%s:%s" % (usr, hst, ori)

    sample2 = ""
    sample1 = ""
    tsts = sorted(glob.glob("*sample*.inp"))

    handler = util.read_yml("handler.yml")

    graphic = ""
    i = 0
    for j in tsts:
        i += 1
        jj = os.path.splitext(j)[0]
        if len(tsts) == 1:
            num = ""
        else:
            num = str(i)

        if handler["handler"] == "graphic":
            size = subprocess.getoutput(
                "identify -format '(%%w$\\\\times$%%h)' %s.cor" % jj)
            graphic = "[%s]" % size
            r = os.system("convert %s.cor %s.cor.eps" % (jj, jj))
            if r != 0:
                print(Fore.RED + "ImageMagick error!", end = '')
                if r == 256:
                    print(" You must change it's security policy to be able to convert the images to EPS.", end = '')
                print(Style.RESET_ALL)
                sys.exit(0)

        sample2 += r"\SampleTwoColInputOutput%s{%s}{%s}" % (graphic, jj, num)
        sample1 += r"\SampleOneColInputOutput%s{%s}{%s}" % (graphic, jj, num)

    scores = ""
    if util.file_exists("scores.yml"):
        scores = "scores.yml: \\verbatimtabinput{scores.yml}"

    t = r"""
\documentclass[11pt]{article}

    \usepackage{jutge}
    \usepackage{lang.%s}
    \lstMakeShortInline@

\begin{document}
    \newcommand{\SampleTwoCol}{%s}
    \newcommand{\SampleOneCol}{%s}
    \DoProblem{%s}

\subsection*{Metadata}
\begin{verbatim}
language: %s
source: %s
generation-time: %s\end{verbatim}
problem.%s.yml: \verbatimtabinput{problem.%s.yml}
handler.yml: \verbatimtabinput{handler.yml}
%s
\end{document}
    """ % (lang, sample2, sample1, lang, lang, src, dat, lang, lang, scores)

    util.write_file("main.tex", t)
    print(Style.BRIGHT + "Generating .pdf file...   ", end=Style.RESET_ALL)
    sys.stdout.flush()
    r = os.system("latex -interaction scrollmode main > main.err")
    if r != 0:
        os.system('cat main.err')
        raise Exception(
            Fore.RED + "\nLaTeX error!" + Style.RESET_ALL)

    r = os.system("dvips main -o 1> /dev/null 2>/dev/null")
    if r != 0:
        raise Exception(Fore.RED + "\ndvips error!" + Style.RESET_ALL)

    r = os.system("ps2pdf main.ps main.pdf 1> /dev/null 2>/dev/null")
    if r != 0:
        raise Exception(Fore.RED + "\nps2pdf error!" + Style.RESET_ALL)

    os.remove("main.ps")
    os.system("mv main.pdf \"%s/problem.%s.pdf\"" % (ori, lang))

    print(Fore.GREEN + 'Done!' + Style.RESET_ALL)


def make_prints2(lang):
    """Makes the problem*pdf file in the cwd for language lang."""

    ori = os.getcwd()
    tmp = util.tmp_dir()
    print(Style.DIM + ori + ' ' + lang + ' ' + tmp + ' ' + Style.RESET_ALL)

    os.system("cp * %s/sty/* %s 2>&1 | grep -v 'omitting directory'" %
              (os.path.dirname(os.path.abspath(__file__)), tmp))
    os.chdir(tmp)

    try:
        make_prints_3(lang, ori)
    except:
        raise
    finally:
        os.chdir(ori)


def make_prints():
    """Makes the pdf files for the problem in the cwd"""

    pbms = sorted(glob.glob("problem.*.tex"))
    if pbms:
        for pbm in pbms:
            lang = pbm.replace("problem.", "").replace(".tex", "")
            make_prints2(lang)
    else:
        for d in next(os.walk('.'))[1]:
            if d in languages:
                os.chdir(d)
                make_prints2(d)
                os.chdir("..")
            else:
                print(Style.DIM + "skipping " + d + Style.RESET_ALL)
            print()


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
                make_prints2(lang)
    else:
        for d in next(os.walk('.'))[1]:
            if d in languages:
                os.chdir(d)
                print(Style.BRIGHT + "Working on " +
                      os.getcwd() + "..." + Style.RESET_ALL)
                print()
                com = make_executable()
                print()
                make_corrects(com)
                print()
                verify_program("solution", com.extension(), iterations)
                if tex:
                    print()
                    make_prints2(d)
                os.chdir("..")
                print()
            else:
                print(Style.DIM + "skipping " + d + Style.RESET_ALL)

    found_png = False
    found_html = False
    for dirpath, dirnames, filenames in os.walk('.'):
        if 'award.png' in filenames:
            found_png = True
        if 'award.html' in filenames:
            found_html = True

    if not found_png:
        if found_html:
            print(Fore.YELLOW + "WARNING: award.html was found but there's no award.png!" + Style.RESET_ALL)
        else:
            print(Fore.YELLOW + 'WARNING: this problem doesn\'t have awards')



# ----------------------------------------------------------------------------
# Make everything recursively
# ----------------------------------------------------------------------------

def make_recursive_2():
    sys.stdout.flush()

    if util.file_exists("handler.yml"):
        print("------------------------------------------")
        print(os.getcwd())
        print("------------------------------------------")
        if util.file_exists("solution.cc") or util.file_exists("solution.hs"):
            try:
                if 1:
                    com = make_executable()
                    make_corrects(com)
                    if tex:
                        make_prints()
            except Exception as e:
                print("\a")
                print(e)
                errors.append((e, os.getcwd()))

    else:
        cwd = os.getcwd()
        for path in next(os.walk('.'))[1]:
            os.chdir(path)
            make_recursive_2()
            os.chdir(cwd)


def make_recursive(paths):
    global errors
    errors = []
    cwd = os.getcwd()
    for path in next(os.walk(paths))[1]:
        os.chdir(path)
        make_recursive_2()
        os.chdir(cwd)
    if errors:
        print(Fore.RED + "------------------------------------------")
        print("Errors:")
        print("------------------------------------------")
        for e in errors:
            print(e)
        print(Style.RESET_ALL, end='')


# ----------------------------------------------------------------------------
# Make a list of problems recursively
# ----------------------------------------------------------------------------

def make_list_2():
    cwd = os.getcwd()
    ext = os.path.splitext(cwd)[1]
    if ext == ".pbm":
        pbms = glob.glob("problem.*.tex")
        if pbms:
            langs = []
            for p in pbms:
                langs.append(p.replace("problem.", "").replace(".tex", ""))
        else:
            langs = util.intersection(glob.glob("*"), languages)
        print(cwd + " " + " ".join(sorted(langs)))

    else:
        for path in next(os.walk(paths))[1]:
            os.chdir(path)
            make_list_2()
            os.chdir(cwd)


def make_list(paths):
    cwd = os.getcwd()
    for path in sorted(paths):
        if os.path.isdir(path):
            os.chdir(path)
            make_list_2()
            os.chdir(cwd)

# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------


def main():
    init()  # Start colorama
    check_dependencies()

    # Create and configure the option parser
    parser = argparse.ArgumentParser(
        usage="%(prog)s [options] [paths]",
        description="Make different tasks in problem directories. If no arguments are specified, the script will compile the programs and generate the correct output of the problems. Then, it will check if all the possible solutions in different languages are correct. Finally it'll generate the .pdf files of the problem.",
    )

    parser.add_argument("--executable", help="make executable in the cwd",
                        action="store_true")
    parser.add_argument("--corrects", help="make correct files in the cwd",
                        action="store_true")
    parser.add_argument("--pdf", help="make printable files in the cwd",
                        action="store_true")
    parser.add_argument("--all", help="make executable, correct and printable files in the cwd (default)",
                        action="store_true")
    parser.add_argument("--recursive", help="make all recursively (cwd if ommitted)",
                        action="store_true")
    parser.add_argument("--list", help="list all recursively (cwd if ommitted)",
                        action="store_true")
    parser.add_argument("--iterations", help="choose how many times the programs will be executed in order to get a more accurate execution time",
                        type=int, default=1)
    parser.add_argument("--verify", help="verify correctness of a program",
                        action='store', dest="verify", type=str, nargs='?', metavar="PROGRAM")
    parser.add_argument("--clean", help="removes all generated files (*.exe, *.cor, *.pdf)",
                        action="store_true")
    parser.add_argument("-f", "--force", help="don't prompt when removing generated files",
                        action="store_true")
    parser.add_argument("--stop-on-error", help="stop on first error (for --mk-rec) NOT YET IMPLEMENTED",
                        action="store_true", default=False)

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
        for d in next(os.walk('.'))[1]:
            os.chdir(d)
            if args.verify in ' '.join(glob.glob('*')):
                print(Style.BRIGHT + "Working on " +
                      os.getcwd() + "..." + Style.RESET_ALL)
                print()
                verify_program(args.verify, iterations=args.iterations)
            os.chdir('..')
    if args.clean:
        done = True
        if args.force:
            clean_files(forced=True)
        else:
            clean_files()
    if not done:
        make_all(args.iterations)


if __name__ == '__main__':
    main()
