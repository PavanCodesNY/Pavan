"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePointer } from "./PointerProvider";
import { SPRINGS, springStep } from "@/lib/spring";
import styles from "./MagneticLine.module.css";

export type MagneticPart =
  | { text: string }
  | { text: string; href: string };

type Props = {
  parts: MagneticPart[];
};

type SpanState = {
  el: HTMLSpanElement;
  cx: number;
  cy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const RADIUS = 150;
const MAX_PUSH = 11;

export function MagneticLine({ parts }: Props) {
  const { registerTick } = usePointer();
  const rootRef = useRef<HTMLParagraphElement | null>(null);
  const spansRef = useRef<SpanState[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(
      "(hover: none), (max-width: 767px), (prefers-reduced-motion: reduce)",
    );
    if (mql.matches) return;

    const root = rootRef.current;
    if (!root) return;

    const spans = Array.from(
      root.querySelectorAll<HTMLSpanElement>("[data-magnetic]"),
    );

    const measure = () => {
      spansRef.current = spans.map((el) => {
        // Reset any lingering transform so we measure the resting rect.
        const prev = el.style.transform;
        el.style.transform = "translate3d(0,0,0)";
        const r = el.getBoundingClientRect();
        el.style.transform = prev;
        return {
          el,
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        };
      });
    };

    measure();
    const onResize = () => measure();
    const onScroll = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    const unregister = registerTick((p) => {
      for (const s of spansRef.current) {
        let tx = 0;
        let ty = 0;
        if (p.active) {
          const dx = p.x - s.cx;
          const dy = p.y - s.cy;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < RADIUS) {
            const falloff = 1 - d / RADIUS;
            const push = MAX_PUSH * falloff;
            tx = -(dx / d) * push;
            ty = -(dy / d) * push;
          }
        }
        const [nx, vx] = springStep(s.x, tx, s.vx, SPRINGS.magnetic);
        const [ny, vy] = springStep(s.y, ty, s.vy, SPRINGS.magnetic);
        s.x = nx;
        s.y = ny;
        s.vx = vx;
        s.vy = vy;
        s.el.style.transform = `translate3d(${nx.toFixed(2)}px, ${ny.toFixed(2)}px, 0)`;
      }
    });

    return () => {
      unregister();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [registerTick]);

  return (
    <p ref={rootRef} className={styles.line}>
      {parts.map((part, i) => {
        const common = {
          className: styles.part,
          "data-magnetic": "",
        } as const;
        if ("href" in part) {
          return (
            <Link
              key={i}
              href={part.href}
              className={`${styles.part} ${styles.link}`}
              data-magnetic=""
              data-cursor=""
              target={part.href.startsWith("http") ? "_blank" : undefined}
              rel={part.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {part.text}
            </Link>
          );
        }
        return (
          <span key={i} {...common}>
            {part.text}
          </span>
        );
      })}
    </p>
  );
}
