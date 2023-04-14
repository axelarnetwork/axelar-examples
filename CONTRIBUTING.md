## Contributing to Axelar Examples

We appreciate your interest in contributing to Axelar Examples! This document `CONTRIBUTING.md` provides a high-level overview of how you can get involved.

### Table of Contents
  * [Introduction](#introduction)
  * [Getting Started](#getting-started)
  * [Issues](#issues)
  * [Pull Requests](#pull-requests)
  * [Code of Conduct](#code-of-conduct)

### Introduction

`Axelar Examples` is a collection of examples and tutorials for the Axelar Network. Before you start, we encourage you to read the rest of this document, which contains information on how and what you can contribute.

### Getting Started

If you are new to the Axelar Network, we encourage you to read the [Axelar Documentation](https://docs.axelar.network/) to learn more about the Axelar Network and how to get started. 

If you are new to contributing to open-source projects, we encourage you to read [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/). If you are new to contributing to Axelar, we encourage you to read [`CONTRIBUTING.md`](./CONTRIBUTING.md) in the Axelar examples repository.


Before you start contributing, you need to:

1. Fork the repository and clone it to your local machine.
2. Create a new branch for your contribution.
3. Install the dependencies for the project as indicated in the [README.md](https://github.com/axelarnetwork/axelar-examples#readme) file.
4. Make your changes and commit them to your local repository.

Once you've completed these steps, you can contribute to Axelar Examples!

### Issues

If you find a bug in the source code or a mistake in the documentation, you can help us by submitting an issue to our [GitHub Repository](https://github.com/axelarnetwork/axelar-example/issues). 

When you open a new issue, please provide as much detail as possible, including steps to reproduce the problem and the expected behaviour. Even better, you can submit a Pull Request with a fix.

### Pull Requests

Before you submit your Pull Request (PR) consider the following guidelines:

1. Search [GitHub project](https://github.com/axelarnetwork/axelar-example/issues) for an open or closed PR related to your submission. You don't want to duplicate effort.
2. Make your changes in a new git branch:
   ```shell
   git checkout -b my-fix-branch
   ```
3. Create your patch, **including appropriate test cases**.
4. Run the entire test suite, and ensure all tests pass.
5. Commit your changes using a descriptive commit message that follows our [commit message conventions](https://www.conventionalcommits.org/en/v1.0.0/). 
   ```shell
   git commit -a
   ```
   Note: the optional commit `-a' command line option will automatically "add" and "rm" edited files.
6. Push your branch to GitHub:
   ```shell
   git push origin my-fix-branch
   ```
7. If we suggest changes then:
   * Make the required updates.
   * Re-run the test suites to ensure tests are still passing.
   * Rebase your branch and force push to your GitHub repository (this will update your Pull Request)
   * Wait for the project maintainer to review your changes and merge your Pull Request.
8. Your commit message should follow the pattern: `<type>[optional scope]`: `<description>`.

* `type` refers to :
	* `[Feat]`: A new feature
	* `[Fix]`: A bug fix
	* `[Refactor]`: Code refactoring
	* `[Test]`: Additions or modifications to test cases
	* `[Docs]`: README, or anything related to documentation
	* `[Chore]`: Regular code maintenance

`[optional scope]:` refers to the section of the codebase you're working on (e.g. example-web, etc.)

`description`: A summary providing additional contextual information about the code changes.

Open a pull request from your forked repository to the original repository.

### Code of Conduct

We pledge to create a harassment-free experience for everyone in our project and community, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

#### Our Standards:
We expect all participants to use welcoming and inclusive language, respect differing viewpoints and experiences, gracefully accept constructive criticism, focus on what's best for the community, and show empathy towards other members. 

Unacceptable behaviour includes:
- Using sexualized language or imagery.
- Personal attacks.
- Public or private harassment.
- Publishing others' confidential information without explicit permission.
- Any other conduct that could be considered inappropriate in a professional setting.

#### Our Responsibilities:
As project maintainers, we clarify the standards of acceptable behaviour and take appropriate corrective action in response to unacceptable behaviour. 

We also reserve the right to remove or reject any contributions that do not align with this Code of Conduct or to temporarily or permanently ban any contributor who exhibits inappropriate, threatening, offensive, or harmful behaviour.
