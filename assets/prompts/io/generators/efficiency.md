# Task: Generate Efficiency Input Test Cases

Write a program in Python that generates efficiency input test cases according to the specification of the given problem statement.

## Important:

- The program should not read any data and should write to standard output.

- Its main program should be as follows:

```
if __name__ == "__main__":
    num_cases = int(sys.argv[1])
    generate_efficiency_test_cases(num_cases)
```

- Do not change the main program.

- Add a docstring to `generate_efficiency_test_cases` explaining what the program does and what categories of random test cases it generates.

- Add inline comments explaining each test case category.

- Efficiency test cases are those that are specifically designed to challenge the performance and efficiency of the algorithms solving the problem, but not their correctness.

- Efficiency test cases should match the problem constraints.

- The number of test cases to generate is given as the first command-line argument in the `num_cases` variable.

- Do not generate random test cases.

- Use type hints when necessary. Do not use old-style type hints such as `List[int]` with `List` imported from `typing`, but use modern syntax such as `list[int]`.

- Do not use any non-standard libraries.

- Ensure that the generated Python code follows best practices, including proper indentation, use of functions, and adherence to PEP 8 style guidelines.

- Only provide the code for the program, without any additional explanations or text.

## Problem statement

{{statement}}
