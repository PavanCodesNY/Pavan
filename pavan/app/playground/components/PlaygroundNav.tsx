"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import styles from "./PlaygroundNav.module.css";

const TABS = [
  { href: "/playground/public", label: "Public" },
  { href: "/playground/hire-me", label: "Hire Me" },
  { href: "/playground/highlights", label: "Highlights" },
] as const;

export function PlaygroundNav() {
  const pathname = usePathname();
  return (
    <LayoutGroup id="playground-tabs">
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
              {active && (
                <motion.span
                  className={styles.activeBg}
                  layoutId="playground-tab-active"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                    mass: 0.8,
                  }}
                />
              )}
              <span className={styles.label}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}
