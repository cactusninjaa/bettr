"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coin } from "@/components/Coin";
import { celebrateXp } from "@/lib/celebrate";
import { useCelebration, type UnlockedBadge } from "@/components/CelebrationProvider";

interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  oddsHome: number;
  oddsDraw: number | null;
  oddsAway: number;
}

interface ExistingBet {
  choice: string;
  amount: number;
  status: string;
  pointsWon: number;
}

interface Props {
  match: MatchData;
  groupId: string;
  remainingBudget: number;
  existingBet: ExistingBet | null;
}

export function MatchCard({ match, groupId, remainingBudget, existingBet }: Props) {
  const router = useRouter();
  const celebration = useCelebration();
  const [choice, setChoice] = useState<"HOME" | "DRAW" | "AWAY" | null>(null);
  const [amount, setAmount] = useState(10);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const started = new Date(match.commenceTime).getTime() <= Date.now();
  const canBet = !started && !existingBet && remainingBudget > 0;

  async function submit() {
    if (!choice) return;
    setPending(true);
    setErr(null);
    const res = await fetch("/api/bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, matchId: match.id, choice, amount }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "erreur");
      setPending(false);
      return;
    }
    const j = (await res.json()) as {
      xpDelta?: { leveledUp: boolean; newLevel: number };
      unlockedAchievements?: UnlockedBadge[];
    };
    celebrateXp();
    if (j.xpDelta?.leveledUp) celebration.showLevelUp(j.xpDelta.newLevel);
    if (j.unlockedAchievements?.length) celebration.showBadges(j.unlockedAchievements);
    setPending(false);
    router.refresh();
  }

  const time = new Date(match.commenceTime).toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusBg =
    existingBet?.status === "WON"
      ? "var(--success-soft)"
      : existingBet?.status === "LOST"
        ? "var(--danger-soft)"
        : "var(--primary-soft)";
  const statusColor =
    existingBet?.status === "WON"
      ? "var(--success)"
      : existingBet?.status === "LOST"
        ? "var(--danger)"
        : "var(--primary)";

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
            {time}
          </div>
          <div className="font-bold text-base mt-1 leading-snug">
            <span>{match.homeTeam}</span>
            <span className="text-[var(--muted)] font-normal mx-1.5">vs</span>
            <span>{match.awayTeam}</span>
          </div>
        </div>
        {existingBet && (
          <span
            className="chip shrink-0"
            style={{ background: statusBg, color: statusColor }}
          >
            {existingBet.status}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["HOME", "DRAW", "AWAY"] as const).map((c) => {
          const odds =
            c === "HOME" ? match.oddsHome : c === "DRAW" ? match.oddsDraw : match.oddsAway;
          const label = c === "HOME" ? "1" : c === "DRAW" ? "N" : "2";
          const disabled = !canBet || odds == null;
          const selected = choice === c;
          return (
            <button
              key={c}
              disabled={disabled}
              onClick={() => setChoice(c)}
              className="px-3 py-3 rounded-2xl text-sm transition-colors"
              style={{
                background: selected ? "var(--primary)" : "var(--surface-muted)",
                color: selected ? "white" : "var(--foreground)",
                border: selected
                  ? "1.5px solid var(--primary)"
                  : "1.5px solid transparent",
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ opacity: 0.75 }}
              >
                {label}
              </div>
              <div className="font-mono font-bold text-base mt-0.5">
                {odds?.toFixed(2) ?? "—"}
              </div>
            </button>
          );
        })}
      </div>

      {existingBet ? (
        <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--muted)]">Pari :</span>
            <span className="font-semibold">{existingBet.choice}</span>
            <span className="text-[var(--muted)]">·</span>
            <Coin size={13} />
            <span className="font-mono font-semibold">{existingBet.amount}</span>
          </div>
          {existingBet.pointsWon > 0 && (
            <span className="font-mono font-bold text-[var(--success)] flex items-center gap-1">
              <Coin size={13} />+{existingBet.pointsWon}
            </span>
          )}
        </div>
      ) : started ? (
        <div className="text-xs text-[var(--muted)] italic">Match déjà commencé</div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 input-soft flex-1">
            <Coin size={14} />
            <input
              type="number"
              min={1}
              max={remainingBudget}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value || "0", 10)))}
              className="bg-transparent outline-none w-full font-mono font-semibold"
            />
          </div>
          <button
            onClick={submit}
            disabled={!choice || pending || amount < 1 || amount > remainingBudget}
            className="btn-primary"
          >
            {pending ? "…" : "Parier"}
          </button>
        </div>
      )}
      {err && <div className="text-xs text-[var(--danger)] font-medium">{err}</div>}
    </div>
  );
}
