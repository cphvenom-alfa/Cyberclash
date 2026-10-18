"use client";

import { useEffect, useRef } from "react";
import type { RoundInfo } from "@/app/_components/rounds";
import { SpotlightCard } from "@/app/_components/spotlight-card";

export function RoundDialog({
	round,
	status,
	onClose,
}: {
	round: RoundInfo | null;
	status: string;
	onClose: () => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		const previousOverflow = document.body.style.overflow;
		const handleClose = () => onClose();
		dialog.addEventListener("close", handleClose);
		if (round) {
			if (!dialog.open) dialog.showModal();
			document.body.style.overflow = "hidden";
			closeRef.current?.focus();
		} else if (dialog.open) {
			dialog.close();
		}
		return () => {
			dialog.removeEventListener("close", handleClose);
			document.body.style.overflow = previousOverflow;
		};
	}, [round, onClose]);

	return (
		<dialog
			aria-labelledby="round-dialog-title"
			className="round-dialog"
			ref={dialogRef}
		>
			{round && (
				<div className="round-dialog__frame">
					<SpotlightCard
						className="bg-[#0b0820]"
						innerClassName="max-h-[85vh] space-y-5 overflow-y-auto p-6"
						size={220}
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-[var(--cyan)] text-sm">
									Round {round.n} · {status}
								</p>
								<h2
									className="title-glow mt-1 font-black font-display text-2xl tracking-wide"
									id="round-dialog-title"
								>
									{round.title}
								</h2>
							</div>
							<button
								aria-label="Close briefing"
								className="p-1 text-white/60 transition hover:text-white"
								onClick={() => dialogRef.current?.close()}
								ref={closeRef}
								type="button"
							>
								<span aria-hidden="true" className="text-xl">
									×
								</span>
							</button>
						</div>
						<p className="text-[var(--ink)]">{round.summary}</p>
						<div>
							<h3 className="mb-2 font-display text-[var(--magenta)] text-sm">
								How it works
							</h3>
							<ol className="list-decimal space-y-1.5 pl-5 text-[var(--dim)] text-sm">
								{round.steps.map((step) => (
									<li key={step}>{step}</li>
								))}
							</ol>
						</div>
						<div>
							<h3 className="mb-2 font-display text-[var(--gold)] text-sm">
								Scoring
							</h3>
							<p className="text-[var(--dim)] text-sm">{round.scoring}</p>
						</div>
						<p className="border-[var(--cyan)] border-l-2 pl-3 text-[var(--ink)] text-sm">
							{round.tip}
						</p>
						<button
							className="btn-neon"
							onClick={() => dialogRef.current?.close()}
							type="button"
						>
							Got it
						</button>
					</SpotlightCard>
				</div>
			)}
		</dialog>
	);
}
