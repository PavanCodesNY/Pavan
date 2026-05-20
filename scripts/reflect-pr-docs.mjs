#!/usr/bin/env node
// Scan docs/PRs/*.md, detect signals, append proposals to PROPOSED-CHANGES.md.
// Never mutates CONVENTIONS.md / QUESTIONS.md / PR-TEMPLATE.md. Idempotent: proposals are keyed by slug.
// Usage:
//   node scripts/reflect-pr-docs.mjs
//   node scripts/reflect-pr-docs.mjs --dry   # print proposals without writing

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRS_DIR = join(__dirname, "..", "docs", "PRs");
const PROPOSALS_PATH = join(PRS_DIR, "PROPOSED-CHANGES.md");

const META_FILES = new Set([
  "README.md",
  "INDEX.md",
  "PR-TEMPLATE.md",
  "CONVENTIONS.md",
  "QUESTIONS.md",
  "REFLECTION.md",
  "PROPOSED-CHANGES.md",
]);

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").trimEnd();
    if (!line.trim()) continue;
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const [, k, vRaw] = kv;
    const v = vRaw.trim();
    if (v === "") out[k] = "";
    else if (v === "[]") out[k] = [];
    else if (v.startsWith("[") && v.endsWith("]"))
      out[k] = v
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    else if (v === "true") out[k] = true;
    else if (v === "false") out[k] = false;
    else out[k] = v.replace(/^["']|["']$/g, "");
  }
  return out;
}

function section(text, heading) {
  const re = new RegExp(
    `##\\s+${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    "i",
  );
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

function loadDocs() {
  return readdirSync(PRS_DIR)
    .filter((f) => f.endsWith(".md") && !META_FILES.has(f))
    .map((f) => {
      const text = readFileSync(join(PRS_DIR, f), "utf8");
      const fm = parseFrontmatter(text) || {};
      return { file: f, fm, text };
    });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Kebabify free-form values so proposal slugs match the dedup regex [A-Za-z0-9-]+.
function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "unnamed";
}

// Proposal factory. Deterministic slug so re-runs are idempotent.
function mkProposal({ slug, source, signal, target, change, evidence, confidence, needsHuman }) {
  return {
    slug: `PROPOSAL-${today()}-${slug}`,
    body:
`### PROPOSAL-${today()}-${slug}
- **source:** ${source}
- **signal:** ${signal}
- **target file:** ${target}
- **proposed change:** ${change}
- **evidence:** ${evidence}
- **confidence:** ${confidence}
- **needs_human:** ${needsHuman ? "true" : "false"}
- **status:** proposed
- **resolution:**
`,
  };
}

function detectSignals(docs) {
  const proposals = [];
  if (docs.length === 0) return proposals;

  // 1. Dead fields: frontmatter keys blank/default in >=5 docs.
  //    Only considered if we have >=5 docs total.
  if (docs.length >= 5) {
    const candidates = ["env_changes", "depends_on", "related_prs", "superseded_by"];
    for (const key of candidates) {
      const blank = docs.filter((d) => {
        const v = d.fm[key];
        if (v === undefined || v === "" || v === null) return true;
        if (Array.isArray(v) && v.length === 0) return true;
        return false;
      });
      if (blank.length >= 5 && blank.length === docs.length) {
        proposals.push(
          mkProposal({
            slug: `dead-field-${key}`,
            source: "script",
            signal: `Frontmatter field "${key}" is blank/empty across all ${docs.length} PR docs.`,
            target: "PR-TEMPLATE.md",
            change: `Consider removing "${key}" from frontmatter, or documenting that it is optional.`,
            evidence: docs.map((d) => d.fm.pr_id || d.file).join(", "),
            confidence: "medium",
            needsHuman: true,
          }),
        );
      }
    }
  }

  // 2. Recurring establishes_pattern: same value in >=2 PRs.
  const patternCounts = new Map();
  for (const d of docs) {
    const p = (d.fm.establishes_pattern || "").trim();
    if (!p) continue;
    if (!patternCounts.has(p)) patternCounts.set(p, []);
    patternCounts.get(p).push(d.fm.pr_id || d.file);
  }
  for (const [pattern, prs] of patternCounts) {
    if (prs.length >= 2) {
      proposals.push(
        mkProposal({
          slug: `pattern-${slugify(pattern)}`,
          source: "script",
          signal: `Pattern "${pattern}" declared by ${prs.length} PR docs.`,
          target: "CONVENTIONS.md",
          change: `Add "${pattern}" to CONVENTIONS.md under the appropriate section.`,
          evidence: prs.join(", "),
          confidence: "high",
          needsHuman: true,
        }),
      );
    }
  }

  // 3. Recurring tag: same tag in >=3 PRs.
  const tagCounts = new Map();
  for (const d of docs) {
    const tags = Array.isArray(d.fm.tags) ? d.fm.tags : [];
    for (const t of tags) {
      if (!t) continue;
      if (!tagCounts.has(t)) tagCounts.set(t, []);
      tagCounts.get(t).push(d.fm.pr_id || d.file);
    }
  }
  for (const [tag, prs] of tagCounts) {
    if (prs.length >= 3) {
      proposals.push(
        mkProposal({
          slug: `tag-${slugify(tag)}`,
          source: "script",
          signal: `Tag "${tag}" used on ${prs.length} PRs.`,
          target: "CONVENTIONS.md",
          change: `Consider adding "${tag}" to a recognized-tags list so usage stays consistent.`,
          evidence: prs.join(", "),
          confidence: "medium",
          needsHuman: true,
        }),
      );
    }
  }

  // 4. Pattern Observations flagged contradictions.
  for (const d of docs) {
    const po = section(d.text, "Pattern Observations");
    if (!po) continue;
    const contradictLine = po.split(/\r?\n/).find((l) => /contradicts prior pr/i.test(l));
    if (contradictLine && !/none/i.test(contradictLine)) {
      const prId = d.fm.pr_id || d.file.replace(/\.md$/, "");
      proposals.push(
        mkProposal({
          slug: `contradiction-${prId}`,
          source: "script",
          signal: `${prId} reports a contradiction with a prior PR.`,
          target: "CONVENTIONS.md",
          change: `Review the contradiction and decide which behavior is canonical; document in CONVENTIONS.md.`,
          evidence: `${prId}: ${contradictLine.trim()}`,
          confidence: "low",
          needsHuman: true,
        }),
      );
    }
  }

  // 5. Thin rollback on high-complexity PRs.
  for (const d of docs) {
    if (d.fm.rollback_complexity !== "high") continue;
    const rb = section(d.text, "Rollback");
    if (rb.length < 120) {
      const prId = d.fm.pr_id || d.file.replace(/\.md$/, "");
      proposals.push(
        mkProposal({
          slug: `thin-rollback-${prId}`,
          source: "script",
          signal: `${prId} is rollback_complexity: high but rollback section is < 120 chars.`,
          target: "PR-TEMPLATE.md",
          change: `Consider requiring >=N rollback steps when rollback_complexity is high, and flag this PR's rollback for a fill-in.`,
          evidence: `${prId} rollback length: ${rb.length} chars`,
          confidence: "medium",
          needsHuman: true,
        }),
      );
    }
  }

  return proposals;
}

