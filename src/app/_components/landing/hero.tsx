// File: src/app/_components/landing/hero.tsx
"use client";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { CityArt } from "@/app/_components/city-art";
import { Button } from "@/components/ui/button";
import { enter } from "./motion";

const LINES = ["ENTER THE", "CYBER", "WARZONE."];
export const ctaClass = "display h-12 bg-[#FF5722] px-8 text-lg uppercase tracking-wide text-[#0B0D14] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#ff7140] active:translate-y-0 active:scale-[0.98]";

export function Hero({ href }: { href: string }) {
  const reduce = !!useReducedMotion();
  return (
    <section className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-12">
      <div className="space-y-7 lg:col-span-6">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={enter(0, reduce)} className="text-sm tracking-[0.2em] text-[var(--cyan)]">{"// CYBERSECURITY TOURNAMENT"}</motion.p>
        <h1 aria-label="Enter the Cyber Warzone" className="display text-[4.5rem] sm:text-8xl xl:text-9xl">
          {LINES.map((l, i) => (
            <span key={l} className="block overflow-hidden pb-1">
              <motion.span aria-hidden className="block" initial={reduce ? false : { y: "110%" }} animate={{ y: 0 }} transition={enter(0.1 + i * 0.12, reduce)}>{l}</motion.span>
            </span>
          ))}
        </h1>
        <motion.p initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={enter(0.55, reduce)} className="max-w-md text-lg text-[var(--slate)]">
          Decode the unknown. Outsmart the system. Compete against the clock. Enter Cyber Clash and test your skills in a battlefield of logic, puzzles, and cybersecurity challenges.
        </motion.p>
        <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={enter(0.7, reduce)} className="flex flex-wrap gap-3">
          <Button asChild className={ctaClass}><Link href={href}>Enter the arena</Link></Button>
          <Button asChild variant="outline" className="display h-12 px-8 text-lg uppercase tracking-wide"><a href="#stages">Explore missions</a></Button>
        </motion.div>
      </div>

      <motion.div initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={enter(0.35, reduce)} className="lg:col-span-6">
        <div className="frame"><div className="frame-in relative aspect-[4/3] overflow-hidden">
          <CityArt />
          <div className="sweep pointer-events-none absolute inset-0" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#050509]/80 to-transparent" aria-hidden />
          <span className="display absolute bottom-4 left-4 text-sm tracking-[0.3em] text-white/70">NEON VOID</span>
        </div></div>
      </motion.div>
    </section>
  );
}

export function TertiaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group display inline-flex items-center gap-2 text-lg text-[var(--cyan)] transition-colors hover:text-white">
      {children}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
