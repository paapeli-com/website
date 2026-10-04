import { getActiveWorkspaceId } from "@paapeli/brand/workspace";

/* Sample data for the sections that have no service behind them yet: AI &
   Analytics and OTA.

   Those pages are empty for everyone, which is the truth. In the workspaces
   listed here they are filled from data/sample instead, so the pages can be
   seen laid out, and PanelLayout puts a notice above them saying the figures
   are samples and the section is being completed. The notice and the data are
   switched by the same check, so one never shows without the other.

   To remove: empty this list (or delete data/sample and this file's callers). */
const SAMPLE_WORKSPACES: string[] = [
  // Knowledge-based company evaluation account.
  "56511e7d-1b1f-4849-ba3d-153303b90e61",
];

/** Read once per page load; switching workspace reloads the page. */
export const sampleDataEnabled = (): boolean => SAMPLE_WORKSPACES.includes(getActiveWorkspaceId() ?? "");

/** The routes whose content is sample data when it is enabled. Case matters:
    every Smart Factory URL starts with the product segment "/AIoT/". */
export const isSampleRoute = (pathname: string): boolean => /\/(aiot|firmware|ota)(\/|$)/.test(pathname);
