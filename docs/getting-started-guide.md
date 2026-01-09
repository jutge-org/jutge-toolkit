# Jutge Toolkit - Getting Started Guide

Welcome to the New Jutge Toolkit! This guide will help you install and start using the toolkit to create, manage, and upload programming problems to Jutge.org. Information about problem formats will be provided in a separate document.

## What is Jutge Toolkit?

Jutge Toolkit is a command-line application that helps you create and manage programming problems for the Jutge.org platform. It provides tools to:

- Create new problems from scratch or using templates
- Generate problem elements using AI (JutgeAI)
- Compile and test solutions in multiple programming languages
- Generate PDF statements and other formats
- Upload problems to Jutge.org

## Installation

Choose the installation instructions for your operating system:

### Linux Installation

1. **Install Bun (JavaScript runtime)**

    Open a terminal and run:

    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```

    After installation, close and reopen your terminal, or run:

    ```bash
    source ~/.bashrc
    ```

2. **Install Jutge Toolkit**

    ```bash
    bun install --global "@jutge.org/toolkit"
    ```

3. **Verify installation**

    ```bash
    jtk --version
    ```

    You should see the version number displayed.

4. **Check dependencies**

    ```bash
    jtk doctor
    ```

    This command will show which tools are installed on your system. Don't worry if some are missing - you only need to install the ones for the programming languages and features you plan to use.

5. **Install recommended dependencies (optional)**

    Depending on your needs, you may want to install:
    - **LaTeX** (for PDF statements):

        ```bash
        sudo apt-get install texlive-xetex texlive-fonts-recommended texlive-lang-european
        ```

    - **Pandoc** (for converting statements to different formats):

        ```bash
        sudo apt-get install pandoc
        ```

    - **ImageMagick** (for image processing):

        ```bash
        sudo apt-get install imagemagick
        ```

    - **Python 3** (if using Python in your problems):

        ```bash
        sudo apt-get install python3
        ```

    - **GCC/G++** (if using C/C++ in your problems):
        ```bash
        sudo apt-get install build-essential
        ```

### macOS Installation

1. **Install Bun (JavaScript runtime)**

    Open Terminal and run:

    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```

    After installation, close and reopen your terminal.

2. **Install Jutge Toolkit**

    ```bash
    bun install --global "@jutge.org/toolkit"
    ```

3. **Verify installation**

    ```bash
    jtk --version
    ```

    You should see the version number displayed.

4. **Check dependencies**

    ```bash
    jtk doctor
    ```

    This command will show which tools are installed on your system.

