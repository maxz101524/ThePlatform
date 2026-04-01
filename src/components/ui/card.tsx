import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark";
}

export function Card({ variant = "light", className = "", children, ...props }: CardProps) {
  const variants = {
    light: "bg-white border border-zinc-200 rounded-xl shadow-sm",
    dark: "bg-bg-dark-elevated border border-white/5 rounded-xl",
  };

  return (
    <div
      className={`p-4 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
