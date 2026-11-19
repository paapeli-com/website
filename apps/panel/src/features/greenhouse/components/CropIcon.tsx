import { Sprout } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/* A crop drawn the way a grower recognises it at a glance. The library's crops
   each have their own; a custom crop, or one added to the library later
   without a drawing, gets a sprout. Colours are the crop's own, so they read
   the same in light and dark themes. */

const DRAWINGS: Record<string, JSX.Element> = {
  tomato: (
    <>
      <circle cx="16" cy="18" r="11" fill="#E5484D" />
      <ellipse cx="12" cy="15" rx="3" ry="2" fill="#fff" opacity=".28" />
      <path d="M16 7.5l2.2 2.6 3.3-.8-1.6 3 2.6 2-3.4.2L16 17l-3.1-2.5-3.4-.2 2.6-2-1.6-3 3.3.8z" fill="#2F9E44" />
      <path d="M16 8V4.5" stroke="#2F9E44" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  cucumber: (
    <>
      <rect x="4" y="11" width="24" height="10" rx="5" fill="#2F9E44" transform="rotate(-30 16 16)" />
      <rect x="6" y="13" width="18" height="3" rx="1.5" fill="#8CE99A" opacity=".55" transform="rotate(-30 16 16)" />
      <g fill="#1B6E2E">
        <circle cx="12" cy="20" r=".9" />
        <circle cx="16" cy="17.5" r=".9" />
        <circle cx="20" cy="15" r=".9" />
        <circle cx="14" cy="15" r=".9" />
        <circle cx="18.5" cy="19" r=".9" />
      </g>
      <path d="M25 8.5l2.5-1.5" stroke="#5C940D" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  strawberry: (
    <>
      <path d="M16 29C9 25 5.5 18.5 7 13.5c1-3.3 5-4.3 9-2.8 4-1.5 8-.5 9 2.8 1.5 5-2 11.5-9 15.5z" fill="#E03131" />
      <g fill="#FFE066">
        <ellipse cx="12" cy="16" rx=".7" ry="1" />
        <ellipse cx="16" cy="15" rx=".7" ry="1" />
        <ellipse cx="20" cy="16" rx=".7" ry="1" />
        <ellipse cx="14" cy="20" rx=".7" ry="1" />
        <ellipse cx="18" cy="20" rx=".7" ry="1" />
        <ellipse cx="16" cy="24.5" rx=".7" ry="1" />
      </g>
      <path d="M16 11.5c-2-3-5-3.5-7-2.5 2 .3 3.5 1.3 4.2 2.8-2.2-.2-3.7.6-4.4 2 2.6-1.2 5.2-1.1 7.2-.2 2-.9 4.6-1 7.2.2-.7-1.4-2.2-2.2-4.4-2 .7-1.5 2.2-2.5 4.2-2.8-2-1-5-.5-7 2.5z" fill="#2F9E44" />
      <path d="M16 10V5.5" stroke="#2F9E44" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  pepper: (
    <>
      <path d="M8 14c0-3 2.5-4.5 4.5-4 1.2.3 2.3.3 3.5 0s2.3-.3 3.5 0c2 .5 4.5 1 4.5 4 0 4.5-1 9-2.5 12-1 2-2.5 2.5-3.5 1.2-.7-.9-1.3-.9-2 0-.7.9-1.3.9-2 0-1 1.3-2.5.8-3.5-1.2C9 23 8 18.5 8 14z" fill="#F76707" />
      <path d="M12 12.5c-.8 3-.8 8 .5 12" stroke="#FFC078" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
      <path d="M13.5 9.8c.5-1.5 1.5-2.3 2.5-2.3s2 .8 2.5 2.3" fill="#2F9E44" />
      <path d="M16 7.5c0-2 .8-3.5 2.5-4" stroke="#2F9E44" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  lettuce: (
    <>
      <path d="M5 19c0-6 5-11 11-11s11 5 11 11c0 4.5-4.5 8-11 8S5 23.5 5 19z" fill="#69DB7C" />
      <path d="M9 20c0-4.5 3-8 7-8s7 3.5 7 8c0 3.3-3 5.5-7 5.5S9 23.3 9 20z" fill="#40C057" />
      <path d="M12.5 21c0-2.5 1.5-4.5 3.5-4.5s3.5 2 3.5 4.5-1.5 3-3.5 3-3.5-.5-3.5-3z" fill="#8CE99A" />
      <path d="M16 26.5V15M16 20l-4-3M16 20l4-3" stroke="#2B8A3E" strokeWidth="1.1" strokeLinecap="round" opacity=".7" />
    </>
  ),
  basil: (
    <>
      <path d="M16 29V13" stroke="#2B8A3E" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 18c-1-5-5-8-10-7 0 5 4 8 10 7z" fill="#40C057" />
      <path d="M16 15c1-5 5-8 10-7 0 5-4 8-10 7z" fill="#2F9E44" />
      <path d="M16 13c-1.5-3-1-6 0-8.5 1 2.5 1.5 5.5 0 8.5z" fill="#69DB7C" />
      <path d="M6 11c3 1 6.5 3.5 10 7M26 8c-3 1-6.5 3.5-10 7" stroke="#1B6E2E" strokeWidth=".8" opacity=".6" fill="none" />
    </>
  ),
};

export function CropIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const drawing = icon ? DRAWINGS[icon] : undefined;
  if (!drawing) return <Sprout className={cn("text-emerald-600", className)} aria-hidden />;
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      {drawing}
    </svg>
  );
}

/** The icon a library crop draws with, for the crops the picker offers. */
export const CROP_ICONS = Object.keys(DRAWINGS);
