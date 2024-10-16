#!/usr/bin/env python3
# coding=utf-8

import sys
import glob
import os
import shutil
import subprocess
import timeit
from typing import Any
import turtle_pil
import yogi
from colorama import Fore, Style
from . import util
from . import show


# List of available compilers (will be filled in each class)
compilers: list[str] = []


class Compiler:
    """Compiler base class (abstract)."""

    _source: str
    _handler: Any

    def __init__(self, handler: Any, source: str) -> None:
        """Constructor."""
        self._handler = handler
        self._source = source

    def name(self) -> str:
        """Returns the compiler name."""
        raise Exception("Abstract method")

    def id(self) -> str:
        """Returns the compiler id (automatically computed from its class name)."""
        return self.__class__.__name__.replace("Compiler_", "").replace("XX", "++")

    def source(self) -> str:
        """Returns the source file name (without extension)."""
        return self._source

    def executable(self) -> str:
        """Returns the file name of the resulting "executable"."""
        return f"{self.source()}.{self.extension()}.exe"

    def prepare_execution(self, ori: str) -> None:
        """Copies the necessary files from ori to . to prepare the execution."""
        raise Exception("Abstract method")

    def flags1(self) -> str:
        """Returns flags for the first compilation."""
        raise Exception("Abstract method")

    def flags2(self) -> str:
        """Returns flags for the second compilation (if needed)."""
        raise Exception("Abstract method")

    def extension(self) -> str:
        """Returns extension of the source files (without dot)."""
        raise Exception("Abstract method")

    def compile(self) -> bool:
        """Compiles the program and tells is success."""

        if "source_modifier" in self._handler and (
            self._handler["source_modifier"] == "no_main" or self._handler["source_modifier"] == "structs"
        ):
            return self.compile_complex()
        else:
            return self.compile_normal()

    def compile_normal(self) -> bool:
        """Compiles the program normally."""
        raise Exception("Abstract method")

    def compile_complex(self) -> bool:
        """Compiles the program with main."""
        raise Exception("Abstract method")

    def run_compiler(self, cmd: str) -> None:
        """Runs command cmd to compile a program."""

        show.command(cmd)

        error = False
        result = ""
        try:
            result = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as exec:
            print(exec.output.decode("utf-8"))
            error = True

        if error or len(result) != 0:
            if len(result) != 0:
                print("\n" + result.decode("utf-8").strip() + "\n")  # type: ignore
            show.error(f"Compilation error at {self.source()}.{self.extension()}")

    def execute(self, tst: str, correct: bool, iterations: int = 1) -> float:
        self.execute_pre()
        ext = "cor" if correct else f"{self.extension()}.out"
        cmd = self.execute_command() + f" < {tst}.inp > {tst}.{ext}"
        show.command(cmd)
        time = timeit.timeit(lambda: os.system(cmd), number=iterations) / iterations
        self.execute_post()
        return time

    def execute_pre(self) -> None:
        pass

    def execute_post(self) -> None:
        pass

    def execute_command(self) -> str:
        return f"./{self.executable()}"


class Compiler_GCC(Compiler):

    compilers.append("GCC")

    def name(self) -> str:
        return "GNU C Compiler"

    def flags1(self) -> str:
        return "-D_JUDGE_ -O2 -DNDEBUG -Wall -Wextra -Wno-sign-compare"

    def flags2(self) -> str:
        return ""

    def extension(self) -> str:
        return "c"

    def compile_normal(self) -> bool:
        util.del_file(self.executable())
        cmd = f"gcc {self.flags1()} {self.source()}.{self.extension()} -o {self.executable()} -lm"
        self.run_compiler(cmd)
        return util.file_exists(self.executable())

    def compile_complex(self) -> bool:
        # Modify the program
        util.copy_file(self.name() + ".c", "modified.c")
        ori = util.read_file("modified.c")
        main = util.read_file("main.c")
        util.write_file(
            "modified.c",
            """
#define main main__3

%s

#undef main
#define main main__2

%s

#undef main

int main() {
    return main__2();
}

"""
            % (ori, main),
        )

        # Compile modified program
        util.del_file(self.executable())
        self.run_compiler(f"gcc {self.flags2()} modified.c -o {self.executable()} -lm")

        # We are almost there
        util.del_file("modified.c")
        if util.file_exists(self.executable()):
            return True
        else:
            print(Style.BRIGHT + Fore.RED + "Unreported error." + Style.RESET_ALL)
            util.del_file(self.executable())
            return False


