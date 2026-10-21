import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { aiService, useGetAssetRootQuery, useProvisionAssetRootMutation } from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PRODUCT_KEY } from "@/features/track/lib/product";

/* Temporary, for testing: flip dark mode on and off TOGGLES times within
   WINDOW_MS and the gateway creates a virtual GPS tracker in this
   workspace's GPS Tracking product, under the product's root asset (made
   on demand, as DeviceForm does). It sends position, altitude, speed,
   battery and moving/parked status: 90 days of history, then a reading a
   minute. It watches the `dark` class on <html>, so any dark-mode toggle
   counts (the host header's). Delete this file and <SecretVirtualTracker />
   in routes.tsx to remove it. */

const TOGGLES = 6;
const WINDOW_MS = 4000;

export const useSecretVirtualTracker = () => {
  const workspaceId = useActiveWorkspaceId();
  const { data: root } = useGetAssetRootQuery(workspaceId ?? "", PRODUCT_KEY, !!workspaceId);
  const provisionRoot = useProvisionAssetRootMutation();
  const queryClient = useQueryClient();
  const toggles = useRef<number[]>([]);
  const busy = useRef(false);
  // The latest values, for the observer set up once.
  const latest = useRef({ workspaceId, root, provisionRoot, queryClient });
  latest.current = { workspaceId, root, provisionRoot, queryClient };

  useEffect(() => {
    const html = document.documentElement;
    let dark = html.classList.contains("dark");

    const fire = async () => {
      const { workspaceId, root, provisionRoot, queryClient } = latest.current;
      if (!workspaceId) {
        toast.error("No workspace yet.");
        return;
      }
      busy.current = true;
      toast.loading("Creating a virtual GPS tracker…");
      try {
        const assetId = root?.id ?? (await provisionRoot.mutateAsync({ workspaceId, productKey: PRODUCT_KEY })).id;
        const made = await aiService.createVirtualDevices(workspaceId, PRODUCT_KEY, assetId, ["GPS"]);
        toast.success(`Created ${made.map((d) => d.name).join(", ")}; its history is being sent now.`);
        queryClient.invalidateQueries();
      } catch (error) {
        toast.error(apiErrorMessage(error, "Virtual tracker failed"));
      } finally {
        busy.current = false;
      }
    };

    const observer = new MutationObserver(() => {
      const now = html.classList.contains("dark");
      if (now === dark) return;
      dark = now;
      const t = Date.now();
      toggles.current = [...toggles.current.filter((x) => t - x < WINDOW_MS), t];
      if (toggles.current.length >= TOGGLES && !busy.current) {
        toggles.current = [];
        void fire();
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
};

/** Mount once inside the feature; renders nothing. */
export const SecretVirtualTracker = () => {
  useSecretVirtualTracker();
  return null;
};
