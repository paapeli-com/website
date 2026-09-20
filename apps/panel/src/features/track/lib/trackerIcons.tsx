import type { SVGProps } from "react";
import { Car, Cat, Cpu, Dog, PersonStanding, type LucideIcon } from "lucide-react";
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
type IconProps = Omit<SVGProps<SVGSVGElement>, "size"> & { size?: number | string };

function Motorcycle({ className, size = 24, color = "currentColor", strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
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

/** Same call signature as a lucide icon, so callers can pass size/color. */
export type TrackerIconComponent = LucideIcon | typeof Motorcycle;

export const TRACKER_ICONS: { key: TrackerIconKey; labelKey: TranslationKey; Icon: TrackerIconComponent }[] = [
  { key: "cat", labelKey: "iconCat", Icon: Cat },
  { key: "dog", labelKey: "iconDog", Icon: Dog },
  { key: "car", labelKey: "iconCar", Icon: Car },
  { key: "motor", labelKey: "iconMotor", Icon: Motorcycle },
  { key: "human", labelKey: "iconHuman", Icon: PersonStanding },
];

/** The icon a device's `label` names, or undefined for any other label
    (devices registered before this existed carry their name there). */
export const trackerIconOf = (label: string | undefined) => TRACKER_ICONS.find((i) => i.key === label);

/** The tinted square a tracker is shown as in lists and headers, carrying its
    own icon. Falls back to a generic one for devices registered before the
    icon picker, whose label is their name. */
export function TrackerAvatar({
  label,
  size = 40,
  className,
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  const Icon = trackerIconOf(label)?.Icon ?? Cpu;
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary", className)}
      style={{ width: size, height: size }}
    >
      <Icon className="size-1/2" />
    </span>
  );
}
