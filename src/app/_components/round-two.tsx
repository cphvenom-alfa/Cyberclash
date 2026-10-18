"use client";

import { useState } from "react";
import { AnimatedNumber } from "@/app/_components/hud";
import { api } from "@/trpc/react";

const hintTiers = [
	{ tier: 1 as const, label: "Cipher type", cost: 2 },
	{ tier: 2 as const, label: "Decoding method", cost: 4 },
	{ tier: 3 as const, label: "Partial message", cost: 6 },
];

export function RoundTwo() {
	const utils = api.useUtils();
	const messages = api.cyber.round2.loadEncryptedMessages.useQuery();
	const balance = api.cyber.round1.calculatePointCurrency.useQuery();
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [results, setResults] = useState<Record<string, boolean | undefined>>(
		{},
	);
	const buy = api.cyber.round2.purchaseHint.useMutation({
		onSuccess: async () => {
			await utils.cyber.round1.calculatePointCurrency.invalidate();
			await utils.cyber.round2.loadEncryptedMessages.invalidate();
		},
	});
	const decrypt = api.cyber.round2.submitDecryptedMessage.useMutation({
		onSuccess: (result, variables) =>
			setResults((previous) => ({
				...previous,
				[variables.messageId]: result.correct,
			})),
	});
	const points = balance.data?.points ?? 0;

	return (
		<div className="space-y-5 text-[var(--ink)]">
			<header className="hud sticky top-3 z-10 flex items-center justify-between gap-4 p-5">
				<div>
					<p className="font-mono text-[var(--cyan)] text-xs tracking-widest">
						COMPETITION · ROUND 02
					</p>
					<h1 className="title-glow mt-1 font-black font-display text-2xl">
						Encrypted Access
					</h1>
					<p className="mt-1 text-[var(--dim)] text-sm">
						Decode messages. Hints cost points; unspent points count toward your
						score.
					</p>
				</div>
				<div className="shrink-0 text-right">
					<p className="text-[var(--dim)] text-xs">Balance</p>
					<p className="font-display text-3xl text-[var(--gold)]">
						<AnimatedNumber value={points} />
					</p>
				</div>
			</header>
			{messages.data?.map((message, index) => {
				const solved = message.solved || results[message.id] === true;
				return (
					<article
						className={`hud space-y-4 p-5 ${solved ? "hud-win" : ""}`}
						key={message.id}
					>
						<div className="flex items-center justify-between gap-3">
							<span className="font-display text-[var(--cyan)]">
								MESSAGE {String(index + 1).padStart(2, "0")}
							</span>
							<span className="text-right text-[var(--dim)] text-sm">
								Cipher:{" "}
								<b className="text-[var(--magenta)]">
									{message.cipherType ?? "unknown"}
								</b>
							</span>
						</div>
						<pre className="overflow-x-auto whitespace-pre-wrap break-words border border-[var(--cyan)]/30 bg-black/60 p-4 font-mono text-[var(--cyan)] shadow-[0_0_24px_rgba(34,211,238,.15)]">
							{message.encrypted}
						</pre>
						<div>
							<p className="mb-2 text-[var(--dim)] text-sm">Hint market</p>
							<div className="grid gap-2 sm:grid-cols-3">
								{hintTiers.map(({ tier, label, cost }) => {
									const purchased = message.purchasedHints.find(
										(hint) => hint.tier === tier,
									);
									const owned = message.boughtTiers.includes(tier);
									return (
										<button
											className={`border p-3 text-left text-sm transition ${owned ? "border-[var(--violet)] bg-[var(--violet)]/15" : "border-[var(--gold)]/50 hover:bg-[var(--gold)]/10"}`}
											disabled={owned || buy.isPending || points < cost}
											key={tier}
											onClick={() =>
												buy.mutate({ messageId: message.id, tier })
											}
											type="button"
										>
											<span className="block">{label}</span>
											{purchased ? (
												<span className="mt-1 block text-[var(--magenta)]">
													{purchased.hint}
												</span>
											) : (
												<span className="font-display text-[var(--gold)]">
													{cost} points
												</span>
											)}
										</button>
									);
								})}
							</div>
						</div>
						<form
							className="flex flex-col gap-3 sm:flex-row"
							onSubmit={(event) => {
								event.preventDefault();
								decrypt.mutate({
									messageId: message.id,
									decodedString: answers[message.id] ?? "",
								});
							}}
						>
							<input
								className="input-neon min-w-0 flex-1 font-mono"
								disabled={solved}
								onChange={(event) =>
									setAnswers((previous) => ({
										...previous,
										[message.id]: event.target.value,
									}))
								}
								placeholder="Decoded message"
								value={answers[message.id] ?? ""}
							/>
							<button
								className="btn-neon shrink-0"
								disabled={
									solved || !answers[message.id]?.trim() || decrypt.isPending
								}
								type="submit"
							>
								Decrypt
							</button>
						</form>
						{solved && (
							<p className="stamp inline-block border border-emerald-400 px-2 py-0.5 font-display text-emerald-300">
								DECRYPTED
							</p>
						)}
						{results[message.id] === false && (
							<p className="shake text-rose-400" role="status">
								Incorrect answer. Check the cipher and try again.
							</p>
						)}
					</article>
				);
			})}
			{(decrypt.error || buy.error) && (
				<p className="hud p-3 text-rose-400" role="alert">
					{decrypt.error?.message ?? buy.error?.message}
				</p>
			)}
		</div>
	);
}
