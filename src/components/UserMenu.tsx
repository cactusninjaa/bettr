"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Props {
  name: string | null;
  image: string | null;
  signOutAction: () => Promise<void>;
}

export function UserMenu({ name, image, signOutAction }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial = name?.[0]?.toUpperCase() ?? "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="card flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--surface-muted)] transition-colors"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name ?? ""} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
        ) : (
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full grid place-items-center text-white font-bold text-xs sm:text-sm"
            style={{ background: "var(--primary)" }}
          >
            {initial}
          </div>
        )}
        <span className="text-sm font-semibold pr-1 hidden md:inline truncate max-w-[10rem]">
          {name ?? "—"}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 card p-2 z-50 flex flex-col gap-0.5">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-[var(--surface-muted)]"
          >
            Mon profil
          </Link>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-[var(--surface-muted)]"
          >
            Mes groupes
          </Link>
          <div className="divider my-1" style={{ height: 1, background: "var(--border)" }} />
          <form action={signOutAction}>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-sm font-medium w-full text-left text-[var(--danger)] hover:bg-[var(--danger-soft)]"
            >
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
