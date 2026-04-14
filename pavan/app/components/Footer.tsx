import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.rule} aria-hidden="true" />
      <p className={styles.caption}>{"// Updated April 2026"}</p>
    </footer>
  );
}
