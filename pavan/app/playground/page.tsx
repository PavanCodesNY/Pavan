import styles from "../page.module.css";
import playgroundStyles from "./page.module.css";
import { Footer } from "../components/Footer";

export default function PlaygroundPage() {
  return (
    <main className={styles.column}>
      <p className={playgroundStyles.soon}>Soon.</p>
      <Footer />
    </main>
  );
}
