"use client";

import { useEffect, type ReactNode } from "react";
import { PointerProvider } from "./PointerProvider";
import { CustomCursor } from "./CustomCursor";
import { Nav } from "./Nav";
import { Avatar } from "./Avatar";
import { ChatBar } from "./ChatBar";

type InnerProps = {
  children: ReactNode;
};

function ShellInner({ children }: InnerProps) {
  useEffect(() => {
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
  }, []);

  return (
    <>
      <CustomCursor />
      <Nav />
      <Avatar />
      <ChatBar visible />
      <div data-loaded="true" className="content-veil">
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
