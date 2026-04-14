"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Nav.module.css";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/playground", label: "Playground" },
] as const;

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Primary">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={styles.pill}
            data-active={active ? "true" : "false"}
            data-cursor=""
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