class Compiler_GXX(Compiler):

    compilers.append("GXX")

    def name(self) -> str:
        return "GNU C++ Compiler"

    def flags1(self) -> str:
        return "-std=c++20 -D_JUDGE_ -O2 -DNDEBUG -Wall -Wextra -Wno-sign-compare -Wshadow"

    def flags2(self) -> str:
        return "-std=c++20 -D_JUDGE_ -O2 -DNDEBUG -Wall -Wextra -Wno-sign-compare -Wshadow"

    def extension(self) -> str:
        return "cc"

    def compile_normal(self) -> bool:
        util.del_file(self.executable())
        cmd = f"g++ {self.flags1()} {self.source()}.{self.extension()} -o {self.executable()}"
        self.run_compiler(cmd)
        return util.file_exists(self.executable())

    def compile_complex(self) -> bool:
        # Modify the program
        util.copy_file(self.name() + ".cc", "modified.cc")
        ori = util.read_file("modified.cc")
        main = util.read_file("main.cc")
        util.write_file(
            "modified.cc",
            """
#define main main__3

%s

#undef main
#define main main__2

%s

#undef main

int main() {
    return main__2();
}

"""
            % (ori, main),
        )

        # Compile modified program
        util.del_file(self.executable())
        self.run_compiler("g++ " + self.flags2() + " modified.cc -o " + self.executable())
        print(Style.BRIGHT + Fore.RED + "Compilation time exceeded!" + Style.RESET_ALL)
        util.del_file(self.executable())
        util.del_file("modified.cc")
        return False

        # We are almost there
        util.del_file("modified.cc")
        if util.file_exists(self.executable()):
            return True
        else:
            print(Style.BRIGHT + Fore.RED + "Unreported error." + Style.RESET_ALL)
            util.del_file(self.executable())
            return False


class Compiler_JDK(Compiler):

    compilers.append("JDK")

    wrapper = """

class WrapperMain {

    public static void main (String[] args) {
        try {
            Main.main(args);
            System.exit(0);
        } catch (Throwable e) {
            // We hide the exception.
            // System.out.println(e);
            System.exit(1);
        }
    }

}
"""

    def name(self) -> str:
        return "OpenJDK Runtime Environment"

    def executable(self) -> str:
        return "Main.class"

    def flags1(self) -> str:
        return ""

    def flags2(self) -> str:
        return ""

    def extension(self) -> str:
        return "java"

    def gen_wrapper(self):
        util.write_file("wrapper.java", self.wrapper)

    def del_wrapper(self):
        util.del_file("wrapper.java")

    def compile_normal(self):
        for f in glob.glob("*.class"):
            util.del_file(f)
        util.copy_file(self.source() + ".java", "Main.java")
        self.gen_wrapper()
        self.run_compiler(f"javac {self.flags1()} wrapper.java")
        self.del_wrapper()
        return util.file_exists(self.executable())

    def compile_complex(self):
        # esta fet a sac!!! cal fer-ho be

        for f in glob.glob("*.class"):
            util.del_file(f)
        # create Solution.class
        self.run_compiler(f"javac {self.flags1()} {self.name()}.java")
        # create Main.class
        self.run_compiler(f"javac {self.flags1()} main.java")
        # create JudgeMain.class
        self.gen_wrapper()
        self.run_compiler(f"javac {self.flags1()} wrapper.java")
        self.del_wrapper()
        return util.file_exists("Main.class")

    def execute_command(self) -> str:
        return "Java Main"


