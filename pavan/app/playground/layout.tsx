import { Footer } from "../components/Footer";
import { PlaygroundNav } from "./components/PlaygroundNav";
import styles from "./playground.module.css";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className={styles.column}>
      <PlaygroundNav />
      {children}
      <Footer />
    </main>
  );
}
