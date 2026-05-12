import type { Segment } from "@/lib/pretext-helpers";
import { PretextText } from "./PretextText";
import styles from "./BreathingProse.module.css";

export type Paragraph = Segment[];

type Props = {
  paragraphs: Paragraph[];
};

export function BreathingProse({ paragraphs }: Props) {
  return (
    <div className={styles.root}>
      {paragraphs.map((segs, i) => (
        <PretextText
          key={i}
          as="p"
          segments={segs}
          className={styles.para}
        />
      ))}
    </div>
  );
}
