import { useEffect, useRef } from "react";
import { useGetMyProfileQuery, useSavePreferencesMutation } from "@paapeli/api";
import { useBrand, type AccentId } from "@/shell/BrandProvider";

const ACCENTS: AccentId[] = ["paapeli", "green"];

/**
 * Keeps the panel colour in step with the account (GET /users/me's
 * panelAccent), so a colour chosen on one device paints every other.
 *
 * The browser keeps its own copy so the first paint is right before the
 * profile answers. A colour picked in this browser before the account stored
 * one is carried up once, so nobody loses the choice they already made.
 */
export function useAccountAccent() {
  const { accent, setAccent } = useBrand();
  const { data: profile } = useGetMyProfileQuery();
  const savePreferences = useSavePreferencesMutation();
  const settled = useRef(false);

  useEffect(() => {
    if (!profile || settled.current) return;
    settled.current = true;
    const stored = profile.panelAccent;
    if (stored && ACCENTS.includes(stored as AccentId)) {
      if (stored !== accent) setAccent(stored as AccentId);
    } else if (accent !== "paapeli") {
      savePreferences.mutate({ panelAccent: accent });
    }
    // Once per profile load; later changes go through Account Settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);
}