class Compiler_GHC(Compiler):
    compilers.append("GHC")

    def name(self) -> str:
        return "Glasgow Haskell Compiler"

    def flags1(self) -> str:
        return "-O3"

    def flags2(self) -> str:
        return "-O3"

    def extension(self) -> str:
        return "hs"

    def compile_normal(self) -> bool:
        util.del_file(self.executable())
        cmd = f"ghc {self.flags1()} {self.source()}.hs -o {self.executable()} 1> /dev/null"
        self.run_compiler(cmd)
        util.del_file(self.name() + ".hi")
        util.del_file(self.name() + ".o")
        return util.file_exists(self.executable())

    def compile_complex(self) -> bool:
        util.copy_file(self.name() + ".hs", "modified.hs")
        ori = util.read_file("modified.hs")
        main = util.read_file("main.hs")
        util.write_file(
            "modified.hs",
            """
%s

%s
"""
            % (ori, main),
        )

        util.del_file(self.executable())
        self.run_compiler(f"ghc {self.flags1()} modified.hs -o {self.executable()} 1> /dev/null")
        util.del_file("modified.hs")
        util.del_file("modified.hi")
        util.del_file("modified.o")
        return util.file_exists(self.executable())


class Compiler_Codon(Compiler):
    compilers.append("Codon")

    def name(self) -> str:
        return "Codon"

    def flags1(self) -> str:
        return "-release"

    def flags2(self) -> str:
        return "-release"

    def extension(self) -> str:
        return "codon"

    def compile_normal(self):
        # hack to use yogi
        if not os.path.exists("yogi.codon"):
            shutil.copy(os.path.dirname(yogi.__file__) + "/yogi.codon", ".")

        util.del_file(self.executable())
        cmd = f"codon build -exe {self.flags1()} {self.source()}.{self.extension()} -o {self.executable()}"
        self.run_compiler(cmd)
        return util.file_exists(self.executable())


class Compiler_Python3(Compiler):

    compilers.append("Python3")

    def name(self) -> str:
        return "Python3"

    def flags1(self) -> str:
        return ""

    def flags2(self) -> str:
        return ""

    def extension(self) -> str:
        return "py"

    def executable(self) -> str:
        # returs the same as the source file
        return self.source() + ".py"

    def compile_normal(self):
        show.command("nothing to compile")
        return True

    def compile_complex(self):
        if not self.compile_normal():
            return False

        # Modify the program
        util.copy_file(self.name() + ".py", "modified.py")
        ori = util.read_file(self.name() + ".py")
        main = util.read_file("main.py")
        util.write_file("modified.py", "%s\n%s\n" % (ori, main))

        # Compile modified program
        self.gen_wrapper()
        self.run_compiler("python3 py3c.py modified.py 1> /dev/null")
        self.del_wrapper()
        return True

    def execute(self, tst, correct, iterations=1):

        # hack to use turtle-pil when using turtle
        shutil.copy(turtle_pil.__file__, "turtle.py")

        if "source_modifier" in self._handler and (
            self._handler["source_modifier"] == "no_main" or self._handler["source_modifier"] == "structs"
        ):
            util.copy_file(self.name() + ".py", "modified.py")
            ori = util.read_file(self.name() + ".py")
            main = util.read_file("main.py")
            util.write_file("modified.py", "%s\n%s\n" % (ori, main))

            exec = "modified.py"
        else:
            exec = self.executable()

        ext = "cor" if correct else f"{self.extension()}.out"
        cmd = f"python3 {self.executable()} < {tst}.inp > {tst}.{ext}"
        show.command(cmd)

        def func():
            os.system(cmd)

        time = timeit.timeit(func, number=iterations) / iterations

        util.del_file("modified.py")
        util.del_file("turtle.py")
        util.del_dir("__pycache__")

        return time


