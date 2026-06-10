"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coin } from "@/components/Coin";
import { celebrateWin } from "@/lib/celebrate";
import { useCelebration, type UnlockedBadge } from "@/components/CelebrationProvider";

interface BetResult {
  betId: string;
  matchLabel: string;
  groupName: string;
  choice: string;
  amount: number;
  outcome: "WIN" | "LOSE";
  pointsWon: number;
}

export function AdminBar() {
  const router = useRouter();
  const celebration = useCelebration();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [reveal, setReveal] = useState<BetResult[]>([]);
  const [revealCount, setRevealCount] = useState(0);

  async function fetchOdds() {
    setLoading("fetch");
    setMsg(null);
    const res = await fetch("/api/cron/fetch-odds", { method: "POST" });
    const j = await res.json();
    setMsg(`Fetch odds → ${JSON.stringify(j)}`);
    setLoading(null);
    router.refresh();
  }

  async function force(outcome: "WIN" | "LOSE") {
    setLoading(outcome);
    setMsg(null);
    setReveal([]);
    setRevealCount(0);

    const res = await fetch("/api/admin/force-bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const j = (await res.json()) as {
      results?: BetResult[];
      message?: string;
      unlockedAchievements?: UnlockedBadge[];
      leveledUpTo?: number | null;
    };

    if (j.message || !j.results || j.results.length === 0) {
      setMsg(j.message ?? "Aucun pari en attente");
      setLoading(null);
      return;
    }

    setReveal(j.results);
    for (let i = 0; i < j.results.length; i++) {
      await new Promise((r) => setTimeout(r, 650));
      setRevealCount(i + 1);
      const current = j.results[i];
      if (current.outcome === "WIN") celebrateWin(current.pointsWon);
    }
    await new Promise((r) => setTimeout(r, 400));

    if (j.leveledUpTo) celebration.showLevelUp(j.leveledUpTo);
    if (j.unlockedAchievements?.length) celebration.showBadges(j.unlockedAchievements);

    setLoading(null);
    router.refresh();
  }

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="card-section-title">Outils du POC</div>
          <h2 className="text-lg font-bold mt-1">Pilotage admin</h2>
        </div>
        <span className="chip">Sandbox</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={fetchOdds} disabled={loading !== null} className="btn-outline">
          {loading === "fetch" ? "…" : "Récupérer les cotes"}
        </button>
        <button
          onClick={() => force("WIN")}
          disabled={loading !== null}
          className="btn-primary"
          style={{ background: "var(--success)" }}
        >
          {loading === "WIN" ? "…" : "Faire gagner mes paris"}
        </button>
        <button
          onClick={() => force("LOSE")}
          disabled={loading !== null}
          className="btn-primary"
          style={{ background: "var(--danger)" }}
        >
          {loading === "LOSE" ? "…" : "Faire perdre mes paris"}
        </button>
      </div>

      {msg && (
        <div className="text-xs font-mono text-[var(--muted)] break-all bg-[var(--surface-muted)] rounded-xl p-3">
          {msg}
        </div>
      )}

      {reveal.length > 0 && (
        <ul className="flex flex-col gap-2 mt-1">
          {reveal.map((b, i) => {
            const shown = i < revealCount;
            const isWin = b.outcome === "WIN";
            const bg = !shown
              ? "var(--surface-muted)"
              : isWin
                ? "var(--success-soft)"
                : "var(--danger-soft)";
            const border = !shown
              ? "var(--border)"
              : isWin
                ? "var(--success)"
                : "var(--danger)";
            const color = isWin ? "var(--success)" : "var(--danger)";
            return (
              <li
                key={b.betId}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                  shown ? "animate-flash" : "opacity-0"
                }`}
                style={{ background: bg, borderColor: border }}
              >
                <div
                  className="w-9 h-9 rounded-full grid place-items-center text-base font-bold"
                  style={{
                    background: shown ? "white" : "var(--surface-muted)",
                    color: shown ? color : "var(--muted)",
                  }}
                >
                  {shown ? (isWin ? "✓" : "✕") : "·"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{b.matchLabel}</div>
                  <div className="text-xs text-[var(--muted)] flex items-center gap-1">
                    <span>{b.groupName} · choix {b.choice} ·</span>
                    <Coin size={11} />
                    <span>{b.amount}</span>
                  </div>
                </div>
                {shown && (
                  <div
                    className="font-mono font-bold text-lg flex items-center gap-1"
                    style={{ color }}
                  >
                    {isWin ? (
                      <>
                        <Coin size={14} />+{b.pointsWon}
                      </>
                    ) : (
                      "0"
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
