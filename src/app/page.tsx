// File: src/app/page.tsx
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CityArt } from "@/app/_components/city-art";
import { Reveal } from "@/app/_components/motion-text";
import { CityShowcase } from "@/app/_components/landing/city-showcase";
import { Hero, ctaClass } from "@/app/_components/landing/hero";
import { LandingNav } from "@/app/_components/landing/landing-nav";
import { StagesShowcase } from "@/app/_components/landing/stages-showcase";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/better-auth/server";

const FACTS = [["4", "stages"], ["4", "finalists"], ["1", "champion"]] as const;
const CHALLENGES = [
  { t: "Logic and puzzles", d: "Riddles, observation puzzles and reasoning questions against a global countdown." },
  { t: "Cryptography", d: "Decode encrypted messages, or spend points on hints when the cipher wins." },
  { t: "Digital forensics", d: "Read emails, chat logs and access records to find the cybercriminal." },
  { t: "Head-to-head duels", d: "Encrypt a message for your rival, then race them to decrypt yours." },
];

export default async function Landing() {
  const session = await getSession().catch(() => null);
  const signedIn = !!session;
  const href = signedIn ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen">
      <LandingNav signedIn={signedIn} ctaHref={href} />
      <main>
        <Hero href={href} />

        <section id="about" className="mx-auto grid max-w-6xl gap-10 px-5 py-24 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 className="display text-5xl sm:text-7xl">Think like a hacker.<br /><span className="text-[var(--slate)]">Compete like a champion.</span></h2>
          </Reveal>
          <Reveal delay={0.1} className="space-y-8 lg:col-span-5">
            <p className="text-lg text-[var(--slate)]">Cyber Clash is a four-stage cybersecurity tournament. Teams solve puzzles, decrypt messages, investigate a digital crime and finish in a head-to-head cipher duel.</p>
            <dl className="grid grid-cols-3 divide-x divide-white/10 border-y border-white/10">
              {FACTS.map(([n, l]) => <div key={l} className="px-4 py-5 first:pl-0"><dt className="sr-only">{l}</dt><dd><span className="display block text-5xl text-[var(--cyan)]">{n}</span><span className="text-sm text-[var(--slate)]">{l}</span></dd></div>)}
            </dl>
          </Reveal>
        </section>

        <section id="stages" className="mx-auto max-w-6xl space-y-8 px-5 pb-24">
          <Reveal><h2 className="display text-5xl sm:text-6xl">Tournament stages</h2></Reveal>
          <Reveal delay={0.05}><StagesShowcase href={href} /></Reveal>
        </section>

        <section id="city" className="mx-auto max-w-6xl px-5 pb-24"><Reveal><CityShowcase /></Reveal></section>

        <section id="challenges" className="mx-auto max-w-6xl px-5 pb-24">
          <Reveal><h2 className="display mb-10 text-5xl sm:text-6xl">What you will face</h2></Reveal>
          <ul className="grid gap-x-12 md:grid-cols-2">
            {CHALLENGES.map((c, i) => (
              <Reveal key={c.t} delay={i * 0.06}>
                <li className="group flex gap-5 border-t border-white/10 py-7">
                  <span className="display text-4xl text-white/25 transition-colors group-hover:text-[var(--cyan)]">0{i + 1}</span>
                  <div className="space-y-2"><h3 className="display text-3xl">{c.t}</h3><p className="text-[var(--slate)]">{c.d}</p></div>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <Reveal>
            <div className="panel relative isolate overflow-hidden p-8 sm:p-14">
              <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 opacity-40 [mask-image:linear-gradient(to_left,#000,transparent)] md:block" aria-hidden><CityArt /></div>
              <h2 className="display max-w-xl text-6xl sm:text-8xl">Ready to break the code?</h2>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild className={ctaClass}><Link href={href}>Enter the arena</Link></Button>
                <a href="#stages" className="group display inline-flex items-center gap-2 text-lg text-[var(--cyan)] hover:text-white">See the stages <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center">
          <p className="display text-2xl">CYBER<span className="text-[var(--orange)]">/</span>CLASH</p>
          <nav aria-label="Footer" className="flex gap-6 text-sm text-[var(--slate)]">
            <a href="#about" className="hover:text-white">About</a>
            <a href="#stages" className="hover:text-white">Stages</a>
            <a href="#challenges" className="hover:text-white">Challenges</a>
            <Link href={href} className="hover:text-white">{signedIn ? "Dashboard" : "Log in"}</Link>
          </nav>
          <p className="text-sm text-[var(--slate)]">© {new Date().getFullYear()} Cyber Clash</p>
        </div>
      </footer>
    </div>
  );
}
