const random = (n: number) => {
	const x = Math.sin(n * 127.1) * 43758.5453;
	return x - Math.floor(x);
};

function skyline(
	seed: number,
	count: number,
	minHeight: number,
	maxHeight: number,
	gap: number,
) {
	let x = 0;
	return Array.from({ length: count }, (_, index) => {
		const width = 38 + random(seed + index) * 64;
		const height = minHeight + random(seed + index * 3) * (maxHeight - minHeight);
		const building = { x, width, height };
		x += width + random(seed + index * 5) * gap;
		return building;
	});
}

type Building = { x: number; width: number; height: number };

const outlines = (buildings: Building[], ground: number) =>
	buildings
		.map(
			({ x, width, height }) =>
				`M${x} ${ground}V${ground - height}H${x + width}V${ground}Z`,
		)
		.join("");

function litWindows(
	buildings: Building[],
	ground: number,
	probability: number,
	seed: number,
) {
	let path = "";
	buildings.forEach((building, buildingIndex) => {
		for (let x = building.x + 6; x < building.x + building.width - 6; x += 11) {
			for (let y = ground - building.height + 8; y < ground - 8; y += 14) {
				if (random(seed + buildingIndex * 131 + x * 7 + y) < probability)
					path += `M${x.toFixed(0)} ${y.toFixed(0)}h3v4h-3z`;
			}
		}
	});
	return path;
}

const FAR = skyline(11, 14, 90, 200, 6);
const MID = skyline(47, 12, 110, 250, 8);
const NEAR = skyline(83, 9, 70, 170, 24);

export function CityArt() {
	const ground = 360;
	return (
		<svg
			aria-hidden="true"
			className="h-full w-full"
			preserveAspectRatio="xMidYMid slice"
			viewBox="0 0 800 500"
		>
			<defs>
				<linearGradient id="city-sky" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stopColor="#0a0820" />
					<stop offset=".6" stopColor="#2a0f45" />
					<stop offset="1" stopColor="#7a1a5e" />
				</linearGradient>
				<linearGradient id="city-ground" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stopColor="#ff2d95" stopOpacity=".35" />
					<stop offset="1" stopColor="#050509" />
				</linearGradient>
				<radialGradient id="city-moon" cx=".5" cy=".5">
					<stop offset="0" stopColor="#ffd6ef" stopOpacity=".9" />
					<stop offset="1" stopColor="#ff7ac8" stopOpacity="0" />
				</radialGradient>
			</defs>
			<rect width="800" height="500" fill="url(#city-sky)" />
			<circle cx="590" cy="120" fill="url(#city-moon)" r="90" />
			<path d={outlines(FAR, ground)} fill="#15102e" />
			<g transform="translate(20 0)">
				<path d={outlines(MID, ground)} fill="#0d0a22" />
				<path d={litWindows(MID, ground, 0.16, 5)} fill="#00e5ff" opacity=".55" />
			</g>
			<g transform="translate(-10 0)">
				<path d={outlines(NEAR, ground)} fill="#06050e" />
				<path d={litWindows(NEAR, ground, 0.2, 9)} fill="#ff5722" opacity=".7" />
			</g>
			<g className="flicker" fontFamily="var(--font-display)">
				<rect height="30" width="92" x="118" y="170" fill="none" stroke="#00e5ff" strokeWidth="2" />
				<text fill="#00e5ff" fontSize="22" fontWeight="700" textAnchor="middle" x="164" y="192">CYBER</text>
				<rect height="30" width="110" x="560" y="205" fill="none" stroke="#ff2d95" strokeWidth="2" />
				<text fill="#ff2d95" fontSize="22" fontWeight="700" textAnchor="middle" x="615" y="227">ARENA</text>
				<text fill="#ff5722" fontSize="16" letterSpacing="3" x="330" y="150">0xC1A5H</text>
			</g>
			<rect fill="url(#city-ground)" height={500 - ground} width="800" y={ground} />
			{Array.from({ length: 13 }, (_, index) => (
				<line
					key={index}
					x1="400"
					x2={(index - 6) * 150 + 400}
					y1={ground}
					y2="500"
					stroke="#00e5ff"
					strokeOpacity=".18"
				/>
			))}
			{[10, 26, 50, 84, 128].map((y) => (
				<line
					key={y}
					x1="0"
					x2="800"
					y1={ground + y}
					y2={ground + y}
					stroke="#00e5ff"
					strokeOpacity=".14"
				/>
			))}
		</svg>
	);
}

export function CityBackdrop() {
	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none fixed inset-x-0 bottom-0 -z-[5] h-[34vh] w-full opacity-60 sm:h-[42vh]"
			preserveAspectRatio="xMidYMax slice"
			style={{ maskImage: "linear-gradient(to top, #000 35%, transparent)" }}
			viewBox="0 0 800 260"
		>
			<path d={outlines(FAR.concat(MID.slice(0, 6)), 260)} fill="#0e0b24" />
			<path d={litWindows(FAR, 260, 0.1, 3)} fill="#00e5ff" opacity=".35" />
			<g className="flicker">
				<rect fill="#ff2d95" height="40" width="3" x="130" y="130" />
				<rect fill="#00e5ff" height="52" width="3" x="520" y="110" />
			</g>
		</svg>
	);
}
