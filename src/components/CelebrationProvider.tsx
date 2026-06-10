"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { celebrateBadge, celebrateLevelUp, setSoundEnabled } from "@/lib/celebrate";

export interface UnlockedBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface CelebrationApi {
  showBadges(badges: UnlockedBadge[]): void;
  showLevelUp(level: number): void;
}

const Ctx = createContext<CelebrationApi | null>(null);

export function useCelebration(): CelebrationApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("CelebrationProvider missing");
  return ctx;
}

interface Toast {
  key: string;
  type: "badge" | "level";
  payload: UnlockedBadge | { level: number };
}

export function CelebrationProvider({
  children,
  soundEnabled,
}: {
  children: React.ReactNode;
  soundEnabled: boolean;
}) {
  const [queue, setQueue] = useState<Toast[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const showBadges = useCallback((badges: UnlockedBadge[]) => {
    if (badges.length === 0) return;
    setQueue((q) => [
      ...q,
      ...badges.map((b) => ({ key: `b${counter.current++}`, type: "badge" as const, payload: b })),
    ]);
  }, []);

  const showLevelUp = useCallback((level: number) => {
    setQueue((q) => [
      ...q,
      { key: `l${counter.current++}`, type: "level" as const, payload: { level } },
    ]);
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const current = queue[0];
    if (current.type === "badge") celebrateBadge();
    else celebrateLevelUp();
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 3200);
    return () => clearTimeout(t);
  }, [queue]);

  const current = queue[0];

  return (
    <Ctx.Provider value={{ showBadges, showLevelUp }}>
      {children}
      {current && (
        <div className="fixed inset-x-0 top-20 z-[100] flex justify-center pointer-events-none px-4">
          {current.type === "badge" ? (
            <BadgeToast badge={current.payload as UnlockedBadge} />
          ) : (
            <LevelToast level={(current.payload as { level: number }).level} />
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}

function BadgeToast({ badge }: { badge: UnlockedBadge }) {
  return (
    <div
      className="card flex items-center gap-4 px-5 py-4 max-w-md w-full pointer-events-auto"
      style={{
        animation: "toast-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        background: "var(--primary)",
        color: "white",
        border: "none",
        boxShadow: "0 12px 40px -8px rgba(39, 86, 230, 0.5)",
      }}
    >
      <div className="text-4xl">{badge.icon}</div>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">
          Badge débloqué
        </div>
        <div className="font-black text-lg leading-tight">{badge.name}</div>
        <div className="text-xs opacity-80">{badge.description}</div>
      </div>
      <style>{`
        @keyframes toast-pop {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function LevelToast({ level }: { level: number }) {
  return (
    <div
      className="card flex items-center gap-4 px-5 py-4 max-w-md w-full pointer-events-auto"
      style={{
        animation: "toast-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        background: "#e6a90c",
        color: "white",
        border: "none",
        boxShadow: "0 12px 40px -8px rgba(244, 197, 66, 0.6)",
      }}
    >
      <div className="text-4xl">🚀</div>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-widest opacity-90 font-semibold">
          Niveau supérieur !
        </div>
        <div className="font-black text-xl leading-tight">Niveau {level}</div>
        <div className="text-xs opacity-90">Continue comme ça.</div>
      </div>
    </div>
  );
}
