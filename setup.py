#!/usr/bin/env python3
# coding=utf-8

from setuptools import setup
from os import system

version = '2.11.2'

setup(
    name='jutge-toolkit',
    packages=['jutge.toolkit'],
    install_requires=[
        'jutge-util',
        'pyyaml>=5.1',
        'colorama',
        'lizard',
        'turtle-pil',

        'easyinput',
        'yogi',
        'pytokr',

        'beautifulsoup4',
        'biopython',
        'matplotlib',
        'more-itertools',
        'networkx',
        'numpy',
        'optilog',
        'pandas',
        'scipy',
        'simpy',
    ],
    version=version,
    description='Toolkit to make problems for Jutge.org',
    long_description='Toolkit to make problems for Jutge.org',
    author='Jordi Petit et al',
    author_email='jpetit@cs.upc.edu',
    url='https://github.com/jutge-org/jutge-toolkit',
    download_url='https://github.com/jutge-org/jutge-toolkit/tarball/{}'.format(version),
    keywords=['jutge', 'jutge.org', 'education', 'problems', 'quizzes', 'toolkit'],
    license='Apache',
    zip_safe=False,
    include_package_data=True,
    setup_requires=['setuptools'],
    entry_points={
        'console_scripts': [
            'jutge-make-problem=jutge.toolkit:problems.main',
            'jutge-make-quiz=jutge.toolkit:quizzes.main',
            'jutge-compilers=jutge.toolkit:compilers.main',
            'jutge-available-compilers=jutge.toolkit:compilers.available_compilers',
            'jutge-start=jutge.toolkit:start.main',
            'jutge-code-metrics=jutge.toolkit:code_metrics.main',
            'jutge-sanitize=jutge.toolkit:cleanup.main'
        ]
    },
    scripts=[
        'scripts/jutge-run',
        'scripts/jutge-submit',
        'scripts/jutge-install-vinga',
        'scripts/jutge-install-verilog',
    ]
)