class Compiler_Clojure(Compiler):
    compilers.append("Clojure")

    def name(self) -> str:
        return "Clojure"

    def flags1(self) -> str:
        return ""

    def flags2(self) -> str:
        return ""

    def extension(self) -> str:
        return "clj"

    def executable(self) -> str:
        # returs the same as the source file
        return self.source() + ".clj"

    def compile_normal(self):
        # TBD
        show.command("nothing to compile")
        return True

    def execute_command(self) -> str:
        return f"clj -M {self.source()}.clj"


class Compiler_R(Compiler):
    compilers.append("R")

    def name(self) -> str:
        return "R"

    def flags1(self) -> str:
        return ""

    def flags2(self) -> str:
        return ""

    def extension(self) -> str:
        return "R"

    def compile_normal(self):
        s = util.read_file(self.source() + ".R")
        util.write_file(
            "wrapper.R",
            """
wrapper_R <- function() {

%s

}
"""
            % s,
        )
        util.write_file(
            "compiler.R",
            """
library("codetools")

source("wrapper.R")

checkUsage(wrapper_R)
        """,
        )
        self.run_compiler("Rscript compiler.R 1> /dev/null")
        util.del_file("compiler.R")
        util.del_file("wrapper.R")
        return True

    def compile_complex(self):
        # Modify the program
        util.copy_file(self.name() + ".R", "modified.R")
        ori = util.read_file("modified.R")
        main = util.read_file("main.R")
        util.write_file("modified.R", f"{ori}\n{main}\n")
        s = util.read_file("modified.R")
        util.write_file(
            "wrapper.R",
            """
wrapper_R <- function() {

%s

}
"""
            % s,
        )
        util.write_file(
            "compiler.R",
            """
library("codetools")

source("wrapper.R")

checkUsage(wrapper_R)
    """
            % s,
        )
        self.run_compiler("Rscript compiler.R 1> /dev/null")
        util.del_file("compiler.R")
        util.del_file("wrapper.R")
        util.del_file("modified.R")
        return True

    def execute_command(self) -> str:
        return f"Rscript {self.source()}.R"


# -- runs ---------------------------------------------------------------------


class Compiler_RunHaskell(Compiler):
    compilers.append("RunHaskell")

    def name(self) -> str:
        return "Glasgow Haskell Compiler (with tweaks for testing in the judge)"

    def flags1(self) -> str:
        return "-O3"

    def flags2(self) -> str:
        return "-O3"

    def extension(self) -> str:
        return "hs"

    def execute(self, tst: str, correct: bool, iterations: int = 1) -> float:
        if correct:
            ext = "cor"
            print("runhaskell work.hs > %s.%s" % (tst, ext))
        else:
            ext = "hs.out"

        self.compile_work(tst)

        """func.system("runhaskell work.hs > %s.%s" % (tst, ext))"""
        func = 'import os; os.system("runhaskell work.hs > %s.%s")' % (tst, ext)
        time = timeit.timeit(func, number=iterations) / iterations

        util.del_file("work.hs")

        return time

    def compile(self) -> bool:
        util.del_file("work")
        util.del_file("work.hi")
        util.del_file("work.o")
        util.copy_file(self.name() + ".hs", "work.hs")
        f = open("work.hs", "a")
        print("""main = do print "OK" """, file=f)
        f.close()

        self.run_compiler("ghc -O3 work.hs 1> /dev/null")

        util.del_file("work")
        util.del_file("work.hi")
        util.del_file("work.hs")
        util.del_file("work.o")
        return True

    def compile_work(self, tst):
        f = open("extra.hs", "w")
        print('"testing"', file=f)
        f.close()
        return self.compile_with("extra.hs", tst)

    def compile_with(self, extra, tst):
        util.copy_file(self.name() + ".hs", "work.hs")
        if util.file_exists("judge.hs"):
            os.system("cat judge.hs >> work.hs")
        f = open("work.hs", "a")
        print("main = do", file=f)
        for line in open(tst + ".inp").readlines():
            line = line.rstrip()
            if line.startswith("let "):
                print("    %s" % line, file=f)
            else:
                print("    print (%s)" % line, file=f)
        f.close()
        self.run_compiler(f"ghc {self.flags1()} work.hs -o work.exe 1> /dev/null")

        if util.file_exists("work.exe"):
            util.del_file("work.hi")
            util.del_file("work.exe")
            return True
        else:
            return False


