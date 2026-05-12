import Link from "next/link";
import styles from "./MagneticLine.module.css";

export type MagneticPart =
  | { text: string }
  | { text: string; href: string };

type Props = {
  parts: MagneticPart[];
};

export function MagneticLine({ parts }: Props) {
  return (
    <p className={styles.line}>
      {parts.map((part, i) => {
        if ("href" in part) {
          const external = part.href.startsWith("http");
          return (
            <Link
              key={i}
              href={part.href}
              className={`${styles.part} ${styles.link}`}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {part.text}
            </Link>
          );
        }
        return (
          <span key={i} className={styles.part}>
            {part.text}
          </span>
        );
      })}
    </p>
  );
}
