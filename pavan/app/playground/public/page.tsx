import Link from "next/link";
import { POSTS } from "../data/posts";
import styles from "./page.module.css";

export default function PublicPage() {
  return (
    <section className={styles.list}>
      {POSTS.map((post) => (
        <Link
          key={post.slug}
          href={`/playground/public/${post.slug}`}
          className={styles.entry}
          data-cursor=""
        >
          <time className={styles.date}>{post.date}</time>
          <h2 className={styles.title}>{post.title}</h2>
          <p className={styles.excerpt}>{post.excerpt}</p>
        </Link>
      ))}
    </section>
  );
}
