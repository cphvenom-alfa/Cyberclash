import Link from "next/link";

export function GlowButton({
	href,
	onClick,
	children,
}: {
	href?: string;
	onClick?: () => void;
	children: React.ReactNode;
}) {
	const face = (
		<span className="glow-button__face">
			{children}
			<span aria-hidden="true" className="glow-button__arrow">
				→
			</span>
		</span>
	);
	return (
		<span className="glow-button">
			{href ? (
				<Link className="glow-button__link" href={href}>
					{face}
				</Link>
			) : (
				<button className="glow-button__link" onClick={onClick} type="button">
					{face}
				</button>
			)}
		</span>
	);
}
