# Git Workflow

## Branch Strategy

`main` is the protected, deployable branch. Create short-lived branches from the latest `main` and merge through reviewed pull requests.

| Branch type | Pattern | Example |
| --- | --- | --- |
| Feature | `feature/<short-description>` | `feature/carbon-transactions-api` |
| Fix | `fix/<short-description>` | `fix/emission-factor-validation` |
| Documentation | `docs/<short-description>` | `docs/api-contract` |
| Chore | `chore/<short-description>` | `chore/update-prisma` |
| Release hotfix | `hotfix/<short-description>` | `hotfix/auth-token-expiry` |

Keep one focused concern per branch. Update from `main` before review; do not force-push shared branches without team agreement.

## Commit Messages

Use Conventional Commit-style, imperative messages:

```text
feat(carbon): add emission transaction creation
fix(auth): reject expired access tokens
docs(api): define reward redemption contract
test(departments): cover duplicate department code
chore(deps): update NestJS patch version
```

Format: `<type>(<optional scope>): <short imperative summary>`. Valid types include `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, and `ci`. Keep subjects under 72 characters. Explain material behaviour, migrations, or breaking changes in the body.

## Pull Requests

Describe the problem, solution, verification, API/schema impact, and deployment or data-migration steps. Link relevant issues. Request review after linting, tests, and documentation are current. Database migrations are append-only once shared; never edit or delete a migration applied outside a local database.
