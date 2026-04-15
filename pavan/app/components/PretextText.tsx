"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  prepareWithSegments,
  layoutWithLines,
  type LayoutCursor,
} from "@chenglou/pretext";
import {
  fontStringFromElement,
  segmentsToFullText,
  sliceSegmentsByRange,
  type Segment,
  type SegmentSlice,
} from "@/lib/pretext-helpers";
import styles from "./PretextText.module.css";

export type PretextTextProps = {
  segments: Segment[];
  /** Line height in px — must match the CSS line-height of the rendered text. */
  lineHeight: number;
  /** Root element tag. Defaults to `p`. */
  as?: "p" | "div" | "span";
  className?: string;
  lineClassName?: string;
  /** Extra attributes to stamp on each rendered line span. */
  lineAttrs?: (lineIndex: number) => Record<string, string>;
};

type LineData = {
  start: number;
  end: number;
  width: number;
};

type Measured = {
  width: number;
  fontString: string;
};

function renderSegmentInline(segs: Segment[]): ReactNode {
  return segs.map((seg, i) => {
    if (typeof seg === "string") return seg;
    const external = seg.href.startsWith("http");
    return (
      <Link
        key={i}
        href={seg.href}
        className={styles.link}
        data-cursor=""
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {seg.text}
      </Link>
    );
  });
}

function renderSlices(slices: SegmentSlice[]): ReactNode {
  return slices.map((slice, i) => {
    if (slice.kind === "text") return slice.text;
    const external = slice.href.startsWith("http");
    return (
      <Link
        key={i}
        href={slice.href}
        className={styles.link}
        data-cursor=""
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {slice.text}
      </Link>
    );
  });
}

export function PretextText({
  segments,
  lineHeight,
  as = "p",
  className,
  lineClassName,
  lineAttrs,
}: PretextTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      setMeasured({
        width: rect.width,
        fontString: fontStringFromElement(el),
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const fullText = useMemo(() => segmentsToFullText(segments), [segments]);

  const lines = useMemo<LineData[] | null>(() => {
    if (!measured) return null;
    if (measured.width <= 0) return null;
    try {
      const prepared = prepareWithSegments(fullText, measured.fontString);
      const result = layoutWithLines(prepared, measured.width, lineHeight);
      // Convert pretext's cursor form (segmentIndex, graphemeIndex) into a
      // flat character offset into `fullText` so sliceSegmentsByRange can
      // work in the input's original character space.
      const segLens = (prepared as unknown as { segments: string[] }).segments.map(
        (s) => s.length,
      );
      const cursorToOffset = (c: LayoutCursor) => {
        let off = 0;
        for (let i = 0; i < c.segmentIndex; i++) off += segLens[i];
        return off + c.graphemeIndex;
      };
      return result.lines.map((line) => ({
        width: line.width,
        start: cursorToOffset(line.start),
        end: cursorToOffset(line.end),
      }));
    } catch {
      return null;
    }
  }, [fullText, measured, lineHeight]);

  const Tag = as;

  if (lines === null) {
    // SSR + pre-measurement: flow segments inline. Post-hydration, after the
    // ResizeObserver fires, this will re-render as line-per-block.
    return (
      <Tag ref={rootRef as never} className={className}>
        {renderSegmentInline(segments)}
      </Tag>
    );
  }

  return (
    <Tag ref={rootRef as never} className={className}>
      {lines.map((line, i) => {
        const slices = sliceSegmentsByRange(segments, line.start, line.end);
        const extra = lineAttrs?.(i) ?? {};
        return (
          <span
            key={i}
            className={`${styles.line}${lineClassName ? ` ${lineClassName}` : ""}`}
            data-line={i}
            style={{ ["--i" as string]: i }}
            {...extra}
          >
            {renderSlices(slices)}
          </span>
        );
      })}
    </Tag>
  );
}
