interface CoinProps {
  size?: number;
  className?: string;
}

export function Coin({ size = 16, className }: CoinProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="#1e44b8" />
      <circle cx="12" cy="12" r="8.5" fill="#2756e6" />
      <path
        d="M9.5 7.5h4.2c1.6 0 2.8 1 2.8 2.4 0 1-.5 1.7-1.4 2.1.9.3 1.5 1 1.5 2.1 0 1.6-1.2 2.4-3 2.4H9.5V7.5zm3.9 3.6c.7 0 1.1-.4 1.1-1s-.4-1-1.1-1h-2v2h2zm.2 3.6c.8 0 1.2-.4 1.2-1s-.4-1-1.2-1h-2.2v2h2.2z"
        fill="#fff"
      />
    </svg>
  );
}
