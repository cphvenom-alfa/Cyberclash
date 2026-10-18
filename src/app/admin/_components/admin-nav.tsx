// File: src/app/admin/_components/admin-nav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button"; // shadcn/ui

// Add a row here to put another page in the admin bar.
const ITEMS = [
  { href: "/admin", label: "Competition control" },
  { href: "/admin/questions", label: "Round 1 questions" },
  { href: "/admin/ciphers", label: "Round 2 ciphers" },
  { href: "/admin/casefile", label: "Round 3 case file" },
  { href: "/admin/battle", label: "Battle control" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="sticky top-0 z-30 border-b border-white/5 bg-[#050509]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-5 py-3">
        <span className="display mr-3 shrink-0 text-xl tracking-wide">ADMIN</span>
        {ITEMS.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          return (
            <Button key={i.href} render={<Link href={i.href} aria-current={active ? "page" : undefined} />} size="sm" variant={active ? "default" : "outline"} className="shrink-0">
              {i.label}
            </Button>
          );
        })}
        <span className="flex-1" />
        <Button render={<Link href="/dashboard" />} size="sm" variant="ghost" className="shrink-0">← Dashboard</Button>
      </div>
    </nav>
  );
}
