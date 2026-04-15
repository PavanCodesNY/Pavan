import { PretextText } from "./PretextText";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.rule} aria-hidden="true" />
      <PretextText
        as="p"
        segments={["// Updated April 2026"]}
        lineHeight={16}
        className={styles.caption}
      />
    </footer>
  );
}
