// File: src/app/_components/motion-text.tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

/** Staggered word reveal. Plays once on mount. */
export function StaggerText({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <h1 className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="mr-[.25em] inline-block overflow-hidden pb-1 align-bottom">
          <motion.span aria-hidden className="inline-block" initial={reduce ? false : { y: "110%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: delay + i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}>{w}</motion.span>
        </span>
      ))}
    </h1>
  );
}

/** Fade/slide up when scrolled into view (once). */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}
