"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import styles from "./Nav.module.css";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/playground", label: "Playground" },
] as const;

export function Nav() {
  const pathname = usePathname();
  return (
    <LayoutGroup id="main-nav">
      <nav className={styles.nav} aria-label="Primary">
        {LINKS.map((l) => {
          const active =
            l.href === "/"
              ? pathname === "/"
              : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={styles.pill}
              data-active={active ? "true" : "false"}
              data-cursor=""
            >
              {active && (
                <motion.span
                  className={styles.activeBg}
                  layoutId="nav-active"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                    mass: 0.8,
                  }}
                />
              )}
              <span className={styles.label}>{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}
