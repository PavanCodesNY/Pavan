export type SpringConfig = { stiffness: number; damping: number };

export const SPRINGS = {
  cursor: { stiffness: 0.14, damping: 0.78 },
  magnetic: { stiffness: 0.2, damping: 0.74 },
  softReturn: { stiffness: 0.1, damping: 0.86 },
} as const satisfies Record<string, SpringConfig>;

export function springStep(
  cur: number,
  target: number,
  vel: number,
  { stiffness, damping }: SpringConfig,
): [number, number] {
  const force = (target - cur) * stiffness;
  const nextVel = (vel + force) * damping;
  return [cur + nextVel, nextVel];
}
