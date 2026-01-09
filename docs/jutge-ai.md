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

    - You can generate `award.png` and `award.html` files for the problem. (Note: `award.png` requires `dall-e-3` model access.)

As in any other use of AI and LLMs, it is important to review and validate the generated content to ensure its correctness and quality. Treat the generated content as a first draft that needs to be refined and validated.

In order to use the Jutge<sup>AI</sup> features of the toolkit, you need to have API keys for the models you wish to use. You should get the keys from the respective providers and set them as environment variables in your system. Because of the costs associated to the use of these models, the toolkit or Jutge.org cannot provide these keys directly.

UPC users can get free access to Gemini models through their institutional Google accounts. These work well with Jutge<sup>AI</sup> features but have usage limits. If you need more capacity, consider using an OpenAI API key.

## How to get Gemini API key

1. Visit Google AI Studio:

    Go to [aistudio.google.com](https://aistudio.google.com/) and sign in with your Google Account.

2. Access the API Section:

    Click on the **Get API key** button located in the left-hand sidebar menu.

3. Generate the Key:
    - Click the **Create API key** button.
    - You will have two options: **Create API key in new project** (recommended for beginners) or **Create API key in existing project.**
    - Select your preference, and the system will generate a unique key for you.

4. Secure Your Key:

    Copy the generated key immediately.

5. Set `GEMINI_API_KEY` environment variable with the obtained key to use it in the toolkit. This will make models such as `google/gemini-2.5-flash` or `google/gemini-2.5-flash-lite` available for Jutge<sup>AI</sup> features.

## How to get OpenAI API key

1. Create an OpenAI Account:

    Go to the OpenAI website and sign up (or log in if you already have an account).

2. Access the API Dashboard:

    After logging in, open the **API dashboard** from your account menu.

3. Create an API Key:
    - Navigate to **API Keys**.
    - Click **Create new secret key**.
    - Copy the key immediately (it will not be shown again).

4. Secure Your Key: Copy the generated key immediately.

5. Set `OPENAI_API_KEY` environment variable with the obtained key to use it in the toolkit.This will make models such as `openai/gpt-5-mini` or `openai/gpt-5-nano` available for Jutge<sup>AI</sup> features.

## Other models

We use `multi-llm-ts` package to interface with different models. If you have access to other models supported by this package, you can set the corresponding environment variables as described in the [multi-llm-ts documentation](https://github.com/nbonamy/multi-llm-ts) to use them with Jutge<sup>AI</sup> features.
