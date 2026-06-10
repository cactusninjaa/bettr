interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string | null;
}

export function BadgeWall({ badges }: { badges: BadgeData[] }) {
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="card-section-title">Collection</div>
          <h2 className="text-lg font-bold mt-1">Badges</h2>
        </div>
        <span className="chip">
          {unlockedCount} / {badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className="flex flex-col items-center gap-1 p-3 rounded-2xl text-center transition-transform hover:scale-105"
            style={{
              background: b.unlocked ? "var(--primary-soft)" : "var(--surface-muted)",
              opacity: b.unlocked ? 1 : 0.55,
            }}
            title={b.description}
          >
            <span
              className="text-3xl"
              style={{ filter: b.unlocked ? "none" : "grayscale(1)" }}
            >
              {b.icon}
            </span>
            <span
              className="text-[11px] font-semibold leading-tight"
              style={{ color: b.unlocked ? "var(--primary)" : "var(--muted)" }}
            >
              {b.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
