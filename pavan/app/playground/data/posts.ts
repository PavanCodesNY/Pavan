export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
};

export const POSTS: Post[] = [
  {
    slug: "building-in-public",
    title: "Building in Public",
    date: "April 14, 2026",
    excerpt:
      "Why I decided to share everything I'm working on — the wins, the failures, and everything in between.",
    body: `There's something terrifying about building in public. Every half-baked idea, every pivot, every moment of doubt — it's all out there.

But I've come to believe that the discomfort is the point. When you build behind closed doors, you optimize for looking smart. When you build in public, you optimize for learning fast.

This playground is my experiment in radical transparency. Not because I think anyone needs to hear what I have to say, but because writing forces clarity. And clarity is the thing I need most right now.

So here we are. Welcome to the mess.`,
  },
  {
    slug: "why-clean",
    title: "Why Clean",
    date: "April 10, 2026",
    excerpt:
      "The shared context intelligence layer for AI Agents — and why I think it matters.",
    body: `Every AI agent today is blind. It sees the current conversation, maybe some retrieved documents, but it has no real understanding of the world it's operating in.

Clean is my attempt to fix that. A shared context intelligence layer that gives agents persistent, structured awareness of the systems they work with.

Think of it this way: you wouldn't hire an employee and wipe their memory every morning. But that's exactly what we do with AI agents today. Clean gives them memory, context, and situational awareness.

We're early. Really early. But the conviction is there, and that's enough to keep building.`,
  },
];
