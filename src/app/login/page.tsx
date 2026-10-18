"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DecryptText } from "@/app/_components/hud";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";

export default function LoginPage() {
	const router = useRouter();
	const utils = api.useUtils();
	const registerTeam = api.cyber.team.register.useMutation();
	const [mode, setMode] = useState<"register" | "login">("register");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	async function signInWithGitHub() {
		setError("");
		setBusy(true);
		const result = await authClient.signIn.social({
			provider: "github",
			callbackURL: "/dashboard",
		});
		if (result.error) {
			setError(result.error.message ?? "GitHub sign in failed");
			setBusy(false);
		}
	}
	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setBusy(true);
		try {
			if (mode === "register") {
				const result = await authClient.signUp.email({ name, email, password });
				if (result.error)
					throw new Error(result.error.message ?? "Registration failed");
				await registerTeam.mutateAsync({ name: name.trim() });
			} else {
				const result = await authClient.signIn.email({ email, password });
				if (result.error)
					throw new Error(result.error.message ?? "Sign in failed");
			}
			await utils.invalidate();
			router.push("/dashboard");
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unable to continue");
		} finally {
			setBusy(false);
		}
	}
	return (
		<main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-[var(--ink)]">
			<header className="mb-8 text-center">
				<h1 className="title-glow font-black font-display text-4xl tracking-widest sm:text-5xl">
					<DecryptText text="CYBER CLASH" />
				</h1>
				<p className="mt-3 text-[var(--dim)] text-sm">
					Crack the code. Beat the clock.
				</p>
			</header>
			<Link className="mb-8 text-cyan-300 text-sm" href="/">
				← Cyber Clash
			</Link>
			<p className="font-bold text-cyan-300 text-xs uppercase tracking-[.3em]">
				Team access
			</p>
			<h1 className="mt-3 font-black text-4xl">
				{mode === "register" ? "Register your team" : "Welcome back"}
			</h1>
			<p className="mt-2 text-slate-400">
				{mode === "register"
					? "Create a team login to enter the competition."
					: "Sign in to continue your challenge."}
			</p>
			<form className="hud mt-8 space-y-4 p-6" onSubmit={submit}>
				{mode === "register" && (
					<label className="block text-sm">
						Team name
						<input
							className="input-neon mt-2"
							maxLength={80}
							minLength={2}
							onChange={(e) => setName(e.target.value)}
							required
							value={name}
						/>
					</label>
				)}
				<label className="block text-sm">
					Email
					<input
						className="input-neon mt-2"
						onChange={(e) => setEmail(e.target.value)}
						required
						type="email"
						value={email}
					/>
				</label>
				<label className="block text-sm">
					Password
					<input
						className="input-neon mt-2"
						minLength={8}
						onChange={(e) => setPassword(e.target.value)}
						required
						type="password"
						value={password}
					/>
				</label>
				{error && (
					<p className="text-rose-300 text-sm" role="alert">
						{error}
					</p>
				)}
				<button className="btn-neon w-full" disabled={busy} type="submit">
					{busy
						? "Please wait…"
						: mode === "register"
							? "Create team"
							: "Sign in"}
				</button>
			</form>
			<button
				className="mt-3 w-full border border-white/15 px-4 py-3 font-semibold"
				disabled={busy}
				onClick={signInWithGitHub}
				type="button"
			>
				Continue with GitHub
			</button>
			<button
				className="mt-5 text-slate-400 text-sm"
				onClick={() => setMode(mode === "register" ? "login" : "register")}
				type="button"
			>
				{mode === "register"
					? "Already registered? Sign in"
					: "New team? Register"}
			</button>
		</main>
	);
}
