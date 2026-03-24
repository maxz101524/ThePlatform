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

interface TagChipProps {
  children: React.ReactNode;
  variant?: "default" | "tested" | "equipment" | "fresh";
}

export function TagChip({ children, variant = "default" }: TagChipProps) {
  const variantStyles = {
    default: "border-border text-text-muted",
    tested: "border-semantic-success/30 text-semantic-success",
    equipment: "border-border text-text-muted",
    fresh: "border-accent-tertiary/30 text-accent-tertiary",
  };

  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 text-[10px] font-heading uppercase tracking-wider ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
