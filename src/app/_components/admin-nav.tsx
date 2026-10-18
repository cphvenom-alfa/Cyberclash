"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button"; // shadcn/ui

// Add a row here to put another page in the admin bar.
const ITEMS = [
	{ href: "/admin", label: "Competition control" },
	{ href: "/admin/questions", label: "Round 1 questions" },
	{ href: "/admin/ciphers", label: "Round 2 messages" },
	{ href: "/admin/casefile", label: "Round 3 case file" },
	{ href: "/admin/battle", label: "Battle control" },
];

export function AdminNav() {
	const path = usePathname();
	return (
		<nav
			aria-label="Admin"
			className="sticky top-0 z-30 border-white/5 border-b bg-[#050509]/80 backdrop-blur-md"
		>
			<div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-5 py-3">
				<span className="display mr-3 shrink-0 text-xl tracking-wide">
					ADMIN
				</span>
				{ITEMS.map((i) => {
					const active =
						i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
					return (
						<Button
							className="shrink-0"
							key={i.href}
							render={
								<Link
									aria-current={active ? "page" : undefined}
									href={i.href}
								/>
							}
							size="sm"
							variant={active ? "default" : "outline"}
						>
							{i.label}
						</Button>
					);
				})}
				<span className="flex-1" />
				<Button
					className="shrink-0"
					render={<Link href="/dashboard" />}
					size="sm"
					variant="ghost"
				>
					← Dashboard
				</Button>
			</div>
		</nav>
	);
}
