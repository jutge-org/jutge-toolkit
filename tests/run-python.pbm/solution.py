from typing import Optional


def average(s: set[float]) -> float:
    return sum(s) / len(s)


def different_elements(l1: list[int], l2: list[int]) -> int:
    return len(set(l1) | set(l2))


def has_duplicates(L: list[int]) -> bool:
    return len(L) != len(set(L))


def extraneous(l1: list[str], l2: list[str]) -> str:
    return list(set(l2) - set(l1)).pop()


def extraneous_maybe(l1: list[str], l2: list[str]) -> Optional[str]:
    for x in set(l2) - set(l1):
        return x
    return None


def different_words(s: str) -> int:
    return len(set(s.lower().split()))
