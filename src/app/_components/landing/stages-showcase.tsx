// File: src/app/_components/landing/stages-showcase.tsx
"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Lit } from "@/app/_components/lit";
import { RoundArt } from "@/app/_components/round-art";
import { ROUNDS } from "@/app/_components/rounds";
import { EASE } from "./motion";
import { TertiaryLink } from "./hero";

/** Selecting a stage card updates the featured panel. All content comes from rounds.ts. */
export function StagesShowcase({ href }: { href: string }) {
  const reduce = !!useReducedMotion();
  const [active, setActive] = useState<1 | 2 | 3 | 4>(1);
  const stage = ROUNDS[active - 1]!;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = ((active - 1 + (e.key === "ArrowRight" ? 1 : 3)) % 4) + 1;
    setActive(next as 1 | 2 | 3 | 4);
    document.getElementById(`stage-tab-${next}`)?.focus();
  };

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Tournament stages" onKeyDown={onKey} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ROUNDS.map((r) => (
          <Lit key={r.n} className={`panel transition-opacity ${active === r.n ? "" : "opacity-70 hover:opacity-100"}`}>
            <button role="tab" id={`stage-tab-${r.n}`} aria-selected={active === r.n} aria-controls="stage-panel" tabIndex={active === r.n ? 0 : -1} onClick={() => setActive(r.n)} className="group block w-full text-left">
              <div className="relative aspect-[16/10] overflow-hidden">
                <div className="h-full w-full transition-transform duration-500 group-hover:scale-105"><RoundArt n={r.n} /></div>
                <span className="tab-label display absolute bottom-0 left-4 px-5 py-0.5 text-sm">Stage {r.n}</span>
                {active === r.n && <motion.span layoutId="stage-indicator" className="absolute inset-x-0 top-0 h-0.5 bg-[var(--cyan)]" />}
              </div>
              <p className="display p-4 text-xl sm:text-2xl">{r.title}</p>
            </button>
          </Lit>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={active} id="stage-panel" role="tabpanel" aria-labelledby={`stage-tab-${active}`}
          initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
          <Lit className="panel grid md:grid-cols-5">
            <div className="relative aspect-[16/10] md:col-span-2 md:aspect-auto"><div className="absolute inset-0"><RoundArt n={stage.n} /></div></div>
            <div className="space-y-4 p-7 md:col-span-3">
              <p className="text-xs uppercase tracking-widest text-[var(--cyan)]">Stage {stage.n} of 4</p>
              <h3 className="display text-4xl sm:text-5xl">{stage.title}</h3>
              <p className="text-[var(--slate)]">{stage.summary}</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--slate)]">{stage.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              <TertiaryLink href={href}>Join the clash</TertiaryLink>
            </div>
          </Lit>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
