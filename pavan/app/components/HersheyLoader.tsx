"use client";

import { useEffect, useMemo, useRef } from "react";
import { layoutString } from "@/lib/glyphs";
import styles from "./HersheyLoader.module.css";

type Props = {
  text?: string;
  onComplete: () => void;
};

type PreparedLetter = {
  key: string;
  path: string;
  letterIdx: number;
  isEmpty: boolean;
};

const LETTER_SPACING = 4;
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

  const letters = useMemo<PreparedLetter[]>(() => {
    return layout.chars.map((char, i) => ({
      key: `${char.char}-${i}`,
      path: char.path,
      letterIdx: i,
      isEmpty: char.path.trim().length === 0,
    }));
  }, [layout]);

  const padX = 8;
  const padY = 6;
  const vbX = -padX;
  const vbY = layout.minY - padY;
  const vbW = layout.width + padX * 2;
  const vbH = layout.maxY - layout.minY + padY * 2;

  useEffect(() => {
    const overlay = overlayRef.current;
    const svg = svgRef.current;
    if (!overlay || !svg) return;
    if (doneRef.current) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let finishTimer = 0;
    let fadeTimer = 0;
    const rafIds: number[] = [];

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      overlay.classList.add(styles.fading);
      fadeTimer = window.setTimeout(() => onCompleteRef.current(), 520);
    };

    if (reduced) {
      // Reveal everything statically and fade out shortly.
      const paths = svg.querySelectorAll<SVGPathElement>("path");
      paths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
      });
      finishTimer = window.setTimeout(finish, 600);
    } else {
      const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));

      // Per-letter timing. Each letter is one continuous merged path that
      // traces in one fluid sweep; letters fire sequentially so the eye
      // sees the word being written one letter at a time.
      const LEN_TO_MS = 14;
      const MIN_LETTER_MS = 260;
      const LETTER_GAP_MS = 70;
      const WORD_GAP_MS = 220;
      const EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";

      let totalMs = 0;
      let pathIdx = 0;

      // Walk the FULL letter list (including spaces) so empty glyphs still
      // advance the clock for the word gap.
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const isWordBoundary = letter.isEmpty;

        if (i > 0) {
          totalMs += isWordBoundary ? WORD_GAP_MS : LETTER_GAP_MS;
        }

        if (!letter.isEmpty) {
          const path = paths[pathIdx];
          pathIdx++;
          const len = path.getTotalLength();
          const dur = Math.max(MIN_LETTER_MS, Math.round(len * LEN_TO_MS));

          // Initial state: invisible (dashoffset = full length).
          path.style.strokeDasharray = `${len}`;
          path.style.strokeDashoffset = `${len}`;
          // Transition kicks in when we set strokeDashoffset to 0 below.
          path.style.transition = `stroke-dashoffset ${dur}ms ${EASING} ${totalMs}ms`;

          totalMs += dur;
        }
      }

      // Force the browser to commit the initial dasharray/dashoffset/transition
      // state before we flip strokeDashoffset to 0. Without this commit the
      // browser may collapse the two updates into one frame and skip the
      // animation entirely (the path appears fully drawn instantly).
      // Reading offsetWidth forces a synchronous layout flush.
      void svg.getBoundingClientRect();

      rafIds.push(
        requestAnimationFrame(() => {
          rafIds.push(
            requestAnimationFrame(() => {
              for (const path of paths) {
                path.style.strokeDashoffset = "0";
              }
            }),
          );
        }),
      );

      const holdMs = 320;
      finishTimer = window.setTimeout(finish, totalMs + holdMs);
    }

    return () => {
      rafIds.forEach((id) => cancelAnimationFrame(id));
      if (finishTimer) window.clearTimeout(finishTimer);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, [letters]);

  return (
    <div ref={overlayRef} className={styles.overlay} aria-hidden="false">
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        role="img"
        aria-label={text}
      >
        {letters.map((l) =>
          l.isEmpty ? null : (
            <path
              key={l.key}
              className={styles.stroke}
              d={l.path}
              data-letter={l.letterIdx}
              // Inline initial state so SSR + first client render show the
              // path as invisible. JS overwrites with the measured length on
              // mount.
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
              }}
            />
          ),
        )}
      </svg>
    </div>
  );
}
