interface Props {
  count: number;
  size?: "sm" | "md" | "lg";
}

export function StreakFlame({ count, size = "md" }: Props) {
  const isActive = count > 0;
  const fontSize = size === "sm" ? "0.875rem" : size === "lg" ? "1.5rem" : "1rem";
  const emojiSize = size === "sm" ? "1rem" : size === "lg" ? "2rem" : "1.25rem";

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        background: isActive ? "#fff4e6" : "var(--surface-muted)",
        color: isActive ? "#d97706" : "var(--muted)",
        opacity: isActive ? 1 : 0.7,
      }}
      title={`${count} jour${count > 1 ? "s" : ""} d'affilée`}
    >
      <span style={{ fontSize: emojiSize, filter: isActive ? "none" : "grayscale(1)" }}>
        🔥
      </span>
      <span style={{ fontSize, fontWeight: 700 }}>{count}</span>
    </div>
  );
}
