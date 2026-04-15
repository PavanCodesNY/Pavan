"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import styles from "./ArrowGuide.module.css";

const STORAGE_KEY = "arrow-guide-shown";
const DRAW_DURATION = 1200;
const HOLD_MS = 1500;
const FADE_MS = 600;
const INITIAL_DELAY = 3500;

/** Walk child nodes right-to-left to find last non-empty text node. */
function lastTextNode(el: Node): Text | null {
  for (let i = el.childNodes.length - 1; i >= 0; i--) {
    const child = el.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim())
      return child as Text;
    const deeper = lastTextNode(child);
    if (deeper) return deeper;
  }
  return null;
}

/** Get viewport rect of a single character via Range API. */
function charRect(textNode: Text, offset: number): DOMRect | null {
  const range = document.createRange();
  range.setStart(textNode, offset);
  range.setEnd(textNode, offset + 1);
  const rects = range.getClientRects();
  return rects.length > 0 ? rects[0] : null;
}

type CurvePoints = {
  sx: number; sy: number;
  cp1x: number; cp1y: number;
  cp2x: number; cp2y: number;
  ex: number; ey: number;
};

function measureCurve(): CurvePoints | null {
  let allLines = document.querySelectorAll("[data-para-line]");
  if (allLines.length === 0) {
    const veil = document.querySelector(".content-veil");
    if (veil) allLines = veil.querySelectorAll("[data-line]");
  }
  if (allLines.length === 0) return null;

  const lastLine = allLines[allLines.length - 1];
  const textNode = lastTextNode(lastLine);
  if (!textNode?.textContent?.includes(".")) return null;

  const dotIndex = textNode.textContent.lastIndexOf(".");
  const rect = charRect(textNode, dotIndex);
  if (!rect) return null;

  const sx = rect.right + 6;
  const sy = rect.top + rect.height / 2;
  const vw = window.innerWidth;
  const ex = vw - 44;
  const ey = 44;

  const dx = ex - sx;
  const dy = ey - sy;
  return {
    sx, sy,
    cp1x: sx + dx * 0.25,
    cp1y: sy + dy * 0.05 - 30,
    cp2x: ex + 50,
    cp2y: ey + Math.abs(dy) * 0.35,
    ex, ey,
  };
}

/** Evaluate cubic bezier at parameter t */
function bezierPoint(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export function ArrowGuide() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"waiting" | "drawing" | "fading" | "done">("waiting");
  const animRef = useRef<number>(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // DEBUG: always run
    sessionStorage.removeItem(STORAGE_KEY);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const timer = window.setTimeout(() => {
      const curve = measureCurve();
      if (!curve) return;

      const { sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey } = curve;

      // Get ink-hush color from CSS
      const rootStyles = getComputedStyle(document.documentElement);
      const inkHush = rootStyles.getPropertyValue("--ink-hush").trim() || "rgba(11,11,10,0.18)";

      let startTime: number | null = null;
      setPhase("drawing");

      const drawFrame = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / DRAW_DURATION, 1);

        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);

        ctx.clearRect(0, 0, vw, vh);
        ctx.strokeStyle = inkHush;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 4]);
        ctx.lineCap = "round";

        // Draw the curve up to the current progress
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        const steps = Math.floor(eased * 100);
        for (let i = 1; i <= steps; i++) {
          const t = i / 100;
          const x = bezierPoint(t, sx, cp1x, cp2x, ex);
          const y = bezierPoint(t, sy, cp1y, cp2y, ey);
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw arrowhead when near complete
        if (eased > 0.8) {
          const t1 = 0.98;
          const t2 = 1;
          const ax = bezierPoint(t2, sx, cp1x, cp2x, ex);
          const ay = bezierPoint(t2, sy, cp1y, cp2y, ey);
          const bx = bezierPoint(t1, sx, cp1x, cp2x, ex);
          const by = bezierPoint(t1, sy, cp1y, cp2y, ey);
          const angle = Math.atan2(ay - by, ax - bx);
          const size = 7;

          ctx.fillStyle = inkHush;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(
            ax - size * Math.cos(angle - 0.45),
            ay - size * Math.sin(angle - 0.45),
          );
          ctx.lineTo(
            ax - size * Math.cos(angle + 0.45),
            ay - size * Math.sin(angle + 0.45),
          );
          ctx.closePath();
          ctx.fill();
        }

        if (progress < 1) {
          animRef.current = requestAnimationFrame(drawFrame);
        } else {
          // Hold then fade
          timersRef.current.push(
            window.setTimeout(() => {
              sessionStorage.setItem(STORAGE_KEY, "1");
              setPhase("fading");
              timersRef.current.push(
                window.setTimeout(() => setPhase("done"), FADE_MS),
              );
            }, HOLD_MS),
          );
        }
      };

      // Abort on scroll
      const onScroll = () => {
        clearTimers();
        sessionStorage.setItem(STORAGE_KEY, "1");
        setPhase("fading");
        timersRef.current.push(
          window.setTimeout(() => setPhase("done"), FADE_MS),
        );
      };
      window.addEventListener("scroll", onScroll, { passive: true, once: true });

      animRef.current = requestAnimationFrame(drawFrame);
    }, INITIAL_DELAY);

    return () => {
      window.clearTimeout(timer);
      clearTimers();
    };
  }, [clearTimers]);

  if (phase === "done") return null;

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.overlay} ${phase === "fading" ? styles.fadeOut : ""}`}
      aria-hidden="true"
    />
  );
}
