// File: src/app/_components/city-art.tsx
const rnd = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

function skyline(seed: number, count: number, minH: number, maxH: number, gap: number) {
  let x = 0;
  return Array.from({ length: count }, (_, i) => {
    const w = 38 + rnd(seed + i) * 64, h = minH + rnd(seed + i * 3) * (maxH - minH);
    const b = { x, w, h };
    x += w + rnd(seed + i * 5) * gap;
    return b;
  });
}
const rects = (bs: { x: number; w: number; h: number }[], ground: number) => bs.map((b) => `M${b.x} ${ground}V${ground - b.h}H${b.x + b.w}V${ground}Z`).join("");
const windows = (bs: { x: number; w: number; h: number }[], ground: number, p: number, seed: number) => {
  let d = "";
  bs.forEach((b, bi) => {
    for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 11)
      for (let wy = ground - b.h + 8; wy < ground - 8; wy += 14)
        if (rnd(seed + bi * 131 + wx * 7 + wy) < p) d += `M${wx.toFixed(0)} ${wy.toFixed(0)}h3v4h-3z`;
  });
  return d;
};

const FAR = skyline(11, 14, 90, 200, 6), MID = skyline(47, 12, 110, 250, 8), NEAR = skyline(83, 9, 70, 170, 24);

/** Hero artwork: neon city street at night, generated as SVG (replace with real artwork any time). */
export function CityArt() {
  const G = 360;
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0820" /><stop offset=".6" stopColor="#2a0f45" /><stop offset="1" stopColor="#7a1a5e" /></linearGradient>
        <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF2D95" stopOpacity=".35" /><stop offset="1" stopColor="#050509" /></linearGradient>
        <radialGradient id="moon" cx=".5" cy=".5"><stop offset="0" stopColor="#ffd6ef" stopOpacity=".9" /><stop offset="1" stopColor="#ff7ac8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="800" height="500" fill="url(#sky)" />
      <circle cx="590" cy="120" r="90" fill="url(#moon)" />
      <path d={rects(FAR, G).replace(/M(\d+)/g, (_, n) => `M${+n * 1.05}`)} fill="#15102e" />
      <g transform="translate(20,0)"><path d={rects(MID, G)} fill="#0d0a22" /><path d={windows(MID, G, 0.16, 5)} fill="#00E5FF" opacity=".55" /></g>
      <g transform="translate(-10,0)"><path d={rects(NEAR, G)} fill="#06050e" /><path d={windows(NEAR, G, 0.2, 9)} fill="#FF5722" opacity=".7" /></g>
      <g className="flicker" style={{ fontFamily: "var(--font-display)" }}>
        <rect x="118" y="170" width="92" height="30" fill="none" stroke="#00E5FF" strokeWidth="2" /><text x="164" y="192" textAnchor="middle" fontSize="22" fontWeight="700" fill="#00E5FF">CYBER</text>
        <rect x="560" y="205" width="110" height="30" fill="none" stroke="#FF2D95" strokeWidth="2" /><text x="615" y="227" textAnchor="middle" fontSize="22" fontWeight="700" fill="#FF2D95">ARENA</text>
        <text x="330" y="150" fontSize="16" fill="#FF5722" letterSpacing="3">0xC1A5H</text>
      </g>
      <rect y={G} width="800" height={500 - G} fill="url(#gnd)" />
      {Array.from({ length: 13 }, (_, i) => <line key={i} x1="400" y1={G} x2={(i - 6) * 150 + 400} y2="500" stroke="#00E5FF" strokeOpacity=".18" />)}
      {[10, 26, 50, 84, 128].map((y) => <line key={y} x1="0" x2="800" y1={G + y} y2={G + y} stroke="#00E5FF" strokeOpacity=".14" />)}
    </svg>
  );
}

/** Distant skyline pinned to the bottom of the viewport, behind everything. */
export function CityBackdrop() {
  return (
    <svg aria-hidden viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" className="pointer-events-none fixed inset-x-0 bottom-0 -z-[5] h-[34vh] w-full opacity-60 sm:h-[42vh]" style={{ maskImage: "linear-gradient(to top,#000 35%,transparent)" }}>
      <path d={rects(FAR.concat(MID.slice(0, 6)), 260)} fill="#0e0b24" />
      <path d={windows(FAR, 260, 0.1, 3)} fill="#00E5FF" opacity=".35" />
      <g className="flicker"><rect x="130" y="130" width="3" height="40" fill="#FF2D95" /><rect x="520" y="110" width="3" height="52" fill="#00E5FF" /></g>
    </svg>
  );
}
