# Conventions

Patterns this team follows. Update when a PR establishes or changes one.

New conventions should flow through `PROPOSED-CHANGES.md` first (see `REFLECTION.md`). Direct edits here are fine for human-initiated changes; agents should propose, not mutate.

## Process
Canonical rules live in the root `CLAUDE.md`. Highlights relevant to PR docs:
- Branch naming: `<handle>/<slug>` (or team prefixes like `feat/`, `fix/`, `chore/`, `docs/`).
- PRs target `main`.
- Squash merge. The squash SHA on `main` is what goes in `commit_sha` of the PR doc.
- Run `node scripts/regen-pr-index.mjs --check` locally before pushing. CI may or may not enforce it yet.
- Both `.github/PULL_REQUEST_TEMPLATE.md` (short, for the GitHub UI) and a `docs/PRs/PR-*.md` file (long-term context) are required on every PR.

## Architecture
None yet — populated as PRs establish patterns.

## Libraries
None yet — populated as PRs establish patterns.

## Naming
None yet — populated as PRs establish patterns.

## Anti-patterns
None yet — populated as PRs establish patterns.

## Testing
None yet — populated as PRs establish patterns.

## Security
Any security-sensitive change (auth, input validation, secrets, CSRF, RBAC) must fill the Security Impact section and flag the change for human review. Specific guardrail paths should be listed in root `CLAUDE.md`.
