# PR Documentation

Every PR writes a context package here. Purpose: any agent (human or AI) modifying the same code later gets full context in under 60 seconds.

## Files
- `PR-TEMPLATE.md`: copy for every new PR
- `INDEX.md`: regenerated list, newest first
- `CONVENTIONS.md`: patterns this team follows
- `QUESTIONS.md`: branched question sets for the PR creation prompt
- `REFLECTION.md`: how the system self-evolves (reflection loop)
- `PROPOSED-CHANGES.md`: queue of agent-proposed updates awaiting human review
- `archive/`: older PRs moved here manually when the top-level list gets noisy

## Naming
`PR-YYYY-MM-DD-kebab-main-change.md`

## Relationship to `.github/PULL_REQUEST_TEMPLATE.md`
Two templates exist and both are required. They serve different audiences:
- `.github/PULL_REQUEST_TEMPLATE.md` — fills the GitHub PR description. Audience: reviewer looking at the PR right now. Short.
- `docs/PRs/PR-<date>-<slug>.md` (this directory) — long-term context package. Audience: a future agent modifying this code months later with no other context.

Both must ship in the same PR. The GitHub template can link to the docs file: `See docs/PRs/PR-YYYY-MM-DD-<slug>.md for full context.`

## Rules

### Placeholders
- Never leave placeholder text in a real PR doc. Replace every `[bracketed]` token with real content, or delete the line if the field doesn't apply. Do **not** delete surrounding markdown structure (e.g. in `### Decision: [name]`, replace only `[name]`; keep the `### Decision: ` prefix).
- `"None"` with a one-line reason is a valid replacement (e.g. `**Not tested:** None — pure type change, build coverage sufficient`).
- This placeholder rule does not apply to `PR-TEMPLATE.md` itself — its placeholders are scaffolding to be copied.

### Frontmatter
- Frontmatter is parsed by agents and the regen script. Keep field names stable; add fields only by also updating `PR-TEMPLATE.md` and the validator.
- The `date:` frontmatter field is authoritative for sorting. The date in the filename is for humans scanning the directory and may drift.
- `pr_id` must match the filename exactly (minus the `.md` extension). If `date:` is corrected after the PR is created, leave `pr_id` and the filename alone — `date:` is the sort key, `pr_id` is a stable handle.

### Frontmatter invariants (validator checks these)
- `type: breaking` ⇒ `breaking_change: true`. `type` wins if they disagree.
- `status: superseded` ⇒ `superseded_by:` must be a non-empty `pr_id`. And vice versa.
- `authored_by: human` ⇒ `model:` must be blank. `authored_by: agent` ⇒ `model:` must be set.
- `commit_sha:` must be blank for `status: open` or `status: closed` (never reached `main`). `status: merged`, `reverted`, or `superseded` all require a `commit_sha` (the squash SHA on `main`).
- `github_pr:` is an integer or blank. Blank is allowed only while `status: open`.

### Workflow
1. Copy `PR-TEMPLATE.md` to `PR-YYYY-MM-DD-<kebab-main-change>.md` on your **feature branch**, before opening the PR. Commit it alongside the code change.
2. Leave `commit_sha:` and `github_pr:` blank until merge. This repo squash-merges (`main` target) — once the PR is merged, open a tiny follow-up commit (or let a sweeper agent do it) that fills in `commit_sha` (the squash SHA on `main`), sets `status: merged`, and fills `github_pr`.
3. Regenerate `INDEX.md` in the same commit as any PR-doc add/edit. Run `node scripts/regen-pr-index.mjs` (writes) or `node scripts/regen-pr-index.mjs --check` (CI-friendly, exits non-zero on any invariant violation or stale INDEX).
4. If a PR is closed without merging, open a follow-up PR against `main` that sets `status: closed` on the doc. Keep the doc — it still records the decision to not ship. Do not delete.
5. If a later PR supersedes this one, set `status: superseded` and `superseded_by: <replacement-pr_id>` in a follow-up commit. The replacement's doc should list the superseded doc in `related_prs`.
6. Update `CONVENTIONS.md` when a PR establishes or changes a pattern.
7. **Reflection** — after every 5 merged PR docs (or quarterly), run `node scripts/reflect-pr-docs.mjs`. It appends proposals to `PROPOSED-CHANGES.md`. A human reviews, accepts/rejects, and applies accepted proposals to `CONVENTIONS.md` / `QUESTIONS.md` / `PR-TEMPLATE.md`. See `REFLECTION.md`.

## Self-evolution
This system is designed to improve itself as PRs accumulate. Agents **propose** changes; humans **ratify** them. No automated rule change ships without human approval. See `REFLECTION.md` for the loop, and `PROPOSED-CHANGES.md` for the queue. An agent drafting a PR doc must also pause and ask the human when:
- the PR touches a security-guardrail path in root `CLAUDE.md`,
- `## Pattern Observations > Contradicts prior PR` is non-empty,
- `rollback_complexity: high` and the rollback steps are unclear,
- a frontmatter invariant would need to be bent to describe the change honestly.
