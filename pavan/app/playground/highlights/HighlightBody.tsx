"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

export function HighlightBody({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [content]);

  return (
    <>
      <div
        ref={ref}
        className={styles.body}
        data-expanded={expanded ? "true" : undefined}
      >
        {content}
      </div>
      {truncated && (
        <button
          className={styles.readMore}
          onClick={() => {
            setExpanded((v) => !v);
            setTruncated(!expanded);
          }}
          data-cursor=""
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </>
  );
}
