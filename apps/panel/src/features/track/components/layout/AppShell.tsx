import { Outlet } from "react-router-dom";

/* Header/sidebar/idle-watch now live in the host shell (apps/panel/host) —
   this remote only renders its routed page content. */
export function AppShell() {
  return (
    <div className="h-full overflow-y-auto">
      <Outlet />
    </div>
  );
}
