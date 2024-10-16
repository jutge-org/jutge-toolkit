"""
Common utilities
"""

import os
import shutil
import socket
import tempfile
import time
from typing import Any, TypeVar

import chardet
import yaml


# ----------------------------------------------------------------------------
# Environment
# ----------------------------------------------------------------------------


def get_username() -> str:
    """Returns the username of the current user."""

    user = os.getenv("USER")
    if user is None:
        return "unknown"
    else:
        return user


def get_hostname() -> str:
    """Returns the hostname of the current machine."""

    return socket.gethostname()


# ----------------------------------------------------------------------------
# Utilities for lists
# ----------------------------------------------------------------------------

T = TypeVar("T")


def intersection(a: list[T], b: list[T]) -> list[T]:
    """Returns the intersection of two lists."""

    return list(filter(lambda x: x in a, b))


# ----------------------------------------------------------------------------
# Utilities for general directories
# ----------------------------------------------------------------------------


def read_file(name: str) -> str:
    """Returns a string with the contents of the file name."""

    try:
        fd = open(name, "r")
        r = fd.read()
        fd.close()
    except Exception:
        fd = open(name, "rb")
        char_detection = chardet.detect(fd.read())
        fd.close()

        f = open(name, encoding=char_detection["encoding"], errors="ignore")
        r = f.read()
        f.close()
    return r


def write_file(name: str, txt: str = "") -> None:
    """Writes the file name with contents txt."""

    f = open(name, "w")
    f.write(txt)
    f.close()


def del_file(name: str) -> None:
    """Deletes the file name. Does not complain on error."""

    try:
        os.remove(name)
    except OSError:
        pass


def file_size(name: str) -> int:
    """Returns the size of file name in bytes."""

    return os.stat(name).st_size


def tmp_dir() -> str:
    """Creates a temporal directory and returns its name."""

    return tempfile.mkdtemp(".dir", get_username() + "-")


def tmp_file() -> str:
    """Creates a temporal file and returns its name."""

    return tempfile.mkstemp()[1]


def file_exists(name: str) -> bool:
    """Tells whether file name exists."""

    return os.path.exists(name)


def copy_file(src: str, dst: str) -> None:
    """Copies a file from src to dst."""

    shutil.copy(src, dst)


def move_file(src: str, dst: str) -> None:
    """Recursively move a file or directory to another location."""

    shutil.move(src, dst)


# ----------------------------------------------------------------------------
# Utilities for yml files
# ----------------------------------------------------------------------------


def print_yml(inf: Any) -> None:
    """Prints the yaml representation of inf."""

    print(yaml.dump(inf, indent=4, width=1000, default_flow_style=False))


def write_yml(path: str, inf: Any) -> None:
    """Writes the yaml representation of inf to path."""

    yaml.dump(inf, open(path, "w"), indent=4, width=1000, default_flow_style=False)


def read_yml(path: str) -> Any:
    """Reads the yaml representation of inf from path."""

    return yaml.load(open(path, "r"), Loader=yaml.FullLoader)


# ----------------------------------------------------------------------------
# Utilities for directories
# ----------------------------------------------------------------------------


def del_dir(path: str) -> None:
    """Deletes the directory path. Does not complain on error."""

    try:
        shutil.rmtree(path)
    except OSError:
        pass


def mkdir(path: str) -> None:
    """Makes the directory path. Does not complain on error."""

    try:
        os.makedirs(path)
    except OSError:
        pass


# ----------------------------------------------------------------------------
# Utilities for time
# ----------------------------------------------------------------------------


def current_time() -> str:
    """Returns a string with out format for times."""

    return time.strftime("%Y-%m-%d %H:%M:%S")


# ----------------------------------------------------------------------------
# Misc
# ----------------------------------------------------------------------------


def convert_bytes(num: float) -> str:
    """Converts bytes to Mb, Gb, etc"""

    step_unit = 1000.0  # 1024 bad the size

    for x in ["bytes", "Kb", "Mb", "Gb", "Tb"]:
        if num < step_unit:
            if x == "bytes":
                return f"{int(num)} {x}"
            else:
                return f"{num:3.1f} {x}"
        num /= step_unit
    raise Exception("Size too big")


def system(cmd: str) -> int:
    """As os.system(cmd) but writes cmd first."""

    print(cmd)
    return os.system(cmd)
