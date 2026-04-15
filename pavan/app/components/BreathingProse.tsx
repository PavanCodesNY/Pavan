"use client";

import { useEffect, useRef } from "react";
import { usePointer } from "./PointerProvider";
import { PretextText } from "./PretextText";
import type { Segment } from "@/lib/pretext-helpers";
import styles from "./BreathingProse.module.css";

export type Paragraph = Segment[];

type Props = {
  paragraphs: Paragraph[];
};

const BREATH_RADIUS = 160;
const LINE_HEIGHT = 32;

export function BreathingProse({ paragraphs }: Props) {
  const { registerTick } = usePointer();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const linesRef = useRef<
    Array<{ el: HTMLElement; cx: number; cy: number }>
  >([]);

  // IntersectionObserver triggers per-paragraph reveal once.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const paras = Array.from(root.querySelectorAll<HTMLElement>("[data-para]"));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      paras.forEach((p) => p.classList.add(styles.assembled));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.12) {
            e.target.classList.add(styles.assembled);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: [0.12, 0.3] },
    );
    paras.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  // Per-line cursor-proximity breath — pure opacity, no layout cost.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(
      "(hover: none), (max-width: 767px), (prefers-reduced-motion: reduce)",
    );
    if (mql.matches) return;

    const root = rootRef.current;
    if (!root) return;

    const measureAll = () => {
      const els = Array.from(root.querySelectorAll<HTMLElement>("[data-line]"));
      linesRef.current = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
    };

    // Re-measure on first paint, on mutations (pretext relayout inserts new
    // spans), and on resize/scroll.
    measureAll();
    const mut = new MutationObserver(() => measureAll());
    mut.observe(root, { childList: true, subtree: true });
    const onResize = () => measureAll();
    const onScroll = () => measureAll();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    const unregister = registerTick((p) => {
      if (!p.active) {
        for (const l of linesRef.current) {
          l.el.style.setProperty("--breath", "0");
        }
        return;
      }
      for (const l of linesRef.current) {
        const dx = p.x - l.cx;
        const dy = p.y - l.cy;
        const d2 = dx * dx + dy * dy;
        const r2 = BREATH_RADIUS * BREATH_RADIUS;
        if (d2 > r2) {
          l.el.style.setProperty("--breath", "0");
        } else {
          const t = 1 - Math.sqrt(d2) / BREATH_RADIUS;
          l.el.style.setProperty("--breath", t.toFixed(3));
        }
      }
    });

    return () => {
      mut.disconnect();
      unregister();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [registerTick]);

  return (
    <div ref={rootRef} className={styles.root}>
      {paragraphs.map((segs, i) => (
        <PretextText
          key={i}
          as="p"
          segments={segs}
          lineHeight={LINE_HEIGHT}
          className={`${styles.para} ${
            i === 0 ? styles.charPara : styles.simplePara
          }`}
          lineClassName={styles.line}
          lineAttrs={() => ({ "data-para-line": "" })}
        />
      ))}
    </div>
  );
}
