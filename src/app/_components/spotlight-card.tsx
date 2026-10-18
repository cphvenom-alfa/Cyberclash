"use client";

import { useState } from "react";

export function SpotlightCard({
	children,
	className = "",
	innerClassName = "",
	size = 180,
}: {
	children: React.ReactNode;
	className?: string;
	innerClassName?: string;
	size?: number;
}) {
	const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
	return (
		<div
			className={`hud spotlight-card ${className}`}
			onPointerLeave={() => setPoint(null)}
			onPointerMove={(event) => {
				const rect = event.currentTarget.getBoundingClientRect();
				setPoint({ x: event.clientX - rect.left, y: event.clientY - rect.top });
			}}
		>
			{point && (
				<div
					aria-hidden="true"
					className="spotlight-card__glow"
					style={{
						left: point.x,
						top: point.y,
						width: size,
						height: size,
					}}
				/>
			)}
			<div aria-hidden="true" className="spotlight-card__grid" />
			<div className={`spotlight-card__content ${innerClassName}`}>
				{children}
			</div>
		</div>
	);
}
