# Additional guidelines for Python

- Use f-strings for string formatting when possible.

- Use type hints for function definitions. Do not use old-style type hints such as `List[int]` with `List` imported from `typing`, but use modern syntax such as `list[int]`.

- Ensure that the generated Python3 code follows best practices, including proper indentation, use of functions, use of docstrings, and adherence to PEP 8 style guidelines.

# Very important

Do not use `input()`, `sys.stdin()`, or `EOFError` to read input as data can be placed freely across many lines. Instead, use the `yogi` library:

`yogi` provides three functions for reading typed input:

**`read(type)`** - Returns the next token as `int`, `float`, or `str`. Raises exception if input ends or type mismatches.

```python
from yogi import read
x = read(int)  # reads and returns one integer
```

**`scan(type)`** - Like `read()`, but returns `None` instead of raising exceptions when input ends or type mismatches.

```python
from yogi import scan
s = 0
x = scan(int)  # returns int or None
while x is not None:
    s += x
    x = scan(int)  # returns int or None
print(s) # prints the sum of all the integers in the input
```

**`tokens(type)`** - Iterator that yields tokens of specified type until input ends. Raises exception on type mismatch.

```python
from yogi import tokens
s = 0
for x in tokens(int):  # iterates over all integers in the input
    s += x
print(s) # prints the sum of all the integers in the input
```

In yogi functions, `type` can be `int`, `float`, or `str`.
