const COLORS = {
	1: ["#00e5ff", "#1a2cff"],
	2: ["#ff2d95", "#5b1bff"],
	3: ["#00e5ff", "#7c3aed"],
	4: ["#ff5722", "#ff2d95"],
} as const;

const random = (n: number) => {
	const x = Math.sin(n * 91.7) * 10000;
	return x - Math.floor(x);
};

const NODES = [
	[70, 70],
	[150, 150],
	[110, 200],
	[230, 90],
	[300, 180],
	[340, 60],
] as const;

export function RoundArt({ n }: { n: 1 | 2 | 3 | 4 }) {
	const [primary, secondary] = COLORS[n];
	return (
		<svg
			aria-hidden="true"
			className="h-full w-full"
			preserveAspectRatio="xMidYMid slice"
			viewBox="0 0 400 250"
		>
			<defs>
				<linearGradient id={`round-art-${n}`} x1="0" x2="1" y1="0" y2="1">
					<stop offset="0" stopColor={secondary} stopOpacity=".55" />
					<stop offset="1" stopColor="#050509" />
				</linearGradient>
				<radialGradient id={`round-glow-${n}`} cx=".72" cy=".3">
					<stop offset="0" stopColor={primary} stopOpacity=".5" />
					<stop offset="1" stopColor={primary} stopOpacity="0" />
				</radialGradient>
			</defs>
			<rect fill={`url(#round-art-${n})`} height="250" width="400" />
			<rect fill={`url(#round-glow-${n})`} height="250" width="400" />
			{n === 1 &&
				Array.from({ length: 40 }, (_, index) => (
					<rect
						key={index}
						x={40 + (index % 8) * 40}
						y={36 + Math.floor(index / 8) * 34}
						width="30"
						height="24"
						fill={primary}
						opacity={random(index) > 0.68 ? 0.6 : 0.09}
					/>
				))}
			{n === 2 &&
				["01001000 01001001", "11010010 00101101", "01110101 10100110", "00101110 11010001"].map(
					(line, index) => (
						<text
							key={line}
							x="30"
							y={70 + index * 36}
							fontFamily="var(--font-mono)"
							fontSize="20"
							fill={primary}
							opacity={index === 1 ? 0.7 : 0.25}
						>
							{line}
						</text>
					),
				)}
			{n === 3 && (
				<g fill="none" stroke={primary} strokeOpacity=".5">
					{NODES.slice(1).map(([x, y], index) => (
						<line
							key={`edge-${index}`}
							x1={NODES[index]![0]}
							y1={NODES[index]![1]}
							x2={x}
							y2={y}
						/>
					))}
					{NODES.map(([x, y], index) => (
						<circle key={`node-${index}`} cx={x} cy={y} r="6" fill={primary} />
					))}
					<circle cx="270" cy="120" r="48" strokeOpacity=".9" strokeWidth="3" />
					<line x1="304" x2="340" y1="154" y2="196" strokeOpacity=".9" strokeWidth="6" />
				</g>
			)}
			{n === 4 && (
				<g>
					<path d="M0 250 170 0h45L45 250Z" fill="#00e5ff" opacity=".35" />
					<path d="M400 250 230 0h-45l170 250Z" fill="#ff5722" opacity=".5" />
					<text
						x="200"
						y="150"
						textAnchor="middle"
						fontSize="64"
						fontWeight="800"
						fill="#f4f5fa"
						style={{ fontFamily: "var(--font-display)" }}
					>
						VS
					</text>
				</g>
			)}
			<text
				x="392"
				y="240"
				textAnchor="end"
				fontSize="170"
				fontWeight="800"
				fill="#fff"
				opacity=".06"
				style={{ fontFamily: "var(--font-display)" }}
			>
				0{n}
			</text>
		</svg>
	);
}
