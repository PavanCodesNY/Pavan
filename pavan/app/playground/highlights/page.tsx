import { getHighlights } from "../data/highlights";
import { HighlightCard } from "./HighlightCard";
import styles from "./page.module.css";

export default function HighlightsPage() {
  const highlights = getHighlights();

  return (
    <section className={styles.feed}>
      {highlights.map((item) => (
        <HighlightCard key={item.id} highlight={item} />
      ))}
    </section>
  );
}
