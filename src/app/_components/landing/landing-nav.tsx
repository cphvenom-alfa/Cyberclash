// File: src/app/_components/landing/landing-nav.tsx
"use client";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { id: "about", label: "About" },
  { id: "stages", label: "Stages" },
  { id: "challenges", label: "Challenges" },
];

export function LandingNav({ signedIn, ctaHref }: { signedIn: boolean; ctaHref: string }) {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: "-40% 0px -55% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050509]/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="display text-2xl tracking-wide">CYBER<span className="text-[var(--orange)]">/</span>CLASH</Link>
        <nav aria-label="Sections" className="hidden items-center gap-8 md:flex">
          {ITEMS.map((i) => (
            <a key={i.id} href={`#${i.id}`} className={`display relative py-1 text-lg transition-colors ${active === i.id ? "text-white" : "text-[var(--slate)] hover:text-white"}`}>
              {i.label}
              {active === i.id && <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[var(--cyan)]" />}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="display hidden text-base uppercase sm:inline-flex"><Link href={ctaHref}>{signedIn ? "Dashboard" : "Log in"}</Link></Button>
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open} className="grid h-10 w-10 place-items-center md:hidden">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile sections" className="flex flex-col gap-4 border-t border-white/5 px-5 py-5 md:hidden">
          {ITEMS.map((i) => <a key={i.id} href={`#${i.id}`} onClick={() => setOpen(false)} className="display text-2xl">{i.label}</a>)}
          <Link href={ctaHref} onClick={() => setOpen(false)} className="display text-2xl text-[var(--cyan)]">{signedIn ? "Dashboard" : "Log in"}</Link>
        </nav>
      )}
    </header>
  );
}
