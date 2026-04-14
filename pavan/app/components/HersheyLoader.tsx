"use client";

import { useEffect, useMemo, useRef } from "react";
import { layoutString } from "@/lib/glyphs";
import styles from "./HersheyLoader.module.css";

type Props = {
  text?: string;
  onComplete: () => void;
};

type PreparedStroke = {
  key: string;
  d: string;
  xOffset: number;
};

const LETTER_SPACING = 3;
const WORD_SPACE = 8;

export function HersheyLoader({ text = "Pavan Kumar", onComplete }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const layout = useMemo(
    () => layoutString(text, LETTER_SPACING, WORD_SPACE),
    [text],
  );

  const strokes = useMemo<PreparedStroke[]>(() => {
    const out: PreparedStroke[] = [];
    for (const char of layout.chars) {
      char.strokes.forEach((d, i) => {
        out.push({
          key: `${char.char}-${char.xOffset}-${i}`,
          d,
          xOffset: char.xOffset,
        });
      });
    }
    return out;
  }, [layout]);

  const padX = 6;
  const padY = 4;
  const vbX = -padX;
  const vbY = layout.minY - padY;
  const vbW = layout.width + padX * 2;
  const vbH = layout.maxY - layout.minY + padY * 2;

  useEffect(() => {
    const overlay = overlayRef.current;
    const svg = svgRef.current;
    if (!overlay || !svg) return;
    if (doneRef.current) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let finishTimer = 0;
    let fadeTimer = 0;
    let rafId: number | null = null;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      overlay.classList.add(styles.fading);
      fadeTimer = window.setTimeout(() => onCompleteRef.current(), 480);
    };

    if (reduced) {
      overlay.classList.add(styles.writing);
      finishTimer = window.setTimeout(finish, 450);
    } else {
      const paths = Array.from(
        svg.querySelectorAll<SVGPathElement>(`.${styles.stroke}`),
      );
      const GAP_BETWEEN_STROKES = 18;
      const GAP_BETWEEN_LETTERS = 36;
      let totalMs = 0;
      let prevXOffset: number | null = null;

      paths.forEach((path, i) => {
        const len = path.getTotalLength();
        const dur = Math.max(140, len * 26);
        const xOffset = Number(path.dataset.xoffset);
        if (prevXOffset !== null && xOffset !== prevXOffset) {
          totalMs += GAP_BETWEEN_LETTERS;
        } else if (i > 0) {
          totalMs += GAP_BETWEEN_STROKES;
        }
        path.style.setProperty("--len", `${len}`);
        path.style.setProperty("--dur", `${dur}ms`);
        path.style.setProperty("--delay", `${totalMs}ms`);
        totalMs += dur;
        prevXOffset = xOffset;
      });

      // Two rAF ticks to guarantee initial offsets are committed before the
      // transition kicks in (otherwise some browsers skip the animation).
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          overlay.classList.add(styles.writing);
        });
      });

      const holdMs = 220;
      finishTimer = window.setTimeout(finish, totalMs + holdMs);
    }

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      if (finishTimer) window.clearTimeout(finishTimer);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      aria-hidden="false"
    >
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        role="img"
        aria-label={text}
      >
        {strokes.map((s) => (
          <path
            key={s.key}
            className={styles.stroke}
            d={s.d}
            data-xoffset={s.xOffset}
          />
        ))}
      </svg>
    </div>
  );
}
