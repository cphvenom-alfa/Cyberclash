"use client";

import { useEffect, useRef } from "react";

export function CursorLight() {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (
			window.matchMedia("(pointer: coarse)").matches ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		)
			return;
		const element = ref.current;
		if (!element) return;

		let targetX = window.innerWidth / 2;
		let targetY = window.innerHeight / 3;
		let x = targetX;
		let y = targetY;
		let frame = 0;
		const tick = () => {
			x += (targetX - x) * 0.12;
			y += (targetY - y) * 0.12;
			element.style.setProperty("--mx", `${x}px`);
			element.style.setProperty("--my", `${y}px`);
			frame =
				Math.abs(targetX - x) + Math.abs(targetY - y) > 0.5
					? window.requestAnimationFrame(tick)
					: 0;
		};
		const move = (event: PointerEvent) => {
			targetX = event.clientX;
			targetY = event.clientY;
			if (!frame) frame = window.requestAnimationFrame(tick);
		};
		window.addEventListener("pointermove", move, { passive: true });
		element.style.opacity = "1";
		return () => {
			window.removeEventListener("pointermove", move);
			window.cancelAnimationFrame(frame);
		};
	}, []);
	return <div aria-hidden="true" className="cursor-light" ref={ref} />;
}
