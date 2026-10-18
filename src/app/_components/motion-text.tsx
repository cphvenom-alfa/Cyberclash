"use client";

import { useEffect, useRef } from "react";

export function StaggerText({
	text,
	className = "",
	delay = 0,
}: {
	text: string;
	className?: string;
	delay?: number;
}) {
	return (
		<h1 aria-label={text} className={className}>
			{text.split(" ").map((word, index) => (
				<span
					aria-hidden="true"
					className="stagger-word"
					key={`${word}-${index}`}
					style={{ animationDelay: `${delay + index * 80}ms` }}
				>
					{word}
				</span>
			))}
		</h1>
	);
}

export function Reveal({
	children,
	delay = 0,
	className = "",
}: {
	children: React.ReactNode;
	delay?: number;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		if (
			window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
			!("IntersectionObserver" in window)
		) {
			element.dataset.visible = "true";
			return;
		}

		element.dataset.revealReady = "true";
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				element.dataset.visible = "true";
				observer.disconnect();
			},
			{ rootMargin: "-40px", threshold: 0.01 },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			className={`scroll-reveal ${className}`}
			data-reveal-ready="false"
			data-visible="false"
			ref={ref}
			style={{ transitionDelay: `${delay}ms` }}
		>
			{children}
		</div>
	);
}
