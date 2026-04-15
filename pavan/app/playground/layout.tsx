import { Footer } from "../components/Footer";
import { PageEnter } from "../components/PageEnter";
import { PlaygroundNav } from "./components/PlaygroundNav";
import styles from "./playground.module.css";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageEnter>
      <main className={styles.column}>
        <PlaygroundNav />
        {children}
        <Footer />
      </main>
    </PageEnter>
  );
}
