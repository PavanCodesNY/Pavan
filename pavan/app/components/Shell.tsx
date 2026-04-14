"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PointerProvider } from "./PointerProvider";
import { HersheyLoader } from "./HersheyLoader";
import { CustomCursor } from "./CustomCursor";
import { Nav } from "./Nav";
import { Avatar } from "./Avatar";

const SESSION_KEY = "pk-loader-seen";

type InnerProps = {
  children: ReactNode;
};

function ShellInner({ children }: InnerProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Decide loader state on mount. Using lazy init so we don't flash an
  // incorrect state between first render and the useEffect in HersheyLoader.
  const [loaded, setLoaded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (!isHome) return true;
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") return true;
    return false;
  });

  // Color bleed orchestration: chain of timers that reveal the accent layers
  // progressively after the content is visible.
  useEffect(() => {
    if (!loaded) return;
    const body = document.body;
    const t1 = window.setTimeout(() => body.classList.add("bleed-links"), 500);
    const t2 = window.setTimeout(
      () => body.classList.add("bleed-cursor"),
      4500,
    );
    const t3 = window.setTimeout(() => body.classList.add("bleed-rule"), 7500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      body.classList.remove("bleed-links", "bleed-cursor", "bleed-rule");
    };
  }, [loaded]);

  const onLoaderComplete = () => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore: private mode / disabled storage */
    }
    setLoaded(true);
  };

  return (
    <>
      {!loaded && isHome ? <HersheyLoader onComplete={onLoaderComplete} /> : null}
      <CustomCursor />
      <Nav />
      <Avatar />
      <div data-loaded={loaded ? "true" : "false"} className="content-veil">
        {children}
      </div>
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <PointerProvider>
      <ShellInner>{children}</ShellInner>
    </PointerProvider>
  );
}
