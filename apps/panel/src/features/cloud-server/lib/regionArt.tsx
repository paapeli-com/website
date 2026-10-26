/* The pictures on a region card: the country's outline behind it and its
 * flag beside the name. Inline SVG, drawn here, so a card needs no image
 * request. The outline is simplified from the border's longitude and latitude
 * (x = lon - 44, y = 39.8 - lat, scaled by 5): a silhouette to recognise, not
 * a map to measure.
 *
 * One entry per country a region can be in. A country without an entry shows
 * no outline and no flag.
 */

const OUTLINES: Record<string, { viewBox: string; points: string }> = {
  IR: {
    viewBox: "0 0 97 75",
    points: [
      "0,2 4,0.5 12.5,4.5 20,4.5 24.5,7 25,11 31.5,13 37.5,15 49.5,14.5 50,12.5",
      "57,9.5 66.5,8 76,11.5 82,16 86,16 85,23 82.5,28.5 84.5,31.5 83,42",
      "88.5,42.5 89,45 84.5,50 87,52.5 92.5,57.5 96.5,63 94,67 88,73",
      "75,72 66.5,70 64.5,64.5 61.5,63 57.5,65.5 51,65.5 45,64 37.5,59.5",
      "34,54.5 30.5,48.5 25,47 22.5,49.5 20,46.5 18.5,44 18.5,37.5 10.5,34",
      "7,29.5 8,26 9.5,23.5 10.5,20.5 7,19 4,13 1,9.5 2,7",
    ].join(" "),
  },
};

export function CountryOutline({ country, className }: { country: string; className?: string }) {
  const outline = OUTLINES[country];
  if (!outline) return null;
  return (
    <svg viewBox={outline.viewBox} aria-hidden className={className} fill="currentColor">
      <polygon points={outline.points} strokeLinejoin="round" />
    </svg>
  );
}

export function CountryFlag({ country, className }: { country: string; className?: string }) {
  if (country !== "IR") return null;
  /* Green, white, red. The emblem and the takbir bands are left out at this
     size, where they would be a smudge. */
  return (
    <svg viewBox="0 0 30 18" aria-hidden className={className}>
      <rect width="30" height="6" fill="#239F40" />
      <rect y="6" width="30" height="6" fill="#FFFFFF" />
      <rect y="12" width="30" height="6" fill="#DA0000" />
      <circle cx="15" cy="9" r="1.6" fill="#DA0000" />
      <rect width="30" height="18" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6" />
    </svg>
  );
}
