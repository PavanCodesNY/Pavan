"use client";

import { useEffect, useRef } from "react";
import { usePointer } from "./PointerProvider";
import { SPRINGS, springStep } from "@/lib/spring";
import styles from "./CustomCursor.module.css";

export function CustomCursor() {
  const { registerTick } = usePointer();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ x: -100, y: -100, vx: 0, vy: 0 });

  useEffect(() => {
    // Skip entirely on touch or reduced-motion (CSS hides it, but also bail
    // on the JS subscription so we don't waste cycles).
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(
      "(hover: none), (max-width: 767px), (prefers-reduced-motion: reduce)",
    );
    if (mql.matches) return;

    document.documentElement.classList.add("has-custom-cursor");

    const unregister = registerTick((p) => {
      const s = stateRef.current;
      const [nx, vx] = springStep(s.x, p.x, s.vx, SPRINGS.cursor);
      const [ny, vy] = springStep(s.y, p.y, s.vy, SPRINGS.cursor);
      s.x = nx;
      s.y = ny;
      s.vx = vx;
      s.vy = vy;
      const el = wrapRef.current;
      if (el) {
        el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
      }
    });

    // Event delegation for hover state on [data-cursor] targets.
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[data-cursor]")) {
        wrapRef.current?.setAttribute("data-hovering", "true");
      }
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const related = e.relatedTarget as HTMLElement | null;
      if (t && t.closest("[data-cursor]")) {
        if (!related || !related.closest("[data-cursor]")) {
          wrapRef.current?.setAttribute("data-hovering", "false");
        }
      }
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      unregister();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.classList.remove("has-custom-cursor");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      aria-hidden="true"
      data-hovering="false"
    >
      <span className={styles.ring} />
      <span className={styles.dot} />
    </div>
  );
}
