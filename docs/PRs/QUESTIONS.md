# PR Questions by Change Type

Used by the PR creation prompt. Batch all relevant questions into one message.

## All types (always ask)
1. Main change in one short line (≤80 chars, imperative voice)? (feeds `main_change`)
2. What systems or files are affected? (feeds `files_touched`)
3. What could break this in the future?
4. Any env var additions (`+VAR`), removals (`-VAR`), or renames (`~VAR`)? (feeds `env_changes`)
5. Any database migrations included in this PR? (feeds `database_migrations`)
6. Any security-sensitive paths touched — auth, input validation, secrets, CSRF, RBAC? (feeds Security Impact section; see root `CLAUDE.md` guardrails)
7. Rollback complexity — low (revert only), medium (revert + config/env), or high (data migration / manual steps)? (feeds `rollback_complexity`)
8. 2–4 keyword tags, kebab-case? (feeds `tags`)
9. Prior PRs this builds on or relates to, as `pr_id`s or URLs? (feeds `depends_on` / `related_prs`)
10. Authored by human or agent? If agent, which model? (feeds `authored_by` / `model`)
11. Does this PR introduce a reusable pattern worth naming? (feeds `establishes_pattern`; blank is fine)
12. Does anything in this PR contradict how a prior PR did something similar? If so, which `pr_id`? (feeds `## Pattern Observations > Contradicts prior PR`; needs human review)
13. Any question or frontmatter field that felt unhelpful on this PR, or one you wish existed? (feeds self-evolution loop via `## Pattern Observations`)

## feature
1. Motivation?
2. User-facing impact?
3. Alternatives considered and rejected, with reasons?
4. Metrics to track success?

## bugfix
1. Root cause?
2. Reproduction steps?
3. Why wasn't it caught earlier?
4. Other places this bug pattern might exist?

## refactor
1. What's better now?
2. Any behavior changes?
3. Performance delta?

## chore
1. Motivation?
2. Any risk of behavior change?

## breaking
1. Migration path for consumers?
2. Deprecation timeline?
3. Who or what is affected?
4. Rollback plan?
