"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coin } from "@/components/Coin";

interface Row {
  rank: number;
  id: string;
  name: string;
  memberCount: number;
  totalPoints: number;
  isMine: boolean;
}

const medals = ["🥇", "🥈", "🥉"];

export function InterGroupLadder() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/ladder/groups")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  const max = Math.max(1, ...(rows?.map((r) => r.totalPoints) ?? [1]));

  return (
    <div className="card p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="card-section-title">Inter-groupes</div>
          <h2 className="text-base sm:text-lg font-bold mt-1">Top des équipes</h2>
        </div>
        <span className="chip shrink-0">Live</span>
      </div>
      {rows === null ? (
        <div className="text-sm text-[var(--muted)] py-6 text-center">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-[var(--muted)] italic text-center py-6">
          Aucun groupe pour l&apos;instant.
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((r) => {
            const w = (r.totalPoints / max) * 100;
            const row = (
              <div
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 rounded-xl sm:rounded-2xl transition-colors"
                style={{
                  background: r.isMine ? "var(--primary-soft)" : "transparent",
                  border: r.isMine
                    ? "1.5px solid var(--border-strong)"
                    : "1.5px solid transparent",
                }}
              >
                <span className="w-6 sm:w-7 text-center font-bold text-[var(--muted)] text-sm shrink-0">
                  {medals[r.rank - 1] ?? r.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-sm sm:text-base">
                    {r.name}
                  </div>
                  <div className="bar mt-1.5">
                    <span style={{ width: `${w}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Coin size={12} />
                    <span className="font-mono font-bold text-[var(--primary)] text-sm">
                      {r.totalPoints.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {r.memberCount} memb.
                  </div>
                </div>
              </div>
            );
            return (
              <li key={r.id}>
                {r.isMine ? (
                  <Link href={`/groups/${r.id}`} className="block">
                    {row}
                  </Link>
                ) : (
                  <div>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
