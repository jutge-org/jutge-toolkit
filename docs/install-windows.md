# Jutge Toolkit - Windows Installation Guide

## Installation Steps

### 1. Open PowerShell

Press Windows key, type "PowerShell", and open it. Remember to reopen PowerShell after installing each tool.

### 2. Install Bun (JavaScript runtime)

Visit https://bun.sh/ and follow the installation instructions for Windows. It is easy!

### 3. Install Jutge Toolkit

```powershell
bun install --global "@jutge.org/toolkit"
```

The first installation may take a while. If it fails with a `mkdir` error, try again - it's usually a transient error.

### 4. Verify installation

```powershell
jtk --version
```

You should see the version number displayed.

### 5. Check dependencies

```powershell
jtk doctor
```

This command will show which tools are installed on your system.

### 6. Install recommended dependencies (optional)

- **LaTeX** (for PDF statements):

    Install MiKTeX from https://miktex.org/download. During installation, select the option to install missing packages on-the-fly.

- **Pandoc** (for converting statements):

    ```powershell
    winget install --id JohnMacFarlane.Pandoc
    ```

- **Python 3** (if using Python):

    Install from https://www.python.org/downloads/windows/. Make sure to check "Add Python to PATH" during installation.

- **C/C++ Compiler** (if using C/C++):

    We recommend w64devkit:
    1. Download from https://github.com/skeeto/w64devkit/releases
    2. Extract to a folder (e.g., `C:\w64devkit`)
    3. Run `w64devkit.exe` to open a terminal with GCC available

## Setting Up AI Features (Optional)

If you want to use JutgeAI features to generate problems and content, you need to set up API keys:

### For Google Gemini (Free for UPC users):

1. Visit https://aistudio.google.com/ and sign in
2. Click "Get API key" in the sidebar
3. Click "Create API key"
4. Copy the generated key
5. Set the environment variable permanently:

    ```powershell
    [System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'your-key-here', 'User')
    ```

### For OpenAI (Paid):

1. Create an account at https://platform.openai.com/
2. Navigate to API Keys section
3. Create a new secret key
4. Set the environment variable permanently:

    ```powershell
    [System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'your-key-here', 'User')
    ```

## Troubleshooting

**Command not found after installation:**

- Close and reopen your terminal
- Check that Bun is properly installed: `bun --version`

**LaTeX compilation fails:**

- Make sure you have a complete LaTeX distribution installed
- Ensure MiKTeX can install packages automatically

You're ready to use Jutge Toolkit on Windows!
