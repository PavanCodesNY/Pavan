# Reflection Loop

This documentation system is **self-evolving**: conventions, questions, and the template itself should improve as PRs accumulate. Reflection is the mechanism.

## Principle
No automated rule change ships without human approval. Agents **propose**; humans **ratify**. The queue lives in `PROPOSED-CHANGES.md`.

## When to run
- After every 5 merged PR docs, or
- Quarterly, whichever comes first, or
- On demand when something feels off.

## How to run

### Heuristic pass (script)
```
node scripts/reflect-pr-docs.mjs
```
The script scans all PR docs, detects signals, and appends proposals to `PROPOSED-CHANGES.md`. It is **additive** — it never mutates `CONVENTIONS.md`, `QUESTIONS.md`, `PR-TEMPLATE.md`, or existing proposals. Re-running is idempotent: proposals are keyed and duplicates are skipped.

### Agent pass (judgment)
After the script runs, an agent (or human) should also do a judgment pass the script can't do:
1. Read recent `## Decision Log` entries. Are any decisions getting repeated across PRs? That's a convention waiting to be written.
2. Read recent `## Pattern Observations` sections. Are authors flagging the same pain point? That's a question/field change waiting to happen.
3. Read recent `## Rollback` sections. Are the same rollback steps repeating? That's a runbook convention.
4. Append findings to `PROPOSED-CHANGES.md` with `source: agent-judgment` and `needs_human: true`.

## Signals the script looks for
- **Dead field** — a frontmatter field blank/default across ≥5 consecutive PRs → propose removing or making optional.
- **Dead question** — `QUESTIONS.md` question answered `N/A` / blank across ≥5 PRs (requires authors to mark; surfaced via `## Pattern Observations`) → propose removing.
- **Recurring pattern** — same `establishes_pattern` value in ≥2 PRs → propose adding to `CONVENTIONS.md`.
- **Recurring tag** — same tag in ≥3 PRs → propose adding to a recognized-tags list.
- **Contradiction** — a PR's `## Pattern Observations > Contradicts prior PR` field is non-empty → needs human review, never auto-resolved.
- **Thin rollback on high-complexity PRs** — `rollback_complexity: high` but rollback section under 120 chars → flag for review.
- **Invariant drift** — same invariant violation appearing across multiple PRs → propose tightening the validator OR loosening the invariant (human decides).

## How the human review works
1. Open `PROPOSED-CHANGES.md`. Each proposal has a status: `proposed` (default), `accepted`, `rejected`.
2. For `proposed` items where `needs_human: true`, review and either:
   - Set `status: accepted` and apply the change manually to the target file (CONVENTIONS.md / QUESTIONS.md / PR-TEMPLATE.md / regen script / invariants list).
   - Set `status: rejected` with a one-line reason so the same proposal doesn't return.
3. For `status: accepted` items, once the target file is updated, move the proposal to the `## Applied` section at the bottom.
4. Never delete a rejected proposal — keep it so the same idea isn't re-proposed.

## What the script will NOT do
- Rewrite `CONVENTIONS.md` / `QUESTIONS.md` / `PR-TEMPLATE.md` directly.
- Delete rejected or applied proposals.
- Decide when a pattern is "ready" to become a convention — that's judgment.
- Resolve contradictions between PRs.

## Asking for human input mid-PR
An agent drafting a PR doc should pause and ask the human if any of these are true:
- The PR touches a security-guardrail path in `CLAUDE.md`.
- `## Pattern Observations > Contradicts prior PR` is non-empty.
- `rollback_complexity: high` and the agent isn't sure of the steps.
- A frontmatter invariant would need to be bent to describe the change honestly.
