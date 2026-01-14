# Jutge Toolkit

A powerful command-line toolkit for creating and managing programming problems on the [Jutge.org](https://jutge.org) platform.

## Key Features

- 📝 Create new problems from scratch or using templates
- 🤖 Generate problems using JutgeAI
- 🔧 Compile and test solutions in multiple programming languages
- 📄 Generate PDF statements and other formats automatically
- ✅ Verify solutions against test cases
- ☁️ Upload and update problems directly to Jutge.org
- ✨ Beautiful terminal interface with color output and help

## Installation

The toolkit requires [Bun](https://bun.sh) as a JavaScript runtime. Follow the installation guides for your platform:

- **[Linux Installation Guide](docs/linux-installation.md)** 
- **[macOS Installation Guide](docs/macos-installation.md)** 
- **[Windows Installation Guide](docs/windows-installation.md)** 

### Quick Install

If you already have Bun installed:

```bash
bun install --global @jutge.org/toolkit
```

Verify the installation:

```bash
jtk --version
```

## Getting Started

### Quick Start

```bash
# Get help
jtk 
jtk --help

# Check system dependencies
jtk doctor

# Ask JutgeAI for help (requires API key setup)
jtk ask "How do I create a problem?"

# Clone a template problem interactively
jtk clone

# Generate a new problem with AI
jtk generate problem

# Build problem files
cd my-problem.pbm
jtk make

# Verify a solution
jtk verify solution.py

# Upload to Jutge.org
jtk upload
```

For a complete walkthrough, see the [Getting Started Guide](docs/getting-started-guide.md).

## Documentation

### Essential Guides

- **[Getting Started Guide](docs/getting-started-guide.md)** - Complete guide to using the toolkit
- **[Problem Anatomy](docs/problem-anatomy.md)** - Understanding problem structure and files
- **[JutgeAI Features](docs/jutge-ai.md)** - Using AI to generate content

### Installation Guides

- **[Linux Installation](docs/linux-installation.md)** - Installation steps for Linux
- **[macOS Installation](docs/macos-installation.md)** - Installation steps for macOS
- **[Windows Installation](docs/windows-installation.md)** - Installation steps for Windows

## Common Commands

```bash
# Configuration
jtk config show                     # View current configuration
jtk config set <key> <value>        # Set a configuration value
jtk config edit                     # Edit configuration file

# Problem Creation
jtk clone [template]                # Clone a template problem
jtk generate problem                # Generate problem with AI
jtk generate translations en es ca  # Add statement translations
jtk generate solutions python cpp   # Generate solutions in other languages

# Building and Testing
jtk make                            # Build all problem elements
jtk make pdf                        # Generate PDF statements only
jtk verify <program>                # Test a solution
jtk clean                           # Clean temporary files

# Publishing
jtk upload                          # Upload problem to Jutge.org

# Maintenance
jtk upgrade                         # Update to latest version
jtk doctor                          # Check system dependencies
jtk about                           # Show toolkit information
```

## Requirements

### Core Requirements
- [Bun](https://bun.sh) - JavaScript runtime (required)

### Optional Dependencies
- **LaTeX** (for PDF generation) - texlive-xetex, texlive-fonts-recommended
- **Pandoc** (for format conversion)
- **Programming language compilers/interpreters** - Python, GCC/G++, Java, etc. (depending on your needs)

Run `jtk doctor` to check which dependencies are installed on your system.

## Support

- **Documentation:** Check the [docs](docs/) folder for detailed guides
- **Get Help:** Use `jtk ask "your question"` to get AI-powered assistance
- **Issues:** Report bugs and feature requests on [GitHub Issues](https://github.com/jutge-org/jutge-toolkit/issues)
- **Community:** Visit [Jutge.org](https://jutge.org) for the problem platform

## License

Copyright © Jutge.org. All rights reserved.
