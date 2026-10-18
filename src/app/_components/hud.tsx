"use client";

import { useEffect, useRef, useState } from "react";

const SCRAMBLE_POOL = "01ABCDEF#$%&*<>/{}=+?";

export function DecryptText({
	text,
	className = "",
}: {
	text: string;
	className?: string;
}) {
	const [output, setOutput] = useState(text);
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setOutput(text);
			return;
		}
		let frame = 0;
		const interval = window.setInterval(() => {
			frame++;
			const settled = Math.max(0, Math.floor((frame - 6) / 3));
			setOutput(
				[...text]
					.map((character, index) =>
						character === " " || index < settled
							? character
							: (SCRAMBLE_POOL[
									Math.floor(Math.random() * SCRAMBLE_POOL.length)
								] ?? character),
					)
					.join(""),
			);
			if (settled >= text.length) {
				window.clearInterval(interval);
				setOutput(text);
			}
		}, 45);
		return () => window.clearInterval(interval);
	}, [text]);
	return (
		<span aria-label={text} className={className} role="img">
			{output}
		</span>
	);
}

export function AnimatedNumber({ value }: { value: number }) {
	const [displayValue, setDisplayValue] = useState(value);
	const currentValue = useRef(value);
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			currentValue.current = value;
			setDisplayValue(value);
			return;
		}
		const from = currentValue.current;
		const startedAt = performance.now();
		let frame = 0;
		const animate = (now: number) => {
			const progress = Math.min(1, (now - startedAt) / 600);
			const nextValue = Math.round(
				from + (value - from) * (1 - (1 - progress) ** 3),
			);
			currentValue.current = nextValue;
			setDisplayValue(nextValue);
			if (progress < 1) frame = window.requestAnimationFrame(animate);
		};
		frame = window.requestAnimationFrame(animate);
		return () => window.cancelAnimationFrame(frame);
	}, [value]);
	return <>{displayValue}</>;
}

const STAGES = ["Activation", "Cipher market", "Blackbox", "Battle"];

export function RoundTrack({ current }: { current: number }) {
	return (
		<ol aria-label="Competition progress" className="flex items-start">
			{STAGES.map((stage, index) => {
				const number = index + 1;
				const done = number < current;
				const active = number === current;
				return (
					<li className="flex flex-1 items-start last:flex-none" key={stage}>
						<div className="flex w-16 flex-col items-center gap-1.5">
							<span
								aria-current={active ? "step" : undefined}
								className={`grid h-9 w-9 place-items-center rounded-full border font-display text-sm ${active ? "node-active border-[var(--cyan)] text-[var(--cyan)]" : done ? "border-[var(--violet)] bg-[var(--violet)]/30 text-white" : "border-white/15 text-white/30"}`}
							>
								{done ? "✓" : number}
							</span>
							<span
								className={`text-center text-[11px] leading-tight ${active ? "text-white" : "text-white/40"}`}
							>
								{stage}
							</span>
						</div>
						{number < STAGES.length && (
							<span
								aria-hidden="true"
								className={`mt-[18px] h-px flex-1 ${done ? "bg-[var(--violet)]" : "bg-white/10"}`}
							/>
						)}
					</li>
				);
			})}
		</ol>
	);
}
