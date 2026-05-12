import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Avatar } from "./Avatar";
import { ChatBar } from "./ChatBar";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <Avatar />
      <ChatBar visible />
      <div className="content-veil" data-loaded="true">
        {children}
      </div>
    </>
  );
}
