"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePointer } from "./PointerProvider";
import styles from "./BreathingProse.module.css";

export type Segment = string | { text: string; href: string };
export type Paragraph = Segment[];

type Props = {
  paragraphs: Paragraph[];
};

const BREATH_RADIUS = 120;

/**
 * First-paragraph renderer: wraps every visible character in a span with
 * index-ordered `--i` so CSS stagger can animate a left-to-right reveal.
 * Words are <span class="word"> for cursor-proximity opacity breathing.
 */
function renderCharParagraph(segs: Segment[]) {
  const nodes: React.ReactNode[] = [];
  let charIndex = 0;
  let key = 0;

  for (const seg of segs) {
    if (typeof seg === "string") {
      // Split into words (keeping whitespace as its own word for natural wrapping).
      const tokens = seg.split(/(\s+)/);
      for (const tok of tokens) {
        if (tok === "") continue;
        if (/^\s+$/.test(tok)) {
          nodes.push(tok);
          continue;
        }
        const wordChars: React.ReactNode[] = [];
        for (const c of tok) {
          wordChars.push(
            <span
              key={charIndex}
              className={styles.char}
              style={{ ["--i" as string]: charIndex }}
            >
              {c}
            </span>,
          );
          charIndex++;
        }
        nodes.push(
          <span key={`w-${key++}`} className={styles.word} data-word="">
            {wordChars}
          </span>,
        );
      }
    } else {
      // Link inside the first paragraph: wrap as a link, still char-split.
      const linkChars: React.ReactNode[] = [];
      for (const c of seg.text) {
        linkChars.push(
          <span
            key={charIndex}
            className={styles.char}
            style={{ ["--i" as string]: charIndex }}
          >
            {c}
          </span>,
        );
        charIndex++;
      }
      nodes.push(
        <span
          key={`lw-${key++}`}
          className={styles.word}
          data-word=""
        >
          <Link
            href={seg.href}
            className={styles.link}
            data-cursor=""
            target={seg.href.startsWith("http") ? "_blank" : undefined}
            rel={seg.href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {linkChars}
          </Link>
        </span>,
      );
    }
  }
  return nodes;
}

/**
 * Simpler renderer for paragraphs 2 and 3: words still wrapped for breath,
 * but no per-character clip-path reveal.
 */
function renderSimpleParagraph(segs: Segment[]) {
  const nodes: React.ReactNode[] = [];
  let key = 0;
  for (const seg of segs) {
    if (typeof seg === "string") {
      const tokens = seg.split(/(\s+)/);
      for (const tok of tokens) {
        if (tok === "") continue;
        if (/^\s+$/.test(tok)) {
          nodes.push(tok);
          continue;
        }
        nodes.push(
          <span key={`w-${key++}`} className={styles.word} data-word="">
            {tok}
          </span>,
        );
      }
    } else {
      nodes.push(
        <span
          key={`lw-${key++}`}
          className={styles.word}
          data-word=""
        >
          <Link
            href={seg.href}
            className={styles.link}
            data-cursor=""
            target={seg.href.startsWith("http") ? "_blank" : undefined}
            rel={seg.href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {seg.text}
          </Link>
        </span>,
      );
    }
  }
  return nodes;
}

export function BreathingProse({ paragraphs }: Props) {
  const { registerTick } = usePointer();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const wordsRef = useRef<
    Array<{ el: HTMLElement; cx: number; cy: number }>
  >([]);

  // Intersection-observed paragraph reveal.
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

  // Cursor breath: opacity only, no layout reflow.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(
      "(hover: none), (max-width: 767px), (prefers-reduced-motion: reduce)",
    );
    if (mql.matches) return;

    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const words = Array.from(root.querySelectorAll<HTMLElement>("[data-word]"));
      wordsRef.current = words.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
    };

    measure();
    const onResize = () => measure();
    const onScroll = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    const unregister = registerTick((p) => {
      if (!p.active) {
        for (const w of wordsRef.current) {
          w.el.style.setProperty("--breath", "0");
        }
        return;
      }
      for (const w of wordsRef.current) {
        const dx = p.x - w.cx;
        const dy = p.y - w.cy;
        const d2 = dx * dx + dy * dy;
        const r2 = BREATH_RADIUS * BREATH_RADIUS;
        if (d2 > r2) {
          w.el.style.setProperty("--breath", "0");
        } else {
          const t = 1 - Math.sqrt(d2) / BREATH_RADIUS;
          w.el.style.setProperty("--breath", t.toFixed(3));
        }
      }
    });

    return () => {
      unregister();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [registerTick]);

  return (
    <div ref={rootRef} className={styles.root}>
      {paragraphs.map((segs, i) => {
        if (i === 0) {
          return (
            <p
              key={i}
              data-para=""
              className={`${styles.para} ${styles.charPara}`}
            >
              {renderCharParagraph(segs)}
            </p>
          );
        }
        return (
          <p
            key={i}
            data-para=""
            className={`${styles.para} ${styles.simplePara}`}
          >
            {renderSimpleParagraph(segs)}
          </p>
        );
      })}
    </div>
  );
}
