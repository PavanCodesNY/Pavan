"use client";

import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import styles from "./Avatar.module.css";

const PRANK_TEXT = "hello again";
const CHAR_DELAY = 70;
const HOLD_AFTER = 1000;
const FADE_OUT = 500;

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function toggleTheme() {
  const dark = !isDark();
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
}

export function Avatar() {
  const [errored, setErrored] = useState(false);
  const [prank, setPrank] = useState<
    "idle" | "fill" | "typing" | "hold" | "exit"
  >("idle");
  const [charCount, setCharCount] = useState(0);
  const [targetDark, setTargetDark] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Restore saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startPrank = useCallback(() => {
    if (prank !== "idle") return;
    // The overlay shows what the NEW theme will be
    setTargetDark(!isDark());
    setPrank("fill");
    setCharCount(0);

    timerRef.current = setTimeout(() => {
      setPrank("typing");
    }, 800);
  }, [prank]);

  useEffect(() => {
    if (prank !== "typing") return;
    if (charCount < PRANK_TEXT.length) {
      timerRef.current = setTimeout(
        () => setCharCount((c) => c + 1),
        CHAR_DELAY,
      );
      return () => cleanup();
    }
    // Typing done — hold, toggle theme, then exit
    timerRef.current = setTimeout(() => {
      toggleTheme();
      setPrank("exit");
      setTimeout(() => setPrank("idle"), FADE_OUT);
    }, HOLD_AFTER);
    return () => cleanup();
  }, [prank, charCount, cleanup]);

  // Overlay bg = new theme's paper; text = new theme's ink
  const overlayStyle = targetDark
    ? { background: "#0b0b0a", color: "#faf9f6" }
    : { background: "#faf9f6", color: "#0b0b0a" };

  return (
    <>
      <motion.div
        className={styles.wrap}
        data-cursor=""
        onClick={startPrank}
        whileHover={{ scale: 1.12, borderColor: "var(--ink)" }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.6,
        }}
      >
        {errored ? (
          <span className={styles.fallback} aria-label="Pavan Kumar">
            PK
          </span>
        ) : (
          <Image
            src="/avatar.png"
            alt="Pavan Kumar"
            width={40}
            height={40}
            priority
            className={styles.img}
            onError={() => setErrored(true)}
          />
        )}
      </motion.div>

      {prank !== "idle" && (
        <div
          className={`${styles.overlay} ${prank === "exit" ? styles.overlayExit : ""}`}
          style={overlayStyle}
          onClick={() => {
            cleanup();
            toggleTheme();
            setPrank("exit");
            setTimeout(() => setPrank("idle"), FADE_OUT);
          }}
        >
          {(prank === "typing" || prank === "hold" || prank === "exit") && (
            <span className={styles.prankText}>
              {PRANK_TEXT.slice(0, charCount)}
              {prank === "typing" && (
                <span
                  className={styles.caret}
                  style={{ background: overlayStyle.color }}
                />
              )}
            </span>
          )}
        </div>
      )}
    </>
  );
}