class Compiler_RunPython(Compiler):
    compilers.append("RunPython")

    def name(self) -> str:
        return "Python3 Interpreter (with tweaks for testing in the judge)"

    def flags1(self) -> str:
        return ""

    def flags2(self) -> str:
        return ""

    def extension(self) -> str:
        return "py"

    def gen_wrapper(self):
        util.write_file(
            "py3c.py",
            """
#!/usr/bin/python3

import py_compile, sys

py_compile.compile(sys.argv[1])
""",
        )

    def del_wrapper(self):
        util.del_file("py3c.py")

    def execute(self, tst, correct, iterations=1):
        if correct:
            ext = "cor"
            print("python3 %s.py > %s.%s" % (self.name, tst, ext))
        else:
            ext = "py.out"

        if self.compile_with(tst + ".inp"):
            os.system("cat solution.py %s.inp > work.py" % tst)
            func = 'import os; os.system("python3 work.py > %s.%s")' % (tst, ext)
            time = timeit.timeit(func, number=iterations) / iterations
            util.del_dir("__pycache__")
            util.del_file("work.py")
            return time
        else:
            return -1

    def compile(self):
        self.gen_wrapper()
        code = util.read_file(self.name() + ".py")
        util.write_file(self.name() + ".py", code)
        self.run_compiler(f"python3 py3c.py {self.name()}.py 1> /dev/null")
        self.del_wrapper()
        return True

    def compile_with(self, extra):
        util.copy_file(self.name() + ".py", "work.py")
        os.system("echo '' >> work.py")
        os.system("echo '' >> work.py")
        if util.file_exists("judge.py"):
            os.system("cat judge.py >> work.py")
        os.system(f"cat {extra} >> work.py")
        self.gen_wrapper()
        self.run_compiler("python3 py3c.py work.py 1> /dev/null")
        return True
        self.del_wrapper()
        return False


class Compiler_RunClojure(Compiler):
    compilers.append("RunClojure")

    def name(self) -> str:
        return "Clojure (for testing functions in judge)"

    def flags1(self) -> str:
        return ""

    def flags2(self) -> str:
        return ""

    def extension(self) -> str:
        return "clj"

    def execute(self, tst, correct, iterations=1):
        if correct:
            ext = "cor"
            print("clj -M work.clj > %s.%s" % (tst, ext))
        else:
            ext = "clj.out"

        util.system("cp %s.clj work.clj" % self.name)
        f = open("work.clj", "a")
        for line in open(tst + ".inp").readlines():
            line = line.rstrip()
            print("(println %s)" % line, file=f)
        f.close()
        func = 'import os; os.system("clj -M work.clj > %s.%s")' % (tst, ext)
        time = timeit.timeit(func, number=iterations) / iterations
        util.del_file("work.clj")
        return time

    def compile(self):
        self.run_compiler(f"clj -M {self.name}.clj 1> /dev/null")
        return True


# -- pro2 ---------------------------------------------------------------------


