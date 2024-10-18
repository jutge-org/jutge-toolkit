#!/usr/bin/env python3
# coding=utf-8

from setuptools import setup
from os import system

version = "3.0.1"

setup(
    name="jutge-toolkit",
    packages=["jutge.toolkit"],
    install_requires=[
		"chardet",
        "pyyaml",
        "colorama",
        "lizard",
        "turtle-pil",
        "easyinput",
        "yogi",
        "pytokr",
        "beautifulsoup4",
        #        "biopython", # no funciona al meu mac
        "matplotlib",
        "more-itertools",
        "networkx",
        "numpy",
        # 'optilog',    # currently not available for Python 3.12 or 3.13
        "pandas",
        "scipy",
        "simpy",
		"typer",
    ],
    version=version,
    description="Toolkit to make problems for Jutge.org",
    long_description="Toolkit to make problems for Jutge.org",
    author="Jordi Petit et al",
    author_email="jpetit@cs.upc.edu",
    url="https://github.com/jutge-org/jutge-toolkit",
    download_url="https://github.com/jutge-org/jutge-toolkit/tarball/{}".format(version),
    keywords=["jutge", "jutge.org", "education", "problems", "quizzes", "toolkit"],
    license="Apache",
    zip_safe=False,
    include_package_data=True,
    setup_requires=["setuptools"],
    entry_points={
        "console_scripts": [
            "jutge-make-problem=jutge.toolkit:problems.main",
            "jutge-make-quiz=jutge.toolkit:quizzes.main",
            "jutge-code-metrics=jutge.toolkit:code_metrics.main",
            "jutge-syntax-checker-python3=jutge.toolkit:syntax_checker_python3.main",
        ]
    },
    scripts=[
        "scripts/jutge-vinga-install",
        "scripts/jutge-syntax-checker-R",
        "scripts/jutge-syntax-checker-clojure",
    ],
)
