"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./Avatar.module.css";

export function Avatar() {
  const [errored, setErrored] = useState(false);
  return (
    <div className={styles.wrap} data-cursor="">
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
    </div>
  );
}
