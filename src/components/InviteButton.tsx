"use client";

import { useState } from "react";

export function InviteButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setErr(null);
    setCopied(false);
    const res = await fetch(`/api/groups/${groupId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: 14 }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? "Erreur");
      setLoading(false);
      return;
    }
    setUrl(j.url);
    setLoading(false);
    try {
      await navigator.clipboard.writeText(j.url);
      setCopied(true);
    } catch {
      /* ignored */
    }
  }

  async function copyAgain() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignored */
    }
  }

  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="card-section-title">Inviter</div>
          <h3 className="font-bold mt-1 text-sm sm:text-base">Partage le lien</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Lien valable 14 jours.
          </p>
        </div>
        {!url && (
          <button onClick={generate} disabled={loading} className="btn-primary shrink-0">
            {loading ? "…" : "Générer"}
          </button>
        )}
      </div>
      {url && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="input-soft flex-1 min-w-0 font-mono text-[11px] sm:text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button onClick={copyAgain} className="btn-ghost shrink-0">
            {copied ? "✓" : "Copier"}
          </button>
        </div>
      )}
      {err && <div className="text-xs text-[var(--danger)] font-medium">{err}</div>}
    </div>
  );
}
