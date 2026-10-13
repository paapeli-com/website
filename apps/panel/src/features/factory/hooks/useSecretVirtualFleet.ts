import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { aiService } from "@paapeli/api";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";
import { useToast } from "@/features/factory/hooks/use-toast";

/* Temporary, for testing the AI pages: flip dark mode on and off TOGGLES
   times within WINDOW_MS and the gateway creates one virtual GPS tracker of
   each scenario in this workspace, under its root location. The trackers get
   90 days of history and the AI analyzes them once it is in, a few minutes
   later. Delete this hook and its one call in PanelLayout to remove it. */

const TOGGLES = 6;
const WINDOW_MS = 4000;

export const useSecretVirtualFleet = () => {
  const workspaceId = useWorkspaceId();
  const { options } = useAssetLocations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const toggles = useRef<number[]>([]);
  const busy = useRef(false);

  return useCallback(() => {
    const now = Date.now();
    toggles.current = [...toggles.current.filter((t) => now - t < WINDOW_MS), now];
    if (toggles.current.length < TOGGLES || busy.current) return;
    toggles.current = [];

    // The walk starts at the root, so it is the first location.
    const root = options[0]?.id;
    if (!workspaceId || !root) {
      toast({ title: "Virtual devices", description: "No workspace or location yet.", variant: "destructive" });
      return;
    }
    busy.current = true;
    aiService
      .createVirtualDevices(workspaceId, PRODUCT_KEY, root)
      .then((made) => {
        toast({
          title: `${made.length} virtual GPS trackers created`,
          description: "History is being sent now; the AI analyzes them in a few minutes.",
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
  }, [workspaceId, options, toast, queryClient]);
};
