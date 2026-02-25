# Task: Generate Hard Input Test Cases

Write a program in Python that generates hard input test cases according to the specification of the given problem statement.

## Important:

- The program should not read any data and should write to standard output.

- Its main program should be as follows:

```
if __name__ == "__main__":
    generate_hard_test_cases()
```

- Do not change the main program.

- Add a docstring to `generate_hard_test_cases` explaining what the program does and what categories of random test cases it generates.

- Add inline comments explaining each test case category.

- Hard cases are those that are specifically designed to challenge the correctness of the algorithms solving the problem, but not its efficiency.

- Hard test cases should include:
    - Edge cases that are not covered by typical random test cases.
    - Corner cases that exploit known weaknesses in common algorithms for the problem.
    - Cases that require careful handling of special conditions or constraints.
    - Common pitfalls that might cause incorrect solutions.
    - Degenerate cases that test the robustness of the solution.

- But the hard test cases should match the problem constraints.

- Do not generate random test cases.

- Do not generate test cases to test performance or efficiency.

- Use type hints when necessary. Do not use old-style type hints such as `List[int]` with `List` imported from `typing`, but use modern syntax such as `list[int]`.

- Do not use any non-standard libraries.

- Ensure that the generated Python code follows best practices, including proper indentation, use of functions, and adherence to PEP 8 style guidelines.

- Only provide the code for the program, without any additional explanations or text.

## Problem statement

{{statement}}
