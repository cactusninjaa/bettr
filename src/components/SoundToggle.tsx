"use client";

import { useState } from "react";

export function SoundToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    await fetch("/api/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soundEnabled: next }),
    });
    setSaving(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="relative w-14 h-8 rounded-full transition-colors"
      style={{ background: enabled ? "var(--primary)" : "var(--border-strong)" }}
      aria-pressed={enabled}
    >
      <span
        className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
        style={{ left: enabled ? "1.75rem" : "0.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
      />
    </button>
  );
}
