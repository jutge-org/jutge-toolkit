# Jutge Toolkit - macOS Installation Guide

## Installation Steps

### 1. Install Bun (JavaScript runtime)

Open Terminal and run:

```bash
curl -fsSL https://bun.sh/install | bash
```

After installation, close and reopen your terminal.

### 2. Install Jutge Toolkit

```bash
bun install --global "@jutge.org/toolkit"
```

### 3. Verify installation

```bash
jtk --version
```

You should see the version number displayed.

### 4. Check dependencies

```bash
jtk doctor
```

This command will show which tools are installed on your system.

### 5. Install recommended dependencies (optional)

We recommend using Homebrew to install additional tools. If you don't have Homebrew, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install the tools you need:

- **LaTeX** (for PDF statements): either **Tectonic** (lighter; see [Tectonic install](https://tectonic-typesetting.github.io/en-US/install.html)) or a full **MacTeX** / XeLaTeX setup:

    ```bash
    brew install --cask mactex
    ```

    By default the toolkit prefers Tectonic when both are installed. To force one engine, use `jtk config set latexEngine tectonic` or `xelatex` (see [LaTeX engine](reference.md#latex-engine-pdf-statements) in the command reference).

- **Pandoc** (for converting statements):

    ```bash
    brew install pandoc
    ```

- **Python 3** (if using Python):

    ```bash
    brew install python3
    ```

- **C/C++ Compiler** (if using C/C++):

    macOS comes with Clang compiler. Install Xcode Command Line Tools:

    ```bash
    xcode-select --install
    ```

## Troubleshooting

**Command not found after installation:**

- Close and reopen your terminal
- Check that Bun is properly installed: `bun --version`

**Permission errors:**

- You may need to add execution permissions to Bun's installation directory

You're ready to use Jutge Toolkit on macOS!
