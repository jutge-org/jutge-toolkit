# Jutge Toolkit - Linux Installation Guide

## Installation Steps

### 1. Install Bun (JavaScript runtime)

Open a terminal and run:

```bash
curl -fsSL https://bun.sh/install | bash
```

After installation, close and reopen your terminal, or run:

```bash
source ~/.bashrc
```

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

This command will show which tools are installed on your system. Don't worry if some are missing - you only need to install the ones for the programming languages and features you plan to use.

### 5. Install recommended dependencies (optional)

Depending on your needs, you may want to install:

- **LaTeX** (for PDF statements): install **Tectonic** (see [Tectonic install](https://tectonic-typesetting.github.io/en-US/install.html)) and/or **XeLaTeX** via TeX Live:

    ```bash
    sudo apt-get install texlive-xetex texlive-fonts-recommended texlive-lang-european
    ```

    By default the toolkit prefers Tectonic when both are available. Use `jtk config set latexEngine tectonic` or `xelatex` to pin an engine ([details](reference.md#latex-engine-pdf-statements)).

- **Pandoc** (for converting statements to different formats):

    ```bash
    sudo apt-get install pandoc
    ```

- **Python 3** (if using Python in your problems):

    ```bash
    sudo apt-get install python3
    ```

- **GCC/G++** (if using C/C++ in your problems):

    ```bash
    sudo apt-get install build-essential
    ```

## Troubleshooting

**Command not found after installation:**

- Close and reopen your terminal
- Check that Bun is properly installed: `bun --version`

**Permission errors:**

- You may need to add execution permissions to Bun's installation directory

You're ready to use Jutge Toolkit on Linux!
