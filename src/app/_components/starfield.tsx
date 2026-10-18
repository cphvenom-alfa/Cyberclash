// File: src/app/_components/starfield.tsx
"use client";
import { useEffect, useRef } from "react";

const GLYPHS = "01ABCDEF<>/{}#$%&*+=?ΞΣΩ∆";

/** Fixed galaxy background: parallax stars, falling cipher glyphs, rare shooting stars. */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, last = performance.now(), mx = 0, my = 0, tx = 0, ty = 0;
    let stars: { x: number; y: number; z: number; p: number }[] = [];
    let cols: { x: number; y: number; v: number; len: number }[] = [];
    let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null;

    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * d; c.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      stars = Array.from({ length: Math.floor((w * h) / 6500) }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random() * 0.9 + 0.1, p: Math.random() * 6.28 }));
      cols = Array.from({ length: Math.floor(w / 110) }, (_, i) => ({ x: i * 110 + Math.random() * 70, y: Math.random() * h, v: 18 + Math.random() * 30, len: 6 + Math.floor(Math.random() * 8) }));
    };
    const move = (e: PointerEvent) => { tx = e.clientX / w - 0.5; ty = e.clientY / h - 0.5; };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduce) { s.y -= s.z * 6 * dt; if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; } }
        const x = s.x - mx * 40 * s.z, y = s.y - my * 40 * s.z;
        const a = 0.35 + 0.65 * Math.abs(Math.sin(now / 900 + s.p));
        ctx.fillStyle = s.z > 0.75 ? `rgba(165,243,252,${a})` : `rgba(221,214,254,${a * s.z + 0.15})`;
        ctx.fillRect(x, y, s.z * 2, s.z * 2);
      }
      ctx.font = "13px monospace";
      for (const col of cols) {
        if (!reduce) { col.y += col.v * dt; if (col.y - col.len * 16 > h) col.y = -20; }
        for (let i = 0; i < col.len; i++) {
          const g = GLYPHS[(i * 7 + Math.floor(now / 350) + Math.floor(col.x)) % GLYPHS.length]!;
          ctx.fillStyle = `rgba(34,211,238,${0.07 * (1 - i / col.len)})`;
          ctx.fillText(g, col.x, col.y - i * 16);
        }
      }
      if (!reduce) {
        if (!shoot && Math.random() < dt / 9) shoot = { x: Math.random() * w, y: Math.random() * h * 0.4, vx: 700, vy: 320, life: 1 };
        if (shoot) {
          shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; shoot.life -= dt * 1.4;
          const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - 120, shoot.y - 55);
          g.addColorStop(0, `rgba(255,255,255,${shoot.life})`); g.addColorStop(1, "rgba(232,121,249,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - 120, shoot.y - 55); ctx.stroke();
          if (shoot.life <= 0) shoot = null;
        }
        raf = requestAnimationFrame(draw);
      }
    };
    resize();
    raf = requestAnimationFrame(draw);
    addEventListener("resize", resize);
    addEventListener("pointermove", move);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); removeEventListener("pointermove", move); };
  }, []);
  return (
    <>
      <div className="nebula" />
      <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
    </>
  );
}
