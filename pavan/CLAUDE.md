@AGENTS.md

## Auto-Documentation

When creating a PR, always update the `docs/` folder (at the repo root) before committing.

### 1. `docs/CHANGELOG.md` — Required on every PR

Add an entry at the top using this exact format:

```
## YYYY-MM-DD — PR Title
**PR**: [#N](url) | **Merged into**: `main` | **Branch**: `branch-name`

### Summary
1-3 sentences describing the overall change.

### Files Changed

#### Modified
- `path/to/file` — One-line description of what changed in this file

#### Created
- `path/to/file` — What this file is and what it exports

#### Deleted
- `path/to/file` — Why it was removed

### Dependencies Changed
- Added/removed `package@version` — What it does

### Patterns Introduced
- New conventions or patterns other agents should know about
```

**Every file touched must be listed.** The description should explain *what changed* (not the code itself) so parallel agents can detect overlaps and avoid conflicts when merging.

### 2. `docs/COMPONENTS.md` — Update if components were added, removed, or significantly changed

### 3. `docs/ARCHITECTURE.md` — Update if the tech stack, design tokens, patterns, or project structure changed
