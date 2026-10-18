// File: src/app/layout.tsx
import "@/styles/globals.css";
import "@/styles/cyber.css";

import { type Metadata } from "next";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import { GalaxyBackground } from "@/app/_components/galaxy-background";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "Cyber Clash",
  description: "Crack the code. Beat the clock.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const display = Barlow_Condensed({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <GalaxyBackground />
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