function main() {
  const docs = loadDocs();
  const proposals = detectSignals(docs);

  const existing = readFileSync(PROPOSALS_PATH, "utf8");
  const existingSlugs = new Set(
    Array.from(existing.matchAll(/^###\s+(PROPOSAL-\d{4}-\d{2}-\d{2}-[A-Za-z0-9-]+)/gm)).map(
      (m) => m[1],
    ),
  );
  const existingSignatures = new Set(
    Array.from(existing.matchAll(/^###\s+PROPOSAL-\d{4}-\d{2}-\d{2}-([A-Za-z0-9-]+)/gm)).map(
      (m) => m[1],
    ),
  );

  const fresh = proposals.filter((p) => {
    const sig = p.slug.replace(/^PROPOSAL-\d{4}-\d{2}-\d{2}-/, "");
    return !existingSignatures.has(sig) && !existingSlugs.has(p.slug);
  });

  if (DRY) {
    console.log(`scanned ${docs.length} PR doc(s), would add ${fresh.length} proposal(s):`);
    for (const p of fresh) console.log("---\n" + p.body);
    return;
  }

  if (fresh.length === 0) {
    console.log(`scanned ${docs.length} PR doc(s), no new proposals.`);
    return;
  }

  // Insert fresh proposals under "## Active proposals".
  let next;
  if (/## Active proposals\r?\n_None yet\._/.test(existing)) {
    next = existing.replace(
      /## Active proposals\r?\n_None yet\._/,
      `## Active proposals\n\n${fresh.map((p) => p.body).join("\n")}`,
    );
  } else {
    next = existing.replace(
      /## Active proposals\r?\n/,
      `## Active proposals\n\n${fresh.map((p) => p.body).join("\n")}\n`,
    );
  }
  writeFileSync(PROPOSALS_PATH, next);
  console.log(
    `scanned ${docs.length} PR doc(s), appended ${fresh.length} proposal(s) to PROPOSED-CHANGES.md.`,
  );
  for (const p of fresh) console.log("  + " + p.slug);
}

main();
