import glyphs from "./glyphs.json";

export type GlyphData = {
  left: number;
  right: number;
  strokes: string[];
};

export const GLYPHS: Record<string, GlyphData> = glyphs as Record<string, GlyphData>;

export type LaidOutChar = {
  char: string;
  strokes: string[];
  xOffset: number;
  width: number;
};

export type StringLayout = {
  chars: LaidOutChar[];
  width: number;
  minY: number;
  maxY: number;
};

/**
 * Compute per-character x offsets for a string. The Hershey coord system
 * puts each glyph's center near x=0 with negative `left` and positive `right`.
 * We shift each glyph to place its own left at x=0 relative to its slot,
 * then accumulate slot widths to produce absolute x offsets.
 *
 * `letterSpacing` is extra space between adjacent letters.
 * `wordSpace` is the extra width added for a space glyph (on top of its own).
 */
export function layoutString(
  s: string,
  letterSpacing = 2,
  wordSpace = 0,
): StringLayout {
  const chars: LaidOutChar[] = [];
  let cursorX = 0;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const ch of s) {
    const g = GLYPHS[ch];
    if (!g) continue;
    const width = g.right - g.left + (ch === " " ? wordSpace : 0);
    // shift glyph so its internal `left` lands at cursorX
    const shift = cursorX - g.left;
    const shiftedStrokes = g.strokes.map((d) => shiftPathX(d, shift));
    chars.push({
      char: ch,
      strokes: shiftedStrokes,
      xOffset: cursorX,
      width,
    });
    cursorX += width + letterSpacing;

    for (const d of g.strokes) {
      for (const [, y] of extractPairs(d)) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return {
    chars,
    width: Math.max(0, cursorX - letterSpacing),
    minY: isFinite(minY) ? minY : 0,
    maxY: isFinite(maxY) ? maxY : 0,
  };
}

function extractPairs(d: string): Array<[number, number]> {
  // d looks like: "M 1 -10 L 2 -9 L 2 -6 ..."
  const out: Array<[number, number]> = [];
  const tokens = d.split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "M" || t === "L") {
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      if (!Number.isNaN(x) && !Number.isNaN(y)) out.push([x, y]);
      i += 2;
    }
  }
  return out;
}

function shiftPathX(d: string, dx: number): string {
  const tokens = d.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "M" || t === "L") {
      const x = Number(tokens[i + 1]) + dx;
      const y = Number(tokens[i + 2]);
      out.push(t, String(x), String(y));
      i += 2;
    } else {
      out.push(t);
    }
  }
  return out.join(" ");
}
