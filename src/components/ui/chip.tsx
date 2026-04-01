interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  dark?: boolean;
  onClick?: () => void;
}

export function Chip({ children, active, dark, onClick }: ChipProps) {
  const lightActive = "border-accent-red text-accent-red";
  const lightInactive = "border-border text-text-muted hover:border-text-muted";
  const darkActive = "border-accent-red text-accent-red";
  const darkInactive = "border-white/10 text-zinc-400 hover:border-zinc-500";

  const style = dark
    ? active ? darkActive : darkInactive
    : active ? lightActive : lightInactive;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center border rounded-sm px-3 py-1 text-xs font-heading uppercase tracking-wider transition-colors ${style}`}
    >
      {children}
    </button>
  );
}

interface TagChipProps {
  children: React.ReactNode;
  variant?: "default" | "tested" | "equipment" | "fresh";
  dark?: boolean;
}

export function TagChip({ children, variant = "default", dark }: TagChipProps) {
  const lightStyles = {
    default: "border-border text-text-muted",
    tested: "border-accent-green/30 text-accent-green",
    equipment: "border-border text-text-muted",
    fresh: "border-accent-blue/30 text-accent-blue",
  };

  const darkStyles = {
    default: "border-white/10 text-zinc-400",
    tested: "border-accent-green/30 text-accent-green",
    equipment: "border-white/10 text-zinc-400",
    fresh: "border-accent-blue/30 text-accent-blue",
  };

  const styles = dark ? darkStyles : lightStyles;

  return (
    <span
      className={`inline-flex items-center border rounded-sm px-1.5 py-0.5 text-[10px] font-heading uppercase tracking-wider ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
