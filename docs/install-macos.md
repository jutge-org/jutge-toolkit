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

- **LaTeX** (for PDF statements):

    ```bash
    brew install --cask mactex
    ```

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

## Setting Up AI Features (Optional)

If you want to use JutgeAI features to generate problems and content, you need to set up API keys:

### For Google Gemini (Free for UPC users):

1. Visit https://aistudio.google.com/ and sign in
2. Click "Get API key" in the sidebar
3. Click "Create API key"
4. Copy the generated key
5. Add to `~/.bashrc` or `~/.zshrc`:

    ```bash
    export GEMINI_API_KEY="your-key-here"
    ```

### For OpenAI (Paid):

1. Create an account at https://platform.openai.com/
2. Navigate to API Keys section
3. Create a new secret key
4. Add to `~/.bashrc` or `~/.zshrc`:

    ```bash
    export OPENAI_API_KEY="your-key-here"
    ```

## Troubleshooting

**Command not found after installation:**

- Close and reopen your terminal
- Check that Bun is properly installed: `bun --version`

**Permission errors:**

- You may need to add execution permissions to Bun's installation directory

You're ready to use Jutge Toolkit on macOS!
