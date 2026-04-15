"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ChatBar.module.css";

type Status = "compact" | "bar" | "expanded";
type Message = { role: "user" | "assistant"; content: string };

const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

const SIZES = {
  compact: { width: 140, height: 36, borderRadius: 999 },
  bar: { width: Math.min(520, typeof window !== "undefined" ? window.innerWidth * 0.5 : 520), height: 44, borderRadius: 999 },
  expanded: { width: Math.min(520, typeof window !== "undefined" ? window.innerWidth * 0.5 : 520), height: Math.min(460, typeof window !== "undefined" ? window.innerHeight - 120 : 460), borderRadius: 20 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function ChatBar({ visible = true }: { visible?: boolean }) {
  const [status, setStatus] = useState<Status>("compact");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sizes, setSizes] = useState(SIZES);
  const rootRef = useRef<HTMLDivElement>(null);
  const barInputRef = useRef<HTMLTextAreaElement>(null);
  const panelInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Recompute sizes on resize
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const barW = vw <= 480 ? vw - 32 : vw <= 900 ? Math.min(vw * 0.7, 480) : Math.min(vw * 0.5, 520);
      const expW = vw <= 480 ? vw - 16 : vw <= 900 ? Math.min(vw * 0.7, 480) : Math.min(vw * 0.5, 520);
      const expH = vw <= 480 ? Math.min(420, vh - 80) : Math.min(460, vh - 120);
      setSizes({
        compact: { width: vw <= 480 ? 36 : 140, height: 36, borderRadius: 999 },
        bar: { width: barW, height: 44, borderRadius: 999 },
        expanded: { width: expW, height: expH, borderRadius: 20 },
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Hover → expand to bar (or expanded if has history)
  const handleMouseEnter = useCallback(() => {
    if (status === "compact") {
      setStatus(messages.length > 0 ? "expanded" : "bar");
    }
  }, [status, messages.length]);

  // Mouse leave → always collapse back to compact
  const handleMouseLeave = useCallback(() => {
    if (status !== "compact") setStatus("compact");
  }, [status]);

  const forceCollapse = useCallback(() => {
    setStatus("compact");
  }, []);

  // Send message: transition bar → expanded
  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    if (status === "bar") setStatus("expanded");
    if (barInputRef.current) barInputRef.current.style.height = "auto";
    if (panelInputRef.current) panelInputRef.current.style.height = "auto";
    // TODO: send to Claude API and stream assistant response
  }, [input, status]);

  // Focus inputs after state transitions
  useEffect(() => {
    if (status === "bar") {
      const t = setTimeout(() => barInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [status]);

  useEffect(() => {
    if (status === "expanded") {
      const t = setTimeout(() => panelInputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Escape to close
  useEffect(() => {
    if (status === "compact") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") forceCollapse();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [status, forceCollapse]);

  // Click outside to close
  useEffect(() => {
    if (status === "compact") return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        forceCollapse();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [status, forceCollapse]);

  // Auto-scroll messages
  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handlePanelInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
  };

  if (!visible) return null;

  const hasInput = input.trim().length > 0;
  const current = sizes[status];

  return (
    <motion.div
      ref={rootRef}
      className={styles.root}
      animate={{
        width: current.width,
        height: current.height,
        borderRadius: current.borderRadius,
      }}
      transition={spring}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={status === "expanded" ? "dialog" : undefined}
      aria-label={status === "expanded" ? "Chat with Pavan" : undefined}
    >
      <AnimatePresence mode="wait">
        {/* Compact pill */}
        {status === "compact" && (
          <motion.button
            key="pill"
            className={styles.pill}
            onClick={() => setStatus(messages.length > 0 ? "expanded" : "bar")}
            aria-expanded={false}
            data-cursor=""
            {...fadeIn}
            transition={{ duration: 0.15 }}
          >
            <svg
              className={styles.pillIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
            </svg>
            <span className={styles.pillLabel}>Ask me</span>
          </motion.button>
        )}

        {/* Bar state: just the input row */}
        {status === "bar" && (
          <motion.div
            key="bar"
            className={styles.barInput}
            {...fadeIn}
            transition={{ duration: 0.2, delay: 0.12 }}
          >
            <textarea
              ref={barInputRef}
              className={styles.input}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything…"
              rows={1}
            />
            <button
              className={styles.send}
              onClick={send}
              aria-label="Send message"
              data-active={hasInput ? "true" : "false"}
              data-cursor=""
            >
              <svg
                className={styles.sendIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Expanded chat panel */}
        {status === "expanded" && (
          <motion.div
            key="panel"
            className={styles.panel}
            {...fadeIn}
            transition={{ duration: 0.25, delay: 0.15 }}
          >
            <div className={styles.header}>
              <span className={styles.title}>Ask Pavan</span>
              <button
                className={styles.close}
                onClick={forceCollapse}
                aria-label="Close chat"
                data-cursor=""
              >
                ×
              </button>
            </div>

            <div ref={messagesRef} className={styles.messages}>
              {messages.length === 0 ? (
                <div className={styles.empty}>
                  Ask anything about Pavan.
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`${styles.message} ${
                      msg.role === "user"
                        ? styles.messageUser
                        : styles.messageAssistant
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>

            <div className={styles.inputArea}>
              <textarea
                ref={panelInputRef}
                className={styles.panelInput}
                value={input}
                onChange={handlePanelInput}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
              />
              <button
                className={styles.send}
                onClick={send}
                aria-label="Send message"
                data-active={hasInput ? "true" : "false"}
                data-cursor=""
              >
                <svg
                  className={styles.sendIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
