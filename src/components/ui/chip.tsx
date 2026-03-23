interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function Chip({ children, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-heading uppercase tracking-wider transition-colors ${
        active
          ? "border-accent-primary text-accent-primary"
          : "border-border text-text-muted hover:border-text-muted"
      }`}
    >
      {children}
    </button>
  );
}
