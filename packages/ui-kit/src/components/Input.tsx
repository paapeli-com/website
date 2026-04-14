"use client";

import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = "", ...props }, ref) => {
    const base =
      "flex h-10 w-full rounded-[var(--paapeli-radius)] border bg-paapeli-background px-3 py-2 text-sm text-paapeli-foreground placeholder:text-paapeli-muted-foreground focus-visible:outline-none focus-visible:ring-2 ring-paapeli disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

    const borderStyle = error
      ? "border-paapeli-destructive"
      : "border-paapeli-border focus-visible:border-paapeli-primary";

    return (
      <input
        ref={ref}
        className={`${base} ${borderStyle} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
