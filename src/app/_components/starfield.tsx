"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "01ABCDEF<>/{}#$%&*+=?ΔΣΩ";

type Star = { x: number; y: number; depth: number; phase: number };
type GlyphColumn = { x: number; y: number; speed: number; length: number };

/** Decorative, motion-aware canvas background for the competition screens. */
export function Starfield() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");
		if (!canvas || !context) return;

		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		let width = 0;
		let height = 0;
		let frame = 0;
		let previousTime = performance.now();
		let mouseX = 0;
		let mouseY = 0;
		let targetX = 0;
		let targetY = 0;
		let stars: Star[] = [];
		let columns: GlyphColumn[] = [];
		let shootingStar: {
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
		} | null = null;

		const resize = () => {
			const scale = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width * scale;
			canvas.height = height * scale;
			context.setTransform(scale, 0, 0, scale, 0, 0);
			stars = Array.from(
				{ length: Math.floor((width * height) / 6500) },
				() => ({
					x: Math.random() * width,
					y: Math.random() * height,
					depth: Math.random() * 0.9 + 0.1,
					phase: Math.random() * Math.PI * 2,
				}),
			);
			columns = Array.from({ length: Math.floor(width / 110) }, (_, i) => ({
				x: i * 110 + Math.random() * 70,
				y: Math.random() * height,
				speed: 18 + Math.random() * 30,
				length: 6 + Math.floor(Math.random() * 8),
			}));
		};
		const move = (event: PointerEvent) => {
			targetX = event.clientX / Math.max(width, 1) - 0.5;
			targetY = event.clientY / Math.max(height, 1) - 0.5;
		};

		const draw = (time: number) => {
			const delta = Math.min(0.05, (time - previousTime) / 1000);
			previousTime = time;
			mouseX += (targetX - mouseX) * 0.05;
			mouseY += (targetY - mouseY) * 0.05;
			context.clearRect(0, 0, width, height);
			for (const star of stars) {
				if (!reduceMotion) {
					star.y -= star.depth * 6 * delta;
					if (star.y < -2) {
						star.y = height + 2;
						star.x = Math.random() * width;
					}
				}
				const x = star.x - mouseX * 40 * star.depth;
				const y = star.y - mouseY * 40 * star.depth;
				const alpha = 0.35 + 0.65 * Math.abs(Math.sin(time / 900 + star.phase));
				context.fillStyle =
					star.depth > 0.75
						? `rgba(165,243,252,${alpha})`
						: `rgba(221,214,254,${alpha * star.depth + 0.15})`;
				context.fillRect(x, y, star.depth * 2, star.depth * 2);
			}

			context.font = "13px monospace";
			for (const column of columns) {
				if (!reduceMotion) {
					column.y += column.speed * delta;
					if (column.y - column.length * 16 > height) column.y = -20;
				}
				for (let i = 0; i < column.length; i++) {
					const glyph =
						GLYPHS[
							(i * 7 + Math.floor(time / 350) + Math.floor(column.x)) %
								GLYPHS.length
						] ?? "0";
					context.fillStyle = `rgba(34,211,238,${0.14 * (1 - i / column.length)})`;
					context.fillText(glyph, column.x, column.y - i * 16);
				}
			}

			if (!reduceMotion) {
				if (!shootingStar && Math.random() < delta / 9) {
					shootingStar = {
						x: Math.random() * width,
						y: Math.random() * height * 0.4,
						vx: 700,
						vy: 320,
						life: 1,
					};
				}
				if (shootingStar) {
					shootingStar.x += shootingStar.vx * delta;
					shootingStar.y += shootingStar.vy * delta;
					shootingStar.life -= delta * 1.4;
					const gradient = context.createLinearGradient(
						shootingStar.x,
						shootingStar.y,
						shootingStar.x - 120,
						shootingStar.y - 55,
					);
					gradient.addColorStop(0, `rgba(255,255,255,${shootingStar.life})`);
					gradient.addColorStop(1, "rgba(232,121,249,0)");
					context.strokeStyle = gradient;
					context.lineWidth = 2;
					context.beginPath();
					context.moveTo(shootingStar.x, shootingStar.y);
					context.lineTo(shootingStar.x - 120, shootingStar.y - 55);
					context.stroke();
					if (shootingStar.life <= 0) shootingStar = null;
				}
				frame = window.requestAnimationFrame(draw);
			}
		};

		const handleResize = () => {
			resize();
			if (reduceMotion) {
				window.cancelAnimationFrame(frame);
				frame = window.requestAnimationFrame(draw);
			}
		};
		handleResize();
		if (!reduceMotion) frame = window.requestAnimationFrame(draw);
		window.addEventListener("resize", handleResize);
		window.addEventListener("pointermove", move);
		return () => {
			window.cancelAnimationFrame(frame);
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("pointermove", move);
		};
	}, []);

	return (
		<>
			<div aria-hidden="true" className="nebula" />
			<div
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 -z-10"
			>
				<canvas className="h-full w-full" ref={canvasRef} />
			</div>
		</>
	);
}
