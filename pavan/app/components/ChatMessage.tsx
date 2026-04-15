"use client";

import { useState, useEffect, useRef } from "react";
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

function pickPhrase(usedSet: Set<number>): string {
  if (usedSet.size >= LOADING_PHRASES.length) usedSet.clear();
  let idx: number;
  do {
    idx = Math.floor(Math.random() * LOADING_PHRASES.length);
  } while (usedSet.has(idx));
  usedSet.add(idx);
  return LOADING_PHRASES[idx];
}

function LoadingMessage() {
  const [displayed, setDisplayed] = useState("");
  const phraseRef = useRef("");
  const charRef = useRef(0);
  const phaseRef = useRef<"typing" | "pause" | "erasing">("typing");
  const usedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    phraseRef.current = pickPhrase(usedRef.current);
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
          phraseRef.current = pickPhrase(usedRef.current);
          charRef.current = 0;
          phaseRef.current = "typing";
        }
      }
    }, 35);

    return () => {
      clearInterval(timer);
      clearTimeout(pauseTimeout);
    };
  }, []);

  return (
    <div className={`${styles.message} ${styles.assistant} ${styles.loading}`}>
      {displayed}
      <span className={styles.cursor} />
    </div>
  );
}

function TypewriterMessage({ content }: { content: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;

    // Use queueMicrotask to avoid synchronous setState in effect body
    queueMicrotask(() => {
      setDisplayed("");
      setDone(false);
    });

    const timer = setInterval(() => {
      const charsToAdd = content[indexRef.current] === " " ? 2 : 1;
      indexRef.current = Math.min(indexRef.current + charsToAdd, content.length);
      setDisplayed(content.slice(0, indexRef.current));

      if (indexRef.current >= content.length) {
        setDone(true);
        clearInterval(timer);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [content]);

  if (done) {
    return (
      <div className={`${styles.message} ${styles.assistant} ${styles.prose}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={`${styles.message} ${styles.assistant}`}>
      {displayed}
      <span className={styles.cursor} />
    </div>
  );
}

export function ChatMessage({ role, content, isStreaming }: Props) {
  if (role === "user") {
    return <div className={`${styles.message} ${styles.user}`}>{content}</div>;
  }

  return <AssistantMessage content={content} isStreaming={isStreaming} />;
}

function AssistantMessage({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const isWaiting = isStreaming && !content;
  const [hasTypewritten, setHasTypewritten] = useState(false);

  // When streaming completes with content, trigger typewriter once
  const shouldTypewrite = isStreaming === false && content.length > 0 && !hasTypewritten;

  useEffect(() => {
    if (shouldTypewrite) {
      // Mark as typewritten after component renders with TypewriterMessage
      const t = setTimeout(() => setHasTypewritten(true), 0);
      return () => clearTimeout(t);
    }
  }, [shouldTypewrite]);

  if (isWaiting) {
    return <LoadingMessage />;
  }

  if (shouldTypewrite || (!hasTypewritten && content.length > 0 && isStreaming === false)) {
    return <TypewriterMessage content={content} />;
  }

  // Already shown / old messages — render markdown directly
  return (
    <div className={`${styles.message} ${styles.assistant} ${styles.prose}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
