"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coin } from "@/components/Coin";

interface Row {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  totalPoints: number;
  myPoints: number;
}

export function GroupList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch("/api/groups").then((r) => r.json());
    setRows(r);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "erreur");
      return;
    }
    setNewName("");
    setCreating(false);
    await refresh();
  }

  return (
    <div className="card p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="card-section-title">Communautés</div>
          <h2 className="text-base sm:text-lg font-bold mt-1">Mes groupes</h2>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-ghost shrink-0">
            + Nouveau
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={onCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du groupe…"
            className="input-soft flex-1 min-w-0"
            autoFocus
          />
          <button type="submit" disabled={!newName.trim()} className="btn-primary shrink-0">
            Créer
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName("");
              setErr(null);
            }}
            className="btn-outline shrink-0"
            aria-label="Annuler"
          >
            ✕
          </button>
        </form>
      )}
      {err && <div className="text-xs text-[var(--danger)] font-medium">{err}</div>}

      {rows.length === 0 ? (
        <div className="text-sm text-[var(--muted)] text-center py-8 italic">
          Tu n&apos;es dans aucun groupe pour l&apos;instant. Crée le tien ou rejoins-en un via un lien d&apos;invitation.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/groups/${r.id}`}
                className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-3 rounded-xl sm:rounded-2xl border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-1.5 text-sm sm:text-base">
                    <span className="truncate">{r.name}</span>
                    {r.role === "OWNER" && (
                      <span className="chip text-[9px] sm:text-[10px] shrink-0">Owner</span>
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[var(--muted)] mt-0.5 flex items-center gap-1 sm:gap-1.5">
                    <span>{r.memberCount} membres</span>
                    <span>·</span>
                    <Coin size={11} />
                    <span className="truncate">Moi : {r.myPoints.toLocaleString()} pts</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono font-bold text-[var(--primary)] text-sm sm:text-base">
                    {r.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    cumulés
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
