// File: src/app/_components/landing/city-showcase.tsx
"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { CityArt } from "@/app/_components/city-art";

/** Wide cinematic panel. The artwork drifts a few percent as you scroll past (restrained parallax). */
export function CityShowcase() {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  return (
    <div ref={ref} className="relative isolate aspect-[4/3] overflow-hidden border border-white/10 sm:aspect-[21/9]">
      <motion.div style={reduce ? undefined : { y }} className="absolute -inset-y-[8%] inset-x-0"><CityArt /></motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#050509]/90 via-[#050509]/40 to-transparent" aria-hidden />
      <div className="relative flex h-full max-w-lg flex-col justify-end gap-3 p-6 sm:p-10">
        <h2 className="display text-4xl sm:text-6xl">A battlefield of logic.</h2>
        <p className="text-[var(--slate)]">Puzzles, ciphers, a digital crime scene and a live decryption duel, all inside one neon-lit city.</p>
      </div>
    </div>
  );
}
