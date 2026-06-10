"use client";

import { useEffect, useState } from "react";

interface Props {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  compact?: boolean;
}

export function XpBar({ level, xpInLevel, xpForNext, compact }: Props) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const targetPct = Math.min(100, Math.max(0, (xpInLevel / xpForNext) * 100));

  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(targetPct), 50);
    return () => clearTimeout(t);
  }, [targetPct]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-[8rem]">
        <div className="text-xs font-bold text-[var(--primary)] shrink-0">Niv. {level}</div>
        <div className="bar flex-1">
          <span
            style={{ width: `${animatedPct}%`, transition: "width 700ms ease-out" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">
            Niveau
          </span>
          <span className="ml-2 text-2xl font-black text-[var(--primary)]">{level}</span>
        </div>
        <div className="text-xs font-mono text-[var(--muted)]">
          {xpInLevel} / {xpForNext} XP
        </div>
      </div>
      <div className="bar" style={{ height: 10 }}>
        <span
          style={{ width: `${animatedPct}%`, transition: "width 900ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
      </div>
    </div>
  );
}
