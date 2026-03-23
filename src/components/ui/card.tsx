import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border bg-bg-surface p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
