import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { aiService } from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { useToast } from "@/features/factory/hooks/use-toast";

/* Temporary, for testing the AI pages: flip dark mode on and off TOGGLES
   times within WINDOW_MS and the gateway creates a virtual GPS tracker
   (position, altitude, speed, battery and moving/parked status) in this
   workspace, under its root location. It gets 90 days of history, then a
   reading a minute. It watches the `dark` class on <html>, so any dark-mode toggle
   counts (the host header's). Delete this file and <SecretVirtualFleet />
   in routes.tsx to remove it. */

const TOGGLES = 6;
const WINDOW_MS = 4000;

export const useSecretVirtualFleet = () => {
  const workspaceId = useWorkspaceId();
  const { options } = useAssetLocations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const toggles = useRef<number[]>([]);
  const busy = useRef(false);
  // The latest values, for the observer set up once.
  const latest = useRef({ workspaceId, options, toast, queryClient });
  latest.current = { workspaceId, options, toast, queryClient };

  useEffect(() => {
    const html = document.documentElement;
    let dark = html.classList.contains("dark");

    const fire = () => {
      const { workspaceId, options, toast, queryClient } = latest.current;
      // The tree walk starts at the root, so it is the first location.
      const root = options[0]?.id;
      if (!workspaceId || !root) {
        toast({ title: "Virtual devices", description: "No workspace or location yet.", variant: "destructive" });
        return;
      }
      busy.current = true;
      toast({ title: "Creating a virtual GPS tracker…" });
      aiService
        .createVirtualDevices(workspaceId, PRODUCT_KEY, root, ["GPS"])
        .then((made) => {
          toast({
            title: `Created ${made.map((d) => d.name).join(", ")}`,
            description: "Its history is being sent now.",
          });
          queryClient.invalidateQueries();
        })
        .catch((error) => {
          const message = error?.response?.data?.detail ?? error?.message ?? "Request failed";
          toast({ title: "Virtual devices failed", description: String(message), variant: "destructive" });
        })
        .finally(() => {
          busy.current = false;
        });
    };

    const observer = new MutationObserver(() => {
      const now = html.classList.contains("dark");
      if (now === dark) return;
      dark = now;
      const t = Date.now();
      toggles.current = [...toggles.current.filter((x) => t - x < WINDOW_MS), t];
      if (toggles.current.length >= TOGGLES && !busy.current) {
        toggles.current = [];
        fire();
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
};

/** Mount once inside the feature; renders nothing. */
export const SecretVirtualFleet = () => {
  useSecretVirtualFleet();
  return null;
};
