interface StatBlockProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export function StatBlock({ label, value, unit = "kg", highlight }: StatBlockProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-heading uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={`font-mono text-3xl font-bold ${
          highlight ? "text-accent-secondary" : "text-text-primary"
        }`}
      >
        {value}
        <span className="text-base text-text-muted">{unit}</span>
      </span>
    </div>
  );
}
