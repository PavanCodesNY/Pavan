---
pr_id: PR-YYYY-MM-DD-kebab-change           # must match filename stem exactly
date: YYYY-MM-DD                            # authoritative sort key; ISO date
commit_sha:                                 # squash-merge SHA on main; blank while status: open
branch:                                     # source branch name only, e.g. PavanCodesNY/foo
target_branch: main            # this repo targets main
main_change:                                # one short line, imperative voice, <= 80 chars
type: feature                               # feature | bugfix | refactor | chore | breaking
status: open                                # open | merged | closed | reverted | superseded
superseded_by:                              # pr_id of replacement; required iff status: superseded
breaking_change: false                      # must be true when type: breaking
authored_by: human                          # human | agent
model:                                      # model id if authored_by: agent (e.g. claude-opus-4-7); blank otherwise
author:                                     # GitHub handle, e.g. PavanCodesNY
github_pr:                                  # integer PR number once opened; blank while drafting locally
files_touched: []                           # authoritative list of paths; keep in sync with git diff
depends_on: []                              # pr_ids this builds on (frontmatter is authoritative)
related_prs: []                             # pr_ids or full GitHub URLs for cross-references
tags: []                                    # kebab-case labels for search; aim for 2-4
establishes_pattern:                        # short kebab-case name if this PR introduces a reusable pattern; blank otherwise. Feeds self-evolution loop.
env_changes: []                             # env var names added/removed/renamed, prefixed + / - / ~
database_migrations: false                  # true if a DB migration is included in this PR
rollback_complexity: low                    # low (revert) | medium (revert + config/env) | high (data migration / manual steps)
---

## Summary
One paragraph. What changed, why, user-facing impact.

## Decision Log
Document what was chosen AND what was rejected. Highest-value section for future agents. Duplicate the block below for each distinct decision.

### Decision: [name]
- **Chose:** 
- **Rejected:** [option] because [reason]
- **Rejected:** [option] because [reason]
- **Why this matters later:** 

## Files Touched
Expand each entry from the `files_touched` frontmatter with its role in this change. Frontmatter is authoritative — if this section and the frontmatter list disagree, the frontmatter wins.

- `path/to/file.ts`: one-line role in this change

## Dependencies
Frontmatter `depends_on` and `related_prs` are authoritative for machine parsing. Use this section for prose context the frontmatter can't capture.

- **Builds on:** prior PRs or systems
- **Enables:** what this unlocks downstream
- **Will break if:** upstream changes that would break this

## Testing
- **Tested:** 
- **Coverage gaps:** 
- **Edge cases handled:** 

## Security Impact
Touched any auth, input validation, secrets, CSRF, or RBAC paths? If yes, describe the review done. If no, write `None` with a one-line reason. Security-critical paths flagged in root `CLAUDE.md` must never be weakened silently.

## Known Limitations
Shortcuts or tech debt introduced, with reason.

## Rollback
Concrete steps. Include env vars, DB state, config reverts. Add as many steps as needed.

- 

## Agent Handoff Notes
For the next agent modifying this code without other context.
- If you touch [X], also check [Y]
- [Anything that looks wrong but is intentional, with reason]
- [Non-obvious invariants]

## Pattern Observations
Did anything in this PR feel like a pattern worth spreading, or a contradiction with how the team usually does things? This feeds the self-evolution loop (see `REFLECTION.md`).
- **New pattern seen:** [short name + one-line description, or `None`]
- **Contradicts prior PR:** [`pr_id` + brief note, or `None`]
- **Question/field that felt unhelpful:** [which question or frontmatter field, and why, or `None`]
- **Question/field we wish existed:** [proposed addition, or `None`]
