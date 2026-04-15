import { notFound } from "next/navigation";
import { POSTS } from "../../data/posts";
import styles from "./page.module.css";

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <time className={styles.date}>{post.date}</time>
        <h1 className={styles.title}>{post.title}</h1>
      </header>
      <div className={styles.body}>
        {post.body.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
