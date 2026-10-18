"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(endsAt?: Date | null, serverNow?: Date) {
	const skew = serverNow ? serverNow.getTime() - Date.now() : 0;
	const calculate = useCallback(
		() =>
			endsAt
				? Math.max(
						0,
						Math.ceil((endsAt.getTime() - (Date.now() + skew)) / 1000),
					)
				: null,
		[endsAt, skew],
	);
	const [seconds, setSeconds] = useState<number | null>(calculate);
	useEffect(() => {
		setSeconds(calculate());
		const timer = window.setInterval(() => setSeconds(calculate()), 250);
		return () => window.clearInterval(timer);
	}, [calculate]);
	return seconds;
}

export function Countdown({
	endsAt,
	serverNow,
	big = false,
	className,
}: {
	endsAt?: Date | null;
	serverNow?: Date;
	big?: boolean;
	className?: string;
}) {
	const seconds = useCountdown(endsAt, serverNow);
	if (seconds === null)
		return (
			<span className={`${className ?? ""} font-mono text-slate-500`}>
				--:--
			</span>
		);
	const color =
		seconds <= 10 ? "animate-pulse text-rose-400" : "text-emerald-300";
	const size = big ? "text-[16vw] leading-none" : "text-3xl";
	return (
		<span
			className={`${className ?? ""} font-mono tabular-nums ${size} ${color}`}
		>
			{String(Math.floor(seconds / 60)).padStart(2, "0")}:
			{String(seconds % 60).padStart(2, "0")}
		</span>
	);
}

export function RingTimer({
	endsAt,
	serverNow,
}: {
	endsAt?: Date | null;
	serverNow?: Date;
}) {
	const seconds = useCountdown(endsAt, serverNow);
	const maxSeconds = useRef(1);
	const endTime = endsAt?.getTime();
	const previousEndTime = useRef(endTime);
	if (previousEndTime.current !== endTime) {
		maxSeconds.current = 1;
		previousEndTime.current = endTime;
	}
	if (seconds !== null && seconds > maxSeconds.current)
		maxSeconds.current = seconds;
	const radius = 54;
	const circumference = 2 * Math.PI * radius;
	const fraction = seconds === null ? 0 : seconds / maxSeconds.current;
	const danger = seconds !== null && seconds <= 10;
	const warning = seconds !== null && seconds <= 30;
	const color = danger ? "#f43f5e" : warning ? "#fbbf24" : "#22d3ee";
	const display = seconds ?? 0;
	return (
		<div
			aria-label={
				seconds === null
					? "Timer not started"
					: `${Math.floor(display / 60)} minutes ${display % 60} seconds remaining`
			}
			className={`relative h-28 w-28 shrink-0 ${danger ? "ring-danger" : ""}`}
			role="timer"
		>
			<svg
				aria-hidden="true"
				className="h-full w-full -rotate-90"
				viewBox="0 0 120 120"
			>
				<circle
					cx="60"
					cy="60"
					fill="none"
					r="54"
					stroke="rgb(255 255 255 / 8%)"
					strokeWidth="6"
				/>
				<circle
					cx="60"
					cy="60"
					fill="none"
					r={radius}
					stroke={color}
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - fraction)}
					strokeLinecap="round"
					strokeWidth="6"
					style={{
						transition: "stroke-dashoffset 300ms linear, stroke 300ms",
					}}
				/>
			</svg>
			<span
				aria-hidden="true"
				className="absolute inset-0 grid place-items-center font-display text-xl tabular-nums"
				style={{ color }}
			>
				{seconds === null
					? "--:--"
					: `${String(Math.floor(display / 60)).padStart(2, "0")}:${String(display % 60).padStart(2, "0")}`}
			</span>
		</div>
	);
}
