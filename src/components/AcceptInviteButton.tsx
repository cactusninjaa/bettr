"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/invitations/${token}/accept`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? "Erreur");
      setLoading(false);
      return;
    }
    router.push(`/groups/${j.groupId}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={accept} disabled={loading} className="btn-primary w-full text-base py-3">
        {loading ? "…" : "Rejoindre le groupe"}
      </button>
      {err && <div className="text-xs text-[var(--danger)] font-medium">{err}</div>}
    </>
  );
}
