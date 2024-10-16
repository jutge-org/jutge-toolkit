# Generate code metrics for Jutge.org

This page describes how to use `jutge-code-metrics`, a tool that provides measures extracted from a static inspection of the submitted code.

In order to use the toolkit, you need to have its external dependencies installed: `cloc`. Additionally, if you want to measure the complexity of Haskell scripts, you will also need to install `argon`.

# Usage

In order to generate code metrics, simply execute `jutge-code-metrics` along with the path of the script you want to measure. The script will output all the data in JSON format.
