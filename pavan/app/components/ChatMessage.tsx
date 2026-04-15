"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatMessage.module.css";

type Props = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

const LOADING_PHRASES = [
  "linkedin maxing rn…",
  "cooking up something fire…",
  "this is gonna be bussin…",
  "no cap, thinking hard…",
  "lowkey processing…",
  "main character moment loading…",
  "ate and left no crumbs…",
  "giving everything rn…",
  "slay in progress…",
  "it's giving… genius…",
  "rent free in my thoughts…",
  "vibes are immaculate hold on…",
  "brainrot loading…",
  "sigma grindset activated…",
  "delulu is the solulu…",
  "living my best AI life…",
  "x maxing as we speak…",
  "this hits different wait…",
];

function useLoadingPhrases(isLoading: boolean) {
  const [displayed, setDisplayed] = useState("");
  const phraseRef = useRef("");
  const charRef = useRef(0);
  const phaseRef = useRef<"typing" | "pause" | "erasing">("typing");
  const usedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoading) {
      setDisplayed("");
      phraseRef.current = "";
      charRef.current = 0;
      phaseRef.current = "typing";
      return;
    }

    const pick = () => {
      if (usedRef.current.size >= LOADING_PHRASES.length) {
        usedRef.current.clear();
      }
      let idx: number;
      do {
        idx = Math.floor(Math.random() * LOADING_PHRASES.length);
      } while (usedRef.current.has(idx));
      usedRef.current.add(idx);
      return LOADING_PHRASES[idx];
    };

    phraseRef.current = pick();
    charRef.current = 0;
    phaseRef.current = "typing";
    let pauseTimeout: ReturnType<typeof setTimeout>;

    const timer = setInterval(() => {
      const current = phraseRef.current;

      if (phaseRef.current === "typing") {
        charRef.current++;
        setDisplayed(current.slice(0, charRef.current));
        if (charRef.current >= current.length) {
          phaseRef.current = "pause";
          pauseTimeout = setTimeout(() => {
            phaseRef.current = "erasing";
          }, 800);
        }
      } else if (phaseRef.current === "erasing") {
        charRef.current--;
        setDisplayed(current.slice(0, charRef.current));
        if (charRef.current <= 0) {
          phraseRef.current = pick();
          charRef.current = 0;
          phaseRef.current = "typing";
        }
      }
    }, 35);

    return () => {
      clearInterval(timer);
      clearTimeout(pauseTimeout);
    };
  }, [isLoading]);

  return displayed;
}

function useTypewriter(text: string, enabled: boolean, speed = 16) {
  const [displayed, setDisplayed] = useState(text);
  const [done, setDone] = useState(true);
  const indexRef = useRef(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Only typewrite on first content arrival, not on re-renders
    if (!enabled || hasAnimatedRef.current || !text) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    hasAnimatedRef.current = true;
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);

    const timer = setInterval(() => {
      const charsToAdd = text[indexRef.current] === " " ? 2 : 1;
      indexRef.current = Math.min(indexRef.current + charsToAdd, text.length);
      setDisplayed(text.slice(0, indexRef.current));

      if (indexRef.current >= text.length) {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, enabled, speed]);

  return { displayed, done };
}

export function ChatMessage({ role, content, isStreaming }: Props) {
  if (role === "user") {
    return <div className={`${styles.message} ${styles.user}`}>{content}</div>;
  }

  return <AssistantMessage content={content} isStreaming={isStreaming} />;
}

function AssistantMessage({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const isWaiting = isStreaming && !content;
  const hasContent = content.length > 0;
  const justArrived = isStreaming === false && hasContent;

  const loadingPhrase = useLoadingPhrases(!!isWaiting);
  const { displayed, done } = useTypewriter(content, justArrived);

  // Waiting for response — show fun loading phrases
  if (isWaiting) {
    return (
      <div className={`${styles.message} ${styles.assistant} ${styles.loading}`}>
        {loadingPhrase}
        <span className={styles.cursor} />
      </div>
    );
  }

  // Typewriting the response
  if (!done) {
    return (
      <div className={`${styles.message} ${styles.assistant}`}>
        {displayed}
        <span className={styles.cursor} />
      </div>
    );
  }

  // Done — render full markdown
  return (
    <div className={`${styles.message} ${styles.assistant} ${styles.prose}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