class Compiler_PRO2(Compiler):
    compilers.append("PRO2")

    def name(self) -> str:
        return "PRO2 - GNU C++ Compiler"

    def flags1(self) -> str:
        return "-D_JUDGE_ -D_GLIBCXX_DEBUG -O2 -Wall -Wextra -Werror -Wno-sign-compare -std=c++20"

    def flags2(self) -> str:
        return "-D_JUDGE_ -D_GLIBCXX_DEBUG -O2 -std=c++20"

    def extension(self) -> str:
        return "cc"

    def execute(self, tst, correct, iterations=1):
        if correct:
            ext = "cor"
            print(f"./{self.executable()} < {tst}.inp > {tst}.{ext}", end="")
        else:
            ext = "pro2.out"

        """func.system("./%s < %s.inp > %s.%s" %
                    (self.executable(), tst, tst, ext))"""
        func = 'import os; os.system("./%s < %s.inp > %s.%s")' % (self.executable(), tst, tst, ext)
        time = timeit.timeit(func, number=iterations) / iterations
        return time

    def compile(self):
        util.del_file(self.executable())
        util.del_dir(self.name() + ".dir")
        os.mkdir(self.name() + ".dir")

        if util.file_exists("solution.cc"):
            util.system("cp solution.cc " + self.name() + ".dir/" + "program.cc")
        elif util.file_exists("solution.hh"):
            util.system("cp solution.hh " + self.name() + ".dir/program.hh")
        else:
            print("There is no solution.cc nor solution.hh")

        util.system("cp public/* " + self.name() + ".dir")
        util.system("cp private/* " + self.name() + ".dir")

        os.chdir(self.name() + ".dir")
        self.run_compiler(f"g++ {self.flags1()} *.cc -o ../{self.executable()}")
        os.chdir("..")
        if util.file_exists(self.executable()):
            util.system("(cd public && tar cf ../public.tar *)")
            util.system("(cd private && tar cf ../private.tar *)")
            return True
        else:
            return False


class Compiler_MakePRO2(Compiler):
    compilers.append("MakePRO2")

    def name(self) -> str:
        return "Make for PRO2"

    def executable(self) -> str:
        return self.source() + ".makepro2.exe"

    def flags1(self) -> str:
        return ""

    def flags2(self) -> str:
        return ""

    def extension(self) -> str:
        return "tar"

    def compile(self):
        util.del_file(self.executable())
        util.del_dir(self.name() + ".dir")

        if not util.file_exists("solution"):
            raise Exception("There is no solution directory")
        if not util.file_exists("public"):
            raise Exception("There is no public directory")
        if not util.file_exists("private"):
            raise Exception("There is no private directory")

        util.mkdir(self.name() + ".dir")
        util.system("cp solution/*  public/* private/* " + self.name() + ".dir")
        os.chdir(self.name() + ".dir")

        self.run_compiler("make program.exe 1> make.log")

        os.chdir("..")

        if util.file_exists(self.name() + ".dir/program.exe"):
            util.copy_file(self.name() + ".dir/program.exe", "./" + self.executable())

        util.del_dir(self.name() + ".dir")

        if util.file_exists(self.executable()):
            util.system("(cd public && tar cf ../public.tar *)")
            util.system("(cd private && tar cf ../private.tar *)")
            util.system("(cd solution && tar cf ../solution.tar *)")
            return True
        else:
            return False

    def execute(self, tst, correct, iterations=1):
        if correct:
            ext = "cor"
            print("./%s < %s.inp > %s.%s" % (self.executable(), tst, tst, ext), end="")
        else:
            ext = "makepro2.out"

        """func.system("./%s < %s.inp > %s.%s" %
                    (self.executable(), tst, tst, ext))"""
        func = 'import os; os.system("./%s < %s.inp > %s.%s")' % (self.executable(), tst, tst, ext)
        time = timeit.timeit(func, number=iterations) / iterations
        return time

        self.del_wrapper()


################################################################################


def compiler(cpl: str, handler: Any, source: str) -> Compiler:
    """Returns a compiler for cpl using the given handler and the given source file."""

    cpl = cpl.replace("++", "XX")
    return eval(f"Compiler_{cpl}(handler, source)")


def compiler_extensions(handler_compiler):
    """Returns the info on all the compilers."""

    r = {}
    for x in compilers:
        ext = compiler(x, None, "solution").extension()
        if x == handler_compiler:
            r[ext] = x
        elif "Run" not in x and ext not in r:
            # Python3 has priority over RunPython and GHC has priority over RunHaskell
            r[ext] = x
    return r
