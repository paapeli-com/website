"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* <CountUp/> : the house treatment for a headline figure.            */
/*                                                                    */
/* Give it the finished string and it counts every number inside up    */
/* from zero the first time the figure scrolls into view: "250% ROI",  */
/* "10-40%", "1.5x" all work, and the punctuation around the digits    */
/* stays put. Anything non-numeric is passed through untouched.        */
/*                                                                    */
/* The server renders the settled value, so the figure is correct      */
/* before hydration and correct again for anyone who asks for less     */
/* motion. Digits are tabular so the line does not twitch while it     */
/* climbs.                                                            */
/* ------------------------------------------------------------------ */

/** Persian and Arabic pages read their own numerals. */
const DIGITS: Record<string, string> = {
  fa: "۰۱۲۳۴۵۶۷۸۹",
  ar: "٠١٢٣٤٥٦٧٨٩",
};

const localizeDigits = (text: string, language: string) => {
  const set = DIGITS[language];
  if (!set) return text;
  return text.replace(/[0-9]/g, (digit) => set[Number(digit)]);
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Keeps the separators: "10-40%" becomes ["10", "-", "40", "%"]. */
const splitDigits = (value: string) => value.split(/(\d+(?:[.,]\d+)?)/).filter((part) => part !== "");

const isNumber = (part: string) => /^\d/.test(part);

export function CountUp({
  value,
  className,
  duration = 1600,
}: {
  value: string;
  className?: string;
  /** Milliseconds from zero to the settled figure. */
  duration?: number;
}) {
  const { language } = useLanguage();
  const ref = useRef<HTMLSpanElement>(null);
  /* 1 means settled, which is what the server renders. */
  const [progress, setProgress] = useState(1);

  const parts = useMemo(() => splitDigits(value), [value]);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Back to zero before the browser paints, so nothing flashes. */
    setProgress(0);

    let frame = 0;
    let startedAt = 0;

    const step = (now: number) => {
      if (!startedAt) startedAt = now;
      const elapsed = Math.min(1, (now - startedAt) / duration);
      /* easeOutCubic: quick off the mark, settles gently on the figure. */
      setProgress(1 - Math.pow(1 - elapsed, 3));
      if (elapsed < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  const rendered = localizeDigits(parts
    .map((part) => {
      if (!isNumber(part)) return part;
      const decimals = part.split(/[.,]/)[1]?.length ?? 0;
      return (Number(part.replace(",", ".")) * progress).toFixed(decimals);
    })
    .join(""), language);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {/*
        Arabic-Indic digits are bidi class AN, which makes a hyphen between
        two of them resolve right-to-left: "10-20%" would read "20-10%" and
        the percent sign would drift to the far side. A figure has one
        correct reading order, so it is written out in exactly that order.
      */}
      <span aria-hidden dir="ltr" style={{ unicodeBidi: "bidi-override" }}>
        {rendered}
      </span>
      <span className="sr-only">{localizeDigits(value, language)}</span>
    </span>
  );
}
