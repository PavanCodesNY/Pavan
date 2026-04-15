export type Segment = string | { text: string; href: string };

export type SegmentSlice =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; href: string };

export function segmentsToFullText(segments: Segment[]): string {
  return segments.map((s) => (typeof s === "string" ? s : s.text)).join("");
}

/**
 * Given an ordered segment list and a half-open character range [start, end)
 * in the flat text, return the portions of each segment that fall within the
 * range. Link identity is preserved on every slice.
 */
export function sliceSegmentsByRange(
  segments: Segment[],
  start: number,
  end: number,
): SegmentSlice[] {
  const out: SegmentSlice[] = [];
  let offset = 0;
  for (const seg of segments) {
    const text = typeof seg === "string" ? seg : seg.text;
    const segStart = offset;
    const segEnd = offset + text.length;
    const sliceStart = Math.max(start, segStart);
    const sliceEnd = Math.min(end, segEnd);
    if (sliceStart < sliceEnd) {
      const part = text.slice(sliceStart - segStart, sliceEnd - segStart);
      if (typeof seg === "string") {
        out.push({ kind: "text", text: part });
      } else {
        out.push({ kind: "link", text: part, href: seg.href });
      }
    }
    offset = segEnd;
    if (offset >= end) break;
  }
  return out;
}

/**
 * Build a canvas-compatible font string from individual pieces. Used when
 * you want to hardcode a font (rather than reading it from a DOM element via
 * getComputedStyle, which is the usual path).
 */
export function buildFontString(
  weight: number | string,
  size: number,
  lineHeight: number,
  family: string,
  style: "normal" | "italic" = "normal",
): string {
  return `${style} ${weight} ${size}px/${lineHeight}px ${family}`;
}

/**
 * Read the computed font string from a DOM element, formatted the way the
 * Canvas 2D context expects (`style weight size/lineHeight family`). We call
 * this after the element has mounted so the font-family reflects whatever
 * next/font generated (e.g. `__Instrument_Serif_38266732`).
 */
export function fontStringFromElement(el: Element): string {
  const cs = getComputedStyle(el);
  const style = cs.fontStyle || "normal";
  const weight = cs.fontWeight || "400";
  const size = cs.fontSize || "16px";
  const lineHeight = cs.lineHeight || "normal";
  const family = cs.fontFamily || "serif";
  return `${style} ${weight} ${size}/${lineHeight} ${family}`;
}
