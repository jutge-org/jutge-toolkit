# Jutge<sup>AI</sup> features

The toolkit offers integration with Jutge<sup>AI</sup>, allowing users to leverage advanced AI models to help preparing problems.

In particular, Jutge<sup>AI</sup> features can assist in:

- Creating problems from scratch:
    - You first need to provide a title and a brief description of the problem you want to create.

        An example description could be: "_A problem where the user has to implement a function that calculates the factorial of a number using recursion and a main program that reads all integers from input and prints their factorial. Add a cute short story around it._"

        Be specific in the description to get better results.

    - Then, you need to choose the original language of the problem (use English for better results) and the programming language of the golden solution.

    - After that, you can ask for more statement languages and more programming languages for the solutions.

    - The AI will generate the problem statement, the golden solution, and a test suite including sample and private test cases.

    - Moreover, you can also ask to generate test case generators, that is, programs that generate test cases for the problem. There are three types of test case generators:
        - Random test case generators: programs that generate random test cases.
        - Hard case generators: programs that generate test cases that cover edge cases.
        - Efficient case generators: programs that generate large test cases to test the efficiency of the solutions.

- Extending existing problems:
    - You can use Jutge<sup>AI</sup> features to add new statement languages from the original language.

    - You can also generate solutions in other programming languages from the golden solution.

    - You can create new test case generators to extend the existing test suite.

    - You can generate `award.png` and `award.html` files for the problem.

As in any other use of AI and LLMs, it is important to review and validate the generated content to ensure its correctness and quality. Treat the generated content as a first draft that needs to be refined and validated.

# Jutge<sup>AI</sup> models

The toolkit currently supports the following models:

### Google Gemini

Google Gemini is fast and free for UPC users but its rate limits are so low it is almost impossible to use it for practical purposes.

Available models:

- google/gemini-2.5-flash
- google/gemini-2.5-flash-lite

### OpenAI GPT

OpenAI is slower but more reliable and has a higher rate limit. However, it is not free and requires a paid account.

Available models:

- openai/gpt-5-nano
- openai/gpt-5-mini
- openai/gpt-4.1-nano
- openai/gpt-4.1-mini

See https://platform.openai.com/docs/pricing for the pricing of the OpenAI models.

### Recommendation

Try to use `gpt-4.1-nano` or `gpt-4.1-mini` for the quickest results. If you need more reliable results, use `gpt-5-nano` or `gpt-5-mini`. As could be expected, the larger the model, the more reliable the results and the slower the generation.

# Jutge<sup>AI</sup> costs

In order to use the Jutge<sup>AI</sup> features of the toolkit, we have allocated a small budget to cover the costs associated to pay for the use of the models. This budget is shared by all instructors of Jutge.org. Jutge.org records the costs incurred for each instructor as estimated from input and output token counts. Rate limits are applied to avoid abuse or misuse.

Please contact the Jutge.org team if you need to increase your budget.
