// File: src/app/_components/round-art.tsx
const HUES = { 1: ["#00E5FF", "#1a2cff"], 2: ["#FF2D95", "#5b1bff"], 3: ["#00E5FF", "#7c3aed"], 4: ["#FF5722", "#FF2D95"] } as const;
const r = (n: number) => { const x = Math.sin(n * 91.7) * 10000; return x - Math.floor(x); };
const NODES = [[70, 70], [150, 150], [110, 200], [230, 90], [300, 180], [340, 60]] as const;

/** Abstract per-round artwork (generated). */
export function RoundArt({ n }: { n: 1 | 2 | 3 | 4 }) {
  const [a, b] = HUES[n];
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`ra${n}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={b} stopOpacity=".55" /><stop offset="1" stopColor="#050509" /></linearGradient>
        <radialGradient id={`rg${n}`} cx=".72" cy=".3"><stop offset="0" stopColor={a} stopOpacity=".5" /><stop offset="1" stopColor={a} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="250" fill={`url(#ra${n})`} />
      <rect width="400" height="250" fill={`url(#rg${n})`} />
      {n === 1 && Array.from({ length: 40 }, (_, i) => <rect key={i} x={40 + (i % 8) * 40} y={36 + Math.floor(i / 8) * 34} width="30" height="24" fill={a} opacity={r(i) > 0.68 ? 0.6 : 0.09} />)}
      {n === 2 && ["01001000 01001001", "11010010 00101101", "01110101 10100110", "00101110 11010001"].map((t, i) => <text key={t} x="30" y={70 + i * 36} fontFamily="var(--font-mono)" fontSize="20" fill={a} opacity={i === 1 ? 0.7 : 0.25}>{t}</text>)}
      {n === 3 && <g stroke={a} strokeOpacity=".5" fill="none">{NODES.slice(1).map(([x, y], i) => <line key={i} x1={NODES[i]![0]} y1={NODES[i]![1]} x2={x} y2={y} />)}{NODES.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill={a} />)}<circle cx="270" cy="120" r="48" strokeWidth="3" strokeOpacity=".9" /><line x1="304" y1="154" x2="340" y2="196" strokeWidth="6" strokeOpacity=".9" /></g>}
      {n === 4 && <g><path d="M0 250 L170 0 L215 0 L45 250Z" fill="#00E5FF" opacity=".35" /><path d="M400 250 L230 0 L185 0 L355 250Z" fill="#FF5722" opacity=".5" /><text x="200" y="150" textAnchor="middle" fontSize="64" fontWeight="800" fill="#F4F5FA" style={{ fontFamily: "var(--font-display)" }}>VS</text></g>}
      <text x="392" y="240" textAnchor="end" fontSize="170" fontWeight="800" fill="#fff" opacity=".06" style={{ fontFamily: "var(--font-display)" }}>0{n}</text>
    </svg>
  );
}
