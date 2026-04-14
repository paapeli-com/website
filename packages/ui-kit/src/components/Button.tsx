"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-paapeli-primary text-paapeli-primary-foreground hover:opacity-90",
  secondary:
    "bg-paapeli-secondary text-paapeli-primary-foreground hover:opacity-90",
  outline:
    "border border-paapeli-border text-paapeli-foreground bg-transparent hover:bg-paapeli-muted",
  ghost:
    "bg-transparent text-paapeli-foreground hover:bg-paapeli-muted",
  destructive:
    "bg-paapeli-destructive text-paapeli-primary-foreground hover:opacity-90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-[var(--paapeli-radius)] font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 ring-paapeli disabled:pointer-events-none disabled:opacity-50";

    return (
      <button
        ref={ref}
        className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
