import { HTMLAttributes } from "react";

export type BadgeVariant = "primary" | "secondary" | "outline" | "destructive" | "muted";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-paapeli-primary text-paapeli-primary-foreground",
  secondary: "bg-paapeli-secondary text-paapeli-primary-foreground",
  outline: "border border-paapeli-border text-paapeli-foreground bg-transparent",
  destructive: "bg-paapeli-destructive text-paapeli-primary-foreground",
  muted: "bg-paapeli-muted text-paapeli-muted-foreground",
};

export function Badge({ variant = "primary", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
