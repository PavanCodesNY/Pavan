import glyphs from "./glyphs.json";

export type GlyphData = {
  left: number;
  right: number;
  /** One continuous SVG path (merged strokes + smooth connectors). */
  path: string;
};

export const GLYPHS: Record<string, GlyphData> = glyphs as Record<string, GlyphData>;

export type LaidOutChar = {
  char: string;
  /** Path with x coordinates shifted so the glyph's `left` lands at `xOffset`. */
  path: string;
  xOffset: number;
  width: number;
};

export type StringLayout = {
  chars: LaidOutChar[];
  width: number;
  minY: number;
  maxY: number;
};

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
    const shift = cursorX - g.left;
    const shiftedPath = g.path ? shiftPathX(g.path, shift) : "";
    chars.push({
      char: ch,
      path: shiftedPath,
      xOffset: cursorX,
      width,
    });
    cursorX += width + letterSpacing;

    if (g.path) {
      for (const [, y] of extractPairs(g.path)) {
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
  // Walk tokens looking for M/L/Q commands and pull their endpoint coordinates.
  // For Q we only use the endpoint (last two numbers) since the control point
  // can stick slightly outside the glyph bounds — those shouldn't inflate the
  // viewBox.
  const out: Array<[number, number]> = [];
  const tokens = d.split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "M" || t === "L") {
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      if (!Number.isNaN(x) && !Number.isNaN(y)) out.push([x, y]);
      i += 2;
    } else if (t === "Q") {
      // Q cx cy x y — skip control, keep endpoint.
      const x = Number(tokens[i + 3]);
      const y = Number(tokens[i + 4]);
      if (!Number.isNaN(x) && !Number.isNaN(y)) out.push([x, y]);
      i += 4;
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
    } else if (t === "Q") {
      const cx = Number(tokens[i + 1]) + dx;
      const cy = Number(tokens[i + 2]);
      const x = Number(tokens[i + 3]) + dx;
      const y = Number(tokens[i + 4]);
      out.push(t, String(cx), String(cy), String(x), String(y));
      i += 4;
    } else {
      out.push(t);
    }
  }
  return out.join(" ");
}
