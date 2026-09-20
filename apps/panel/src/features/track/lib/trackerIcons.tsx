import type { SVGProps } from "react";
import { Car, Cat, Dog, PersonStanding, type LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/features/track/i18n/translations";
import { cn } from "@/shared/lib/utils";

/* What a tracker is attached to, chosen when it is registered.
 *
 * The API has no field for this, so the key is stored in the device's `label`
 * (which the create call requires anyway, and which this product doesn't show
 * as text). Read it back with `trackerIconOf(device.label)` — e.g. to pick the
 * marker on the Live Map. Keys are stored as-is, so never rename one. */

export type TrackerIconKey = "cat" | "dog" | "car" | "motor" | "human";

/** Lucide has no motorcycle, so this one is drawn in its style (24px grid,
    2px round strokes, currentColor) to sit alongside the others. */
function Motorcycle({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide", className)}
      {...props}
    >
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M5 17h4l3-5h4l3 5" />
      <path d="M8 12h4" />
      <path d="M16 12 14.5 7H17" />
    </svg>
  );
}

export const TRACKER_ICONS: { key: TrackerIconKey; labelKey: TranslationKey; Icon: LucideIcon | typeof Motorcycle }[] = [
  { key: "cat", labelKey: "iconCat", Icon: Cat },
  { key: "dog", labelKey: "iconDog", Icon: Dog },
  { key: "car", labelKey: "iconCar", Icon: Car },
  { key: "motor", labelKey: "iconMotor", Icon: Motorcycle },
  { key: "human", labelKey: "iconHuman", Icon: PersonStanding },
];

/** The icon a device's `label` names, or undefined for any other label
    (devices registered before this existed carry their name there). */
export const trackerIconOf = (label: string | undefined) => TRACKER_ICONS.find((i) => i.key === label);
