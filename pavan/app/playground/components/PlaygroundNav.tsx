"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./PlaygroundNav.module.css";

const TABS = [
  { href: "/playground/public", label: "Public" },
  { href: "/playground/hire-me", label: "Hire Me" },
  { href: "/playground/highlights", label: "Highlights" },
] as const;

export function PlaygroundNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.tabs} aria-label="Playground sections">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={styles.tab}
            data-active={active ? "true" : "false"}
            data-cursor=""
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
