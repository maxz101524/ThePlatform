interface StatBlockProps {
  label: string;
  value: string | number;
  unit?: string;
  accent?: "red" | "blue" | "yellow" | "default";
  subtitle?: string;
}

const accentConfig = {
  red: {
    container: "bg-accent-red/10 border-l-4 border-accent-red p-6 rounded-r-xl hover:bg-accent-red/20 transition-all",
    label: "text-accent-red",
    unit: "text-accent-red",
  },
  blue: {
    container: "bg-accent-blue/10 border-l-4 border-accent-blue p-6 rounded-r-xl hover:bg-accent-blue/20 transition-all",
    label: "text-accent-blue",
    unit: "text-accent-blue",
  },
  yellow: {
    container: "bg-accent-yellow/10 border-l-4 border-accent-yellow p-6 rounded-r-xl hover:bg-accent-yellow/20 transition-all",
    label: "text-accent-yellow",
    unit: "text-accent-yellow",
  },
  default: {
    container: "bg-accent-red/10 border-l-4 border-accent-red p-6 rounded-r-xl hover:bg-accent-red/20 transition-all",
    label: "text-accent-red",
    unit: "text-accent-red",
  },
};

export function StatBlock({ label, value, unit = "kg", accent, subtitle }: StatBlockProps) {
  if (!accent) {
    // Backward-compatible simple style
    return (
      <div className="flex flex-col">
        <span className="text-xs font-heading uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <span className="font-mono text-3xl font-bold text-text-primary">
          {value}
          <span className="text-base text-text-muted">{unit}</span>
        </span>
      </div>
    );
  }

  const config = accentConfig[accent];

  return (
    <div className={config.container}>
      <span className={`font-heading uppercase text-sm font-bold tracking-widest block mb-1 ${config.label}`}>
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-4xl md:text-5xl font-extrabold text-white">
          {value}
        </span>
        <span className={`font-mono text-xl uppercase font-bold ${config.unit}`}>
          {unit}
        </span>
      </div>
      {subtitle && (
        <span className="mt-2 text-zinc-500 font-mono text-xs block">
          {subtitle}
        </span>
      )}
    </div>
  );
}
