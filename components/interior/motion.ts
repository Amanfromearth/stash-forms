// Interior's spring timings, shared by the adapted controls.
export const PRESS = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.45,
} as const
export const CROSSFADE = {
  type: "spring",
  stiffness: 260,
  damping: 34,
  mass: 0.8,
} as const
export const FILL = {
  type: "spring",
  stiffness: 210,
  damping: 34,
  mass: 0.9,
} as const
export const INSTANT = { duration: 0 } as const
