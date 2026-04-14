"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

type TickCb = (p: PointerState) => void;

type PointerAPI = {
  pointerRef: React.MutableRefObject<PointerState>;
  registerTick: (cb: TickCb) => () => void;
};

const PointerCtx = createContext<PointerAPI | null>(null);

export function usePointer(): PointerAPI {
  const ctx = useContext(PointerCtx);
  if (!ctx) throw new Error("usePointer must be used inside <PointerProvider>");
  return ctx;
}

export function PointerProvider({ children }: { children: ReactNode }) {
  const pointerRef = useRef<PointerState>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const subsRef = useRef<Set<TickCb>>(new Set());
  const rafRef = useRef<number | null>(null);

  const registerTick = useCallback((cb: TickCb) => {
    subsRef.current.add(cb);
    return () => {
      subsRef.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.active = true;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    const onEnter = () => {
      pointerRef.current.active = true;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    const loop = () => {
      const p = pointerRef.current;
      for (const cb of subsRef.current) cb(p);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const api = useMemo<PointerAPI>(
    () => ({ pointerRef, registerTick }),
    [registerTick],
  );

  return <PointerCtx.Provider value={api}>{children}</PointerCtx.Provider>;
}
