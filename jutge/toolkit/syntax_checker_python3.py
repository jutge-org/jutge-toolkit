#!/usr/bin/env python3

# This script is used to check the syntax of a Python file

import sys
import ast
import traceback


def main() -> None:
    path = open(sys.argv[1])
    code = path.read()
    try:
        ast.parse(code)
    except:
        print("Syntax Error")
        traceback.print_exc()
        sys.exit(1)
