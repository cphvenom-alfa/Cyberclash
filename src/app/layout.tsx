import "@/styles/globals.css";
import "@/styles/cyber.css";

import type { Metadata } from "next";

import { Starfield } from "@/app/_components/starfield";
import { TRPCReactProvider } from "@/trpc/react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
	title: "Cyber Clash",
	description: "A team-based cybersecurity challenge",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={cn("font-sans", geist.variable)}>
			<body>
				<Starfield />
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}
