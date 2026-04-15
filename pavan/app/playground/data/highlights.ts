import fs from "fs";
import path from "path";

export type Platform = "linkedin" | "x" | "instagram";

export type Highlight = {
  id: string;
  platform: Platform;
  date: string;
  content: string;
  url?: string;
  image?: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "highlights");

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  content: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw.trim() };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value;
  }

  return { meta, content: match[2].trim() };
}

export function getHighlights(): Highlight[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse(); // newest first by filename

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { meta, content } = parseFrontmatter(raw);
    const id = file.replace(/\.md$/, "");

    return {
      id,
      platform: (meta.platform as Platform) || "linkedin",
      date: meta.date || "",
      content,
      url: meta.url || undefined,
      image: meta.image || undefined,
    };
  });
}
