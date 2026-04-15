"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./Avatar.module.css";

export function Avatar() {
  const [errored, setErrored] = useState(false);
  return (
    <motion.div
      className={styles.wrap}
      data-cursor=""
      whileHover={{ scale: 1.12, borderColor: "var(--ink)" }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.6,
      }}
    >
      {errored ? (
        <span className={styles.fallback} aria-label="Pavan Kumar">
          PK
        </span>
      ) : (
        <Image
          src="/avatar.png"
          alt="Pavan Kumar"
          width={40}
          height={40}
          priority
          className={styles.img}
          onError={() => setErrored(true)}
        />
      )}
    </motion.div>
  );
}
