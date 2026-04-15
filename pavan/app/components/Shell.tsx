"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PointerProvider } from "./PointerProvider";
import { HersheyLoader } from "./HersheyLoader";
import { CustomCursor } from "./CustomCursor";
import { Nav } from "./Nav";
import { Avatar } from "./Avatar";
import { ChatBar } from "./ChatBar";
// import { ArrowGuide } from "./ArrowGuide";

type InnerProps = {
  children: ReactNode;
};

function ShellInner({ children }: InnerProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Lazy init based on pathname alone — deterministic on server and client.
  // The loader plays on every reload of the home route. Client-side navigation
  // between Home ↔ Playground keeps the same state (loaded persists once true),
  // so the loader doesn't replay within a single SPA session, only on reload.
  const [loaded, setLoaded] = useState(() => !isHome);

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

  const onLoaderComplete = () => setLoaded(true);

  return (
    <>
      {!loaded && isHome ? <HersheyLoader onComplete={onLoaderComplete} /> : null}
      <CustomCursor />
      <Nav />
      <Avatar />
      <ChatBar visible={loaded} />
      {/* {loaded && <ArrowGuide />} */}
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