5. **Install recommended dependencies (optional)**

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

    - **ImageMagick** (for image processing):

        ```bash
        brew install imagemagick
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

### Windows Installation

1. **Open PowerShell**

    Press Windows key, type "PowerShell", and open it. Remember to reopen PowerShell after installing each tool.

2. **Install Bun (JavaScript runtime)**

    Visit https://bun.sh/ and follow the installation instructions for Windows. It is easy!

3. **Install Jutge Toolkit**

    ```powershell
    bun install --global "@jutge.org/toolkit"
    ```

    The first installation may take a while. If it fails with a `mkdir` error, try again - it's usually a transient error.

4. **Verify installation**

    ```powershell
    jtk --version
    ```

    You should see the version number displayed.

5. **Check dependencies**

    ```powershell
    jtk doctor
    ```

    This command will show which tools are installed on your system.

6. **Install recommended dependencies (optional)**
    - **LaTeX** (for PDF statements):

        Install MiKTeX from https://miktex.org/download. During installation, select the option to install missing packages on-the-fly.

    - **Pandoc** (for converting statements):

        ```powershell
        winget install --id JohnMacFarlane.Pandoc
        ```

    - **ImageMagick** (for image processing):

        ```powershell
        winget install --id ImageMagick.ImageMagick
        ```

    - **Python 3** (if using Python):

        Install from https://www.python.org/downloads/windows/. Make sure to check "Add Python to PATH" during installation.

    - **C/C++ Compiler** (if using C/C++):

        We recommend w64devkit:
        1. Download from https://github.com/skeeto/w64devkit/releases
        2. Extract to a folder (e.g., `C:\w64devkit`)
        3. Run `w64devkit.exe` to open a terminal with GCC available

## Getting Started

### Getting Help

Before we dive into configuration, it's important to know how to get help:

1. **View general help:**

    ```bash
    jtk --help
    ```

    This shows all available commands.

2. **Get help for a specific command:**

    ```bash
    jtk make --help
    jtk generate --help
    jtk config --help
    ```

    Add `--help` to any command to see detailed information about its options and usage.

3. **View information about the toolkit:**

    ```bash
    jtk about
    ```

### Configuration

Before using the toolkit, you should configure it with your preferences:

1. **View current configuration:**

    ```bash
    jtk config show
    ```

2. **Set a configuration value:**

    ```bash
    jtk config set defaultModel "google/gemini-2.5-flash"
    ```

3. **Edit configuration interactively:**

    ```bash
    jtk config edit
    ```

    This opens your default text editor with the configuration file.

### Setting Up AI Features (Optional)

If you want to use JutgeAI features to generate problems and content, you need to set up API keys:

**For Google Gemini (Free for UPC users):**

1. Visit https://aistudio.google.com/ and sign in
2. Click "Get API key" in the sidebar
3. Click "Create API key"
4. Copy the generated key
5. Set the environment variable:
    - **Linux/macOS:** Add to `~/.bashrc` or `~/.zshrc`:
        ```bash
        export GEMINI_API_KEY="your-key-here"
        ```
    - **Windows PowerShell (permanent):**
        ```powershell
        [System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'your-key-here', 'User')
        ```

**For OpenAI (Paid):**

1. Create an account at https://platform.openai.com/
2. Navigate to API Keys section
3. Create a new secret key
4. Set the environment variable:
    - **Linux/macOS:** Add to `~/.bashrc` or `~/.zshrc`:
        ```bash
        export OPENAI_API_KEY="your-key-here"
        ```
    - **Windows PowerShell (permanent):**
        ```powershell
        [System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'your-key-here', 'User')
        ```

### Your First Problem

#### Option 1: Create from Template

1. **Clone a template:**

    ```bash
    jtk clone
    ```

    This will show you available templates and create a new problem directory.

2. **Or clone a specific template:**

    ```bash
    jtk clone standard/maximum-of-2-integers.pbm -d my-problem.pbm
    ```

#### Option 2: Create with AI

1. **Create a problem using JutgeAI:**

    ```bash
    jtk generate problem -d factorial.pbm
    ```

    The toolkit will ask you for:
    - Problem title
    - Problem description
    - Original language
    - Programming language for the solution

2. **Review the generated content** in the `factorial.pbm` directory.

### Building Your Problem

Once you have a problem directory, you can generate all necessary files:

```bash
cd factorial.pbm
jtk make
```

This command will:

- Compile solutions
- Generate correct outputs for test cases
- Create PDF statements
- Generate HTML and text versions

To make only specific elements:

```bash
jtk make pdf          # Only PDF statements
jtk make exe          # Only compile executables
jtk make cor          # Only generate correct outputs
```

### Testing Solutions

To verify a solution against your golden solution:

```bash
jtk verify solution.py
```

This will run the solution against all test cases and compare outputs.

### Generating Additional Content

**Add statement translations:**

```bash
jtk generate translations en es ca
```

**Add solutions in other languages:**

```bash
jtk generate solutions python java cpp
```

**Generate test case generators:**

```bash
jtk generate generators --all
```

**Generate award image:**

```bash
jtk generate award.png "A golden trophy on a blue background"
```

**Generate award message:**

```bash
jtk generate award.html
```

### Cleaning Up

Remove temporary and generated files:

```bash
jtk clean              # Dry run (shows what would be deleted)
jtk clean --force      # Actually delete files
jtk clean --all        # Also delete generated statements and correct files
```

### Uploading to Jutge.org

When your problem is ready:

```bash
jtk upload
```

If this is a new problem, it will be created on Jutge.org and a `problem.yml` file will be generated with the problem ID. For subsequent uploads, the problem will be updated.

## Common Commands Reference

Here's a quick reference of the most commonly used commands:

```bash
jtk --help                          # Show help
jtk --version                       # Show version
jtk upgrade                         # Upgrade to latest version
jtk about                           # Show information about the toolkit

jtk config show                     # Show configuration
jtk config set <key> <value>        # Set configuration value
jtk config edit                     # Edit configuration interactively

jtk clone [template]                # Clone template
jtk generate problem                # Create problem with AI
jtk make                            # Build all problem elements
jtk verify <program>                # Test a solution
jtk upload                          # Upload to Jutge.org
jtk clean                           # Clean temporary files

jtk doctor                          # Check system dependencies
```

## Getting Help

- Use `--help` flag with any command to get detailed information:

    ```bash
    jtk make --help
    jtk generate --help
    ```

- Check the documentation at https://github.com/jutge-org/jutge-toolkit

- Report issues on GitHub

## Tips for Success

1. **Keep the toolkit updated:** Regularly run `jtk upgrade` to get the latest features and fixes.

2. **Start simple:** Begin with a basic problem and gradually explore more features.

3. **Review AI-generated content:** Always review and validate content generated by JutgeAI before using it in production.

4. **Use version control:** Keep your problem directories in a Git repository to track changes.

5. **Check dependencies:** Run `jtk doctor` periodically to ensure all required tools are installed.

6. **Test thoroughly:** Always use `jtk verify` to test solutions before uploading.

## Troubleshooting

**Command not found after installation:**

- Close and reopen your terminal
- Check that Bun is properly installed: `bun --version`

**Permission errors on Linux/macOS:**

- You may need to add execution permissions to Bun's installation directory

**AI features not working:**

- Verify your API keys are set correctly
- Check you have internet connectivity
- Ensure the model name is correct in your configuration

**LaTeX compilation fails:**

- Make sure you have a complete LaTeX distribution installed
- On Windows, ensure MiKTeX can install packages automatically

**Problems with specific compilers:**

- Run `jtk doctor` to see which compilers are available
- Install only the compilers you need for your problems

---

You're now ready to start creating problems with Jutge Toolkit! If you have questions or need help, don't hesitate to consult the documentation or reach out to the community.
