// File: src/app/_components/landing/motion.ts
// One easing curve and one timing scale for the whole landing page.
export const EASE = [0.2, 0.7, 0.2, 1] as const;
export const enter = (delay = 0, reduce = false) => (reduce ? { duration: 0 } : { duration: 0.6, delay, ease: EASE });
