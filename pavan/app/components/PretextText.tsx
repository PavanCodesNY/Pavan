import Link from "next/link";
import type { ReactNode } from "react";
import type { Segment } from "@/lib/pretext-helpers";
import styles from "./PretextText.module.css";

export type PretextTextProps = {
  segments: Segment[];
  as?: "p" | "div" | "span";
  className?: string;
};

function renderSegments(segs: Segment[]): ReactNode {
  return segs.map((seg, i) => {
    if (typeof seg === "string") return seg;
    const external = seg.href.startsWith("http");
    return (
      <Link
        key={i}
        href={seg.href}
        className={styles.link}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {seg.text}
      </Link>
    );
  });
}

export function PretextText({
  segments,
  as = "p",
  className,
}: PretextTextProps) {
  const Tag = as;
  return <Tag className={className}>{renderSegments(segments)}</Tag>;
}
