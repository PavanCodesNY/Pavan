#!/usr/bin/env node
// Parse scripts/scripts.jhf (Hershey Script Simplex) and bake stroke path data
// for the letters in "Pavan Kumar" to lib/glyphs.json. Also emit public/favicon.svg.
//
// Output shape per letter: { left, right, path } where `path` is ONE continuous
// SVG subpath that traces the entire letter — individual Hershey strokes are
// merged with smooth quadratic Bezier connectors, so animating the whole letter
// with a single stroke-dashoffset sweep produces the Apple "hello" effect.

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

const fmt = (n) => {
  const r = Math.round(n * 100) / 100;
  return `${r}`;
};

const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/**
 * Emit the "body" of a smoothed stroke — every command after the initial M.
 * Used when appending strokes onto an existing merged path. Each interior
 * vertex becomes a Bezier control point; midpoints act as anchors, turning
 * Hershey's sparse polylines into flowing cursive curves.
 */
function smoothStrokeBody(pts) {
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `L ${fmt(pts[1][0])} ${fmt(pts[1][1])}`;
  }
  const parts = [];
  const firstMid = mid(pts[0], pts[1]);
  parts.push(`L ${fmt(firstMid[0])} ${fmt(firstMid[1])}`);
  for (let i = 1; i < pts.length - 1; i++) {
    const ctrl = pts[i];
    const endMid = mid(pts[i], pts[i + 1]);
    parts.push(
      `Q ${fmt(ctrl[0])} ${fmt(ctrl[1])} ${fmt(endMid[0])} ${fmt(endMid[1])}`,
    );
  }
  const last = pts[pts.length - 1];
  parts.push(`L ${fmt(last[0])} ${fmt(last[1])}`);
  return parts.join(" ");
}

/**
 * Merge multiple strokes (each an ordered point array) into a SINGLE continuous
 * SVG subpath — one `M` at the top, then all drawable commands follow. Between
 * consecutive strokes N and N+1, if their endpoints don't already coincide,
 * insert a quadratic Bezier connector whose control point sits perpendicular to
 * the chord so the visible "pen drag" between strokes arcs smoothly rather than
 * cutting a straight line. No `M` jumps anywhere after the initial one.
 */
function mergeStrokes(strokes) {
  if (strokes.length === 0) return "";
  const parts = [];
  const firstStart = strokes[0][0];
  parts.push(`M ${fmt(firstStart[0])} ${fmt(firstStart[1])}`);

  const firstBody = smoothStrokeBody(strokes[0]);
  if (firstBody) parts.push(firstBody);

  for (let i = 1; i < strokes.length; i++) {
    const prevStroke = strokes[i - 1];
    const prev = prevStroke[prevStroke.length - 1];
    const next = strokes[i][0];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const dist = Math.hypot(dx, dy);

    if (dist >= 0.01) {
      // Perpendicular unit vector (rotate the chord 90° CCW).
      const nx = -dy / dist;
      const ny = dx / dist;
      // Bow the connector slightly so the pen-drag looks hand-drawn. The bow
      // scales with the gap but caps out so long lifts don't explode into an
      // arc.
      const bow = Math.min(dist * 0.35, 1.6);
      const mx = (prev[0] + next[0]) / 2;
      const my = (prev[1] + next[1]) / 2;
      const cx = mx + nx * bow;
      const cy = my + ny * bow;
      parts.push(`Q ${fmt(cx)} ${fmt(cy)} ${fmt(next[0])} ${fmt(next[1])}`);
    }
    // else: prev == next (same point) — stroke body flows straight in.

    const body = smoothStrokeBody(strokes[i]);
    if (body) parts.push(body);
  }

  return parts.join(" ");
}

/**
 * Decode a Hershey glyph line into (left, right, path). " R" is the pen-up
 * marker that separates strokes; we split on it, decode each chunk into a
 * point list, then merge everything into a single continuous path.
 */
function parseGlyphLine(line) {
  const count = parseInt(line.slice(5, 8), 10);
  const data = line.slice(8);
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
    strokes.push(pts);
  }

  const path = mergeStrokes(strokes);
  return { left, right, path, strokeCount: strokes.length, count };
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

  const uniq = [...new Set(LETTERS.split(""))];

  const out = {};
  let totalOriginalStrokes = 0;
  for (const ch of uniq) {
    const code = ch.charCodeAt(0);
    const idx = code - 32;
    const line = glyphs[idx];
    if (!line) throw new Error(`missing glyph for ${JSON.stringify(ch)}`);
    const parsed = parseGlyphLine(line);
    totalOriginalStrokes += parsed.strokeCount;
    out[ch] = { left: parsed.left, right: parsed.right, path: parsed.path };
  }

  await mkdir(dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(out, null, 2) + "\n");

  // Favicon: a single "P" Hershey glyph, centered in a square viewBox.
  const P = out["P"];
  const pad = 6;
  const glyphW = P.right - P.left;
  const glyphH = 22;
  const vbW = glyphW + pad * 2;
  const vbH = glyphH + pad * 2;
  const tx = pad - P.left;
  const ty = pad + 11;
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="32" height="32">
 <g transform="translate(${tx} ${ty})">
  <path d="${P.path}" fill="none" stroke="#0B0B0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
 </g>
</svg>
`;
  await mkdir(dirname(OUT_FAVICON), { recursive: true });
  await writeFile(OUT_FAVICON, favicon);

  console.log(
    `Baked ${Object.keys(out).length} glyphs (merged from ${totalOriginalStrokes} raw strokes) → lib/glyphs.json`,
  );
  console.log(`Wrote favicon → public/favicon.svg (${vbW}×${vbH} viewBox)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
