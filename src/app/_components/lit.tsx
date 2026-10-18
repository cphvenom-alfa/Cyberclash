// File: src/app/_components/lit.tsx
"use client";
/** Pointer-position glow for cards. Sets CSS vars directly, no re-renders. */
export function Lit({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`lit relative ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--px", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--py", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
