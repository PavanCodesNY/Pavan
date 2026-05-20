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
    ", the first self-learning IDE that learns from your team the more you ship. Before this I interned at Cisco designing AI-driven hospital network security with ThousandEyes, and at UCSD\u2019s Computational Neurology Center, where I lead computer vision work for dystonia detection and am co-authoring a paper.",
  ],
  [
    "I post on ",
    { text: "LinkedIn", href: "https://linkedin.com/in/pavankumarny" },
    " every day and haven\u2019t stopped for about 8 months now. I love hackathons more than I probably should. I\u2019ve won 7 of them, 5 inside a single 5-day stretch, including NexHacks, SDx, and two awards at the AWS re:Invent AI Agents Hackathon. I also competed in VEX Robotics internationally from 2022 to 2025, finishing in the top 250 out of 24,000+ teams, which is still one of my favorite things I\u2019ve done.",
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
