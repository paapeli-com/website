"use client";

import Image, { type StaticImageData } from "next/image";
import { Check } from "lucide-react";

import { LinkedText } from "@/lib/site-links";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* The card the industry and feature landings share: a photograph      */
/* that steps aside on hover to make room for the detail behind it.    */
/* Shared so the two page families move the same way rather than       */
/* drifting apart as either one is edited.                             */
/* ------------------------------------------------------------------ */

export type RevealCardCopy = {
  title: string;
  description: string;
  items: string[];
};

export function CheckList({
  items,
  tone,
  self,
}: {
  items: string[];
  tone: "light" | "dark";
  /** Current page href, so its own name is not linked back to itself. */
  self?: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-2 text-sm",
            tone === "light" ? "text-white/85" : "text-foreground/80",
          )}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <LinkedText text={item} self={self} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function RevealCard({
  card,
  image,
  self,
}: {
  card: RevealCardCopy;
  image: StaticImageData;
  self?: string;
}) {
  return (
    <div
      tabIndex={0}
      className="group relative flex h-[360px] overflow-hidden rounded-2xl bg-[hsl(215_60%_13%)] outline-none ring-primary/60 focus-visible:ring-2"
    >
      <div className="relative h-full w-full shrink-0 transition-[width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-1/5 group-focus-visible:w-1/5">
        <Image src={image} alt={card.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[hsl(215_60%_8%)]/90 via-[hsl(215_60%_8%)]/25 to-transparent"
        />
        <h3 className="absolute inset-x-0 bottom-0 p-5 text-lg font-semibold text-white transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0">
          {card.title}
        </h3>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-6 opacity-0 transition-opacity delay-200 duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
        <h3 className="text-xl font-bold text-white">{card.title}</h3>
        <p className="text-sm leading-relaxed text-white/70">
          <LinkedText text={card.description} self={self} className="font-medium text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary" />
        </p>
        <CheckList items={card.items} tone="light" self={self} />
      </div>
    </div>
  );
}
