#!/usr/bin/env node
// Parse scripts/scripts.jhf (Hershey Script Simplex) and bake stroke path data
// for the letters in "Pavan Kumar" to lib/glyphs.json. Also emit public/favicon.svg.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const JHF = join(HERE, "scripts.jhf");
const OUT_JSON = join(ROOT, "lib", "glyphs.json");
const OUT_FAVICON = join(ROOT, "public", "favicon.svg");

const LETTERS = "Pavan Kumar";
const R_CODE = "R".charCodeAt(0); // 82, coord origin

/**
 * Hershey pair decoder: " R" == pen-up marker, otherwise (x, y) relative to 'R'.
 * Splitting on " R" before decoding yields an array of strokes.
 */
function parseGlyphLine(line) {
  // Columns: 0-4 idx (ignored), 5-7 count, 8+ data.
  const count = parseInt(line.slice(5, 8), 10);
  const data = line.slice(8);
  // First pair = (left, right) horizontal extents, not a coordinate.
  const left = data.charCodeAt(0) - R_CODE;
  const right = data.charCodeAt(1) - R_CODE;
  const rest = data.slice(2);

  const strokeChunks = rest.split(" R");
  const strokes = [];
  for (const chunk of strokeChunks) {
    if (chunk.length === 0) continue;
    const pts = [];
    for (let i = 0; i + 1 < chunk.length; i += 2) {
      const x = chunk.charCodeAt(i) - R_CODE;
      const y = chunk.charCodeAt(i + 1) - R_CODE;
      pts.push([x, y]);
    }
    if (pts.length === 0) continue;
    const d =
      `M ${pts[0][0]} ${pts[0][1]}` +
      pts
        .slice(1)
        .map(([x, y]) => ` L ${x} ${y}`)
        .join("");
    strokes.push(d);
  }

  return { left, right, strokes, count };
}

function reassembleWrappedGlyphs(text) {
  // Some .jhf files wrap long glyph lines onto continuation lines that start
  // with 8 spaces. scripts.jhf doesn't, but we handle it defensively.
  const raw = text.split("\n");
  const glyphs = [];
  for (const line of raw) {
    if (!line) continue;
    if (/^ {8}/.test(line)) {
      glyphs[glyphs.length - 1] += line.slice(8);
    } else {
      glyphs.push(line);
    }
  }
  return glyphs;
}

async function main() {
  const text = await readFile(JHF, "utf8");
  const glyphs = reassembleWrappedGlyphs(text);

  // Unique letters to bake (includes space).
  const uniq = [...new Set(LETTERS.split(""))];

  const out = {};
  for (const ch of uniq) {
    const code = ch.charCodeAt(0);
    const idx = code - 32;
    const line = glyphs[idx];
    if (!line) throw new Error(`missing glyph for ${JSON.stringify(ch)}`);
    const parsed = parseGlyphLine(line);
    out[ch] = { left: parsed.left, right: parsed.right, strokes: parsed.strokes };
  }

  await mkdir(dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(out, null, 2) + "\n");

  // Favicon: a single "P" Hershey stroke mark, centered in a 32x32 viewBox.
  const P = out["P"];
  // Hershey P has x in [left,right], y roughly in [-10, 10].
  // Fit into viewBox padded.
  const pad = 6;
  const glyphW = P.right - P.left;
  const glyphH = 22; // script caps range about 21-22 units
  const vbW = glyphW + pad * 2;
  const vbH = glyphH + pad * 2;
  // translate so glyph's [left,-11] maps to [pad,pad]
  const tx = pad - P.left;
  const ty = pad + 11;
  const paths = P.strokes
    .map(
      (d) =>
        `  <path d="${d}" fill="none" stroke="#0B0B0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`
    )
    .join("\n");
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="32" height="32">
 <g transform="translate(${tx} ${ty})">
${paths}
 </g>
</svg>
`;
  await mkdir(dirname(OUT_FAVICON), { recursive: true });
  await writeFile(OUT_FAVICON, favicon);

  const strokeCount = Object.values(out).reduce((n, g) => n + g.strokes.length, 0);
  console.log(
    `Baked ${Object.keys(out).length} glyphs (${strokeCount} strokes) → lib/glyphs.json`
  );
  console.log(`Wrote favicon → public/favicon.svg (${vbW}×${vbH} viewBox)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
