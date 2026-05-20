#!/usr/bin/env node
// Regenerate docs/PRs/INDEX.md from the PR docs' frontmatter.
// Usage:
//   node scripts/regen-pr-index.mjs            # rewrites INDEX.md
//   node scripts/regen-pr-index.mjs --check    # exits non-zero if INDEX is stale or any doc has invariant violations

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRS_DIR = join(__dirname, "..", "docs", "PRs");
const INDEX_PATH = join(PRS_DIR, "INDEX.md");

const META_FILES = new Set([
  "README.md",
  "INDEX.md",
  "PR-TEMPLATE.md",
  "CONVENTIONS.md",
  "QUESTIONS.md",
  "REFLECTION.md",
  "PROPOSED-CHANGES.md",
]);

const REQUIRED_FIELDS = [
  "date",
  "pr_id",
  "type",
  "status",
  "main_change",
  "author",
  "target_branch",
];

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");

const warnings = [];

function warn(msg) {
  warnings.push(msg);
}

// Narrow YAML frontmatter parser: flat key: value, value is scalar or inline [] array.
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const body = match[1];
  const out = {};
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").trimEnd(); // strip trailing comments
    if (!line.trim()) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const rawVal = m[2].trim();
    if (rawVal === "") {
      out[key] = "";
    } else if (rawVal === "[]") {
      out[key] = [];
    } else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
      out[key] = rawVal
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (rawVal === "true") {
      out[key] = true;
    } else if (rawVal === "false") {
      out[key] = false;
    } else {
      out[key] = rawVal.replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

function validate(fm, filename) {
  const stem = filename.replace(/\.md$/, "");
  const issues = [];

  // Required fields
  for (const f of REQUIRED_FIELDS) {
    const v = fm[f];
    if (v === undefined || v === "" || v === null) {
      issues.push(`missing required field "${f}"`);
    }
  }

  // pr_id must match filename stem
  if (fm.pr_id && fm.pr_id !== stem) {
    issues.push(`pr_id "${fm.pr_id}" does not match filename stem "${stem}"`);
  }

  // type ↔ breaking_change (biconditional)
  if (fm.type === "breaking" && fm.breaking_change !== true) {
    issues.push(`type is "breaking" but breaking_change is not true`);
  }
  if (fm.breaking_change === true && fm.type !== "breaking") {
    issues.push(`breaking_change is true but type is "${fm.type}" (expected "breaking")`);
  }

  // status ↔ superseded_by
  if (fm.status === "superseded" && !fm.superseded_by) {
    issues.push(`status is "superseded" but superseded_by is blank`);
  }
  if (fm.superseded_by && fm.status !== "superseded") {
    issues.push(`superseded_by is set but status is not "superseded"`);
  }

  // authored_by ↔ model
  if (fm.authored_by === "human" && fm.model) {
    issues.push(`authored_by is "human" but model is set`);
  }
  if (fm.authored_by === "agent" && !fm.model) {
    issues.push(`authored_by is "agent" but model is blank`);
  }

  // commit_sha ↔ status
  // commit_sha is required only for statuses that imply the PR reached the target branch.
  // "closed" (never merged) and "open" (not yet merged) legitimately have no SHA.
  const NO_SHA_STATUSES = new Set(["open", "closed"]);
  if (NO_SHA_STATUSES.has(fm.status) && fm.commit_sha) {
    issues.push(`status "${fm.status}" must not have a commit_sha (never reached target branch)`);
  }
  if (!NO_SHA_STATUSES.has(fm.status) && !fm.commit_sha) {
    issues.push(`status "${fm.status}" requires a commit_sha`);
  }

  return issues;
}

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function renderRow(fm, hasIssues) {
  const prId = hasIssues ? `⚠ ${fm.pr_id}` : fm.pr_id;
  const prIdCell = fm.github_pr
    ? `[${prId}](./${fm.pr_id}.md) ([#${fm.github_pr}](https://github.com/PavanCodesNY/Pavan/pull/${fm.github_pr}))`
    : `[${prId}](./${fm.pr_id}.md)`;
  const tags = Array.isArray(fm.tags) ? fm.tags.join(", ") : "";
  const oneLiner = truncate(fm.main_change || "", 80);
  return `| ${fm.date || ""} | ${prIdCell} | ${fm.type || ""} | ${fm.status || ""} | ${oneLiner} | ${tags} | ${fm.author || ""} |`;
}

function main() {
  const files = readdirSync(PRS_DIR).filter(
    (f) => f.endsWith(".md") && !META_FILES.has(f),
  );

  const rows = [];
  let hadValidationFailure = false;

  for (const f of files) {
    const full = join(PRS_DIR, f);
    const text = readFileSync(full, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) {
      warn(`${f}: no frontmatter found; skipping`);
      hadValidationFailure = true;
      continue;
    }
    const issues = validate(fm, f);
    if (issues.length > 0) {
      for (const iss of issues) warn(`${f}: ${iss}`);
      hadValidationFailure = true;
      // Still render row if we have enough fields
      if (fm.date && fm.pr_id) {
        rows.push({ fm, hasIssues: true });
      }
      continue;
    }
    rows.push({ fm, hasIssues: false });
  }

  // Sort: date desc, then pr_id desc
  rows.sort((a, b) => {
    if (a.fm.date !== b.fm.date) return a.fm.date < b.fm.date ? 1 : -1;
    return a.fm.pr_id < b.fm.pr_id ? 1 : -1;
  });

  const header =
    "| Date | PR ID | Type | Status | One-liner | Tags | Author |\n" +
    "|------|-------|------|--------|-----------|------|--------|";

  const tableBody =
    rows.length === 0
      ? "| _No PRs yet_ | | | | | | |"
      : rows.map((r) => renderRow(r.fm, r.hasIssues)).join("\n");

  const regenInstructions = `## Regeneration

Regeneration is script-run (\`node scripts/regen-pr-index.mjs\`) or agent-run. Every change to any PR doc must be committed together with a regenerated INDEX.

Rules:
1. Parse YAML frontmatter from every \`.md\` file in \`docs/PRs/\`.
2. Exclude the \`archive/\` directory and these meta files by name: \`README.md\`, \`INDEX.md\`, \`PR-TEMPLATE.md\`, \`CONVENTIONS.md\`, \`QUESTIONS.md\`, \`REFLECTION.md\`, \`PROPOSED-CHANGES.md\`.
3. Sort by \`date\` descending, then \`pr_id\` descending as a tie-breaker (deterministic).
4. Verify \`pr_id\` matches the filename stem. If it doesn't, emit a warning listing the file and include the row prefixed with \`⚠\` in the \`PR ID\` column — do not silently rename or drop.
5. If a file is missing any required field (\`date\`, \`pr_id\`, \`type\`, \`status\`, \`main_change\`, \`author\`, \`target_branch\`), skip it and emit a warning listing the file path and missing field. Do not silently drop without warning.
6. Validate invariants (see \`README.md > Frontmatter invariants\`). On violation, emit a warning and include the row prefixed with \`⚠\` — do not drop.
7. When the parsed set is **empty**, keep the single \`_No PRs yet_\` placeholder row. When the parsed set is **non-empty**, drop the placeholder row entirely and never include it in the sorted output.

## Column mapping
- **Date** ← \`date\`
- **PR ID** ← \`pr_id\`, linked to the doc file (e.g. \`[PR-2026-04-23-foo](./PR-2026-04-23-foo.md)\`). If \`github_pr\` is set, also append \` (#123)\` linked to GitHub.
- **Type** ← \`type\`
- **Status** ← \`status\`
- **One-liner** ← \`main_change\`, truncated to 80 chars with an ellipsis if longer
- **Tags** ← \`tags\` joined with \`, \` (comma + space), kebab-case
- **Author** ← \`author\` (GitHub handle)
`;

  const newContent =
    `# PR Index\n\nNewest first. Regenerated by \`scripts/regen-pr-index.mjs\` or by an agent following the rules below.\n\n${header}\n${tableBody}\n\n${regenInstructions}`;

  const current = readFileSync(INDEX_PATH, "utf8");

  if (CHECK_ONLY) {
    let bad = hadValidationFailure;
    if (current !== newContent) {
      warn(`INDEX.md is stale; run: node scripts/regen-pr-index.mjs`);
      bad = true;
    }
    for (const w of warnings) console.error(`warn: ${w}`);
    if (bad) {
      console.error(`check failed (${warnings.length} issue(s))`);
      process.exit(1);
    }
    console.log(`check ok (${rows.length} PR doc(s))`);
    return;
  }

  writeFileSync(INDEX_PATH, newContent);
  for (const w of warnings) console.error(`warn: ${w}`);
  console.log(`wrote INDEX.md (${rows.length} PR doc(s))`);
  if (hadValidationFailure) process.exit(1);
}

main();
