// File: src/app/_components/cursor-light.tsx
"use client";
import { useEffect, useRef } from "react";

/** Eased cursor-following ambient light. Updates CSS variables directly (no React state). Off for touch + reduced motion. */
export function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current!;
    let tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      el.style.setProperty("--mx", `${x}px`); el.style.setProperty("--my", `${y}px`);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(tick); };
    const root = document.documentElement;
    const enter = () => { el.style.opacity = "1"; };
    const leave = () => { el.style.opacity = "0"; }; // fade out when the pointer leaves the window
    addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    enter();
    return () => { removeEventListener("pointermove", move); root.removeEventListener("pointerenter", enter); root.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} aria-hidden className="cursor-light" />;
}
