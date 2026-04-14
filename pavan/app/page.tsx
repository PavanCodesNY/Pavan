import { MagneticLine, type MagneticPart } from "./components/MagneticLine";
import {
  BreathingProse,
  type Paragraph,
} from "./components/BreathingProse";
import { Footer } from "./components/Footer";
import styles from "./page.module.css";

const DESCRIPTOR: MagneticPart[] = [
  { text: "18. Building\u2009" },
  { text: "Clean", href: "https://tryclean.ai" },
  { text: ". Living between San Diego and\u00a0SF." },
];

const BODY: Paragraph[] = [
  [
    "I moved to the US in 2022, midway through high school. Right now I\u2019m building ",
    { text: "Clean", href: "https://tryclean.ai" },
    ", the shared context intelligence layer for AI Agents. Before this I worked at Cisco and two early-stage startups, which is where I caught the bug.",
  ],
  [
    "I post on ",
    { text: "LinkedIn", href: "https://linkedin.com/in/pavankumarny" },
    " every day and haven\u2019t stopped for about 8 months now. I love hackathons more than I probably should. I\u2019ve won 7 total, 5 of them in a 5-day stretch. I also competed in VEX Robotics internationally from 2022 to 2025, which is still one of my favorite things I\u2019ve done.",
  ],
  [
    "I\u2019m at UC San Diego studying Computer Engineering, but I drive up to SF every chance I get. During breaks I basically live there. If you want to follow along or say\u00a0hi, I\u2019m on ",
    { text: "LinkedIn", href: "https://linkedin.com/in/pavankumarny" },
    " and ",
    { text: "X", href: "https://x.com/PavanKumarNY" },
    ".",
  ],
];

export default function Home() {
  return (
    <main className={styles.column}>
      <h1 className={styles.name}>Pavan Kumar</h1>
      <div className={styles.gapS} aria-hidden="true" />
      <MagneticLine parts={DESCRIPTOR} />
      <div className={styles.gapL} aria-hidden="true" />
      <BreathingProse paragraphs={BODY} />
      <Footer />
    </main>
  );
}
