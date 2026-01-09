# Notes for Windows

## Installation

- Use PowerShell as terminal. Remember to reopen the terminal after the installation of each tool.

- Bun is a JavaScript runtime like Node.js but faster and lighter.
  It is required to run the toolkit on Windows. Install `bun` from https://bun.sh/. It is easy.

- Install the toolkit using `bun`:

    ```sh
    bun install --global "@jutge.org/toolkit"
    ```

    The first time may take a while as `bun` needs to download and compile some dependencies. If it fails with a `mkdir` error, just try again, it seems to be a transient error.

- Check that the installation was successful:

    ```sh
    jtk
    ```

    It should show the help message. You can always add a `--help` flag to any command to get more information.

- Check the tools required by the toolkit:

    ```sh
    jtk doctor
    ```

    It should print information about the installed tools. If any tool is missing, consider installing it and try again. Depending on your workflow, some dependencies may not be necessary.

## Upgrade

Try to use the latest version of the toolkit. Upgrade the toolkit to the latest version with the following command:

```powershell
jtk upgrade
```

Check the version after upgrading:

```powershell
jtk --version
```

## Dependencies

- LaTeX: A LaTeX distribution is required to compile problem statements and get their PDFs. It is not necessary but strongly recommended.

    For Windows, install MiKTeX from https://miktex.org/download. During installation, select the option to install missing packages on-the-fly.

- Pandoc: Pandoc with Lua support is required to convert problem statements to Markdown, Text and HTML. It is not necessary but recommended.

    Install it easily using the Windows Package Manager (`winget`):

    ```powershell
    winget install --id JohnMacFarlane.Pandoc
    ```

- Image Magick: ImageMagick is required to process images in problem statements. It is not necessary but recommended.

    Install it easily using the Windows Package Manager (`winget`):

    ```powershell
    winget install --id ImageMagick.ImageMagick
    ```

- Python 3: You only need Python 3 if you plan to use Python scripts in your problems.

    Install Python from https://www.python.org/downloads/windows/. Make sure to check the option to add Python to the system PATH during installation. The toolkit uses `python3` command to run Python scripts.

- C/C++ Compiler: You only need a C/C++ compiler if you plan to use C/C++ programs in your problems. The toolkit uses `gcc` and `g++` commands to compile C and C++ programs, respectively.

    We suggest using [w64devkit](https://github.com/skeeto/w64devkit), a portable C and C++ development kit for Windows. Here are the steps to install it:
    1. **Download** the latest `.exe` file from https://github.com/skeeto/w64devkit/releases.

    2. **Extract** by double-clicking the downloaded file and choosing a destination (e.g., `C:\w64devkit`).

    3. **Run** `w64devkit.exe` from the extracted folder to open a terminal with gcc and g++ available.

    4. **Test** by typing `gcc --version` in the terminal.

    5. **Compile programs:**

        ```bash
        gcc myprogram.c -o myprogram.exe
        g++ myprogram.cpp -o myprogram.exe
        ```

    Other options are to install [MinGW-w64](http://mingw-w64.org/doku.php) or use the compiler provided by [MSYS2](https://www.msys2.org/).

- Java: You only need Java if you plan to use Java programs in your problems. The toolkit uses the `java` and `javac` commands to run and compile Java programs, respectively.

    Install the Java Runtime Environment (JRE) from https://www.java.com/en/download/manual.jsp. Make sure to download the Windows version.

- Likewise, you may need to install Rust, Haskell and Clojure if you plan to use these languages in your problems. If you know how to install them on Windows, please consider contributing to the documentation.

## Miscellaneous tips

- Open a file with its associated application with `start filename.extension`.

- Show environment variables with `echo $env:VARIABLE`.

- Set environment temporarly variables with `$env:VARIABLE=value`.

- Set environment variables permanently with `[System.Environment]::SetEnvironmentVariable('VARIABLE', 'value', 'User')`.

- Console font doesn't support Unicode: The default console font (Raster Fonts) doesn't support many Unicode characters. Change to a font like "Consolas", "Lucida Console", or "Cascadia Code" in your PowerShell window properties.

```

```
