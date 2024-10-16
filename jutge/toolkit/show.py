from colorama import Fore, Style


def command(message: str, end: str = "\n") -> None:
    """Prints the command message."""

    print(f"{Fore.BLUE}{message}{Style.RESET_ALL}", end=end)


def success(message: str, end: str = "\n") -> None:
    """Prints the success message"""

    print(f"{Fore.GREEN}{message}{Style.RESET_ALL}", end=end)


def error(message: str, end: str = "\n") -> None:
    """Prints the error message"""

    print(f"{Fore.RED}{message}{Style.RESET_ALL}", end=end)
