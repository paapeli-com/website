import { ElementType, HTMLAttributes } from "react";

export type TextVariant = "h1" | "h2" | "h3" | "h4" | "body" | "small" | "muted";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: ElementType;
}

const variantStyles: Record<TextVariant, string> = {
  h1: "text-4xl font-bold tracking-tight text-paapeli-foreground",
  h2: "text-3xl font-semibold tracking-tight text-paapeli-foreground",
  h3: "text-2xl font-semibold text-paapeli-foreground",
  h4: "text-xl font-medium text-paapeli-foreground",
  body: "text-base text-paapeli-foreground",
  small: "text-sm text-paapeli-foreground",
  muted: "text-sm text-paapeli-muted-foreground",
};

const defaultTags: Record<TextVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body: "p",
  small: "p",
  muted: "p",
};

export function Text({ variant = "body", as, className = "", ...props }: TextProps) {
  const Tag = as ?? defaultTags[variant];
  return <Tag className={`${variantStyles[variant]} ${className}`} {...props} />;
}
