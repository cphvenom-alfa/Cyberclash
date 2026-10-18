"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/trpc/react";

export function TeamSetup() {
	const router = useRouter();
	const [name, setName] = useState("");
	const register = api.cyber.team.register.useMutation({
		onSuccess: () => router.refresh(),
	});
	return (
		<section className="mt-8 max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
			<h2 className="font-bold text-xl">Finish team setup</h2>
			<p className="mt-2 text-slate-400">
				Your account is signed in. Choose the name your team will use in the
				event.
			</p>
			<form
				className="mt-5 flex gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					register.mutate({ name });
				}}
			>
				<input
					className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2"
					maxLength={80}
					minLength={2}
					onChange={(event) => setName(event.target.value)}
					placeholder="Team name"
					required
					value={name}
				/>
				<button
					className="rounded-lg bg-cyan-300 px-4 py-2 font-bold text-slate-950"
					disabled={register.isPending}
					type="submit"
				>
					Create team
				</button>
			</form>
			{register.error && (
				<p className="mt-3 text-rose-300" role="alert">
					{register.error.message}
				</p>
			)}
		</section>
	);
}
