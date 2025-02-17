# TestigProyect

Github repository to be as practice during the course that would help with the project.

Here we can find .gitignore, .github folder with codeowners file and pull request template, simple hello world program and also different settings for the project repository.

## Conventional Commits

This repository follows the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/#specification) for commit messages.

### Commit Message Format

Each commit message must be structured as follows:

type[optional scope]: description

[optional body]

[optional footer(s)]

- **type**: Describes the category of the change (e.g., feat, fix, docs, style, refactor, test, chore).
- **optional scope**: A noun describing a section of the codebase (e.g., fix(parser)).
- **description**: A short summary of the change.
- **optional body**: Additional contextual information.
- **optional footer**: Metadata such as BREAKING CHANGE.

### Example Commit Messages

- feat(auth): add login functionality
- fix(api): resolve issue with data fetching
- docs: update README with installation steps

### Breaking Changes

Breaking changes must be indicated by adding ! after the type or by including BREAKING CHANGE: in the footer.

---

### GitHub Action for Conventional Commits

This repository uses the [webiny/action-conventional-commits](https://github.com/webiny/action-conventional-commits) GitHub Action to enforce Conventional Commits.

A GitHub Action workflow is set up in .github/workflows/conventional-commits.yml to verify that all commit messages adhere to the Conventional Commits specification. Any commits that do not follow the specification will fail the workflow and must be corrected before merging.