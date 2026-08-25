import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Search } from "lucide-react";

/* Mock result set — no real search backend yet. Shown for any non-empty
   query so the interaction/design can be reviewed before wiring it up. */
const RESULT_GROUPS = [
  {
    group: "Alarms",
    items: [{ title: "High Temperature Alarm", subtitle: "Active · Critical" }],
  },
  {
    group: "AI Assets",
    items: [{ title: "Pump P101 — failure predicted", subtitle: "RUL 3 days" }],
  },
  {
    group: "Devices",
    items: [{ title: "Temp Sensor TS-04", subtitle: "Smart Factory · online" }],
  },
];

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const open = focused && query.trim().length > 0;

  const handlePick = (title: string) => {
    toast.info(title, { description: "Coming soon." });
    setFocused(false);
  };

  return (
    <div className="relative hidden w-64 md:block lg:w-72">
      <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3.5 rtl:right-3.5" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        // Delay so a click on a result registers before the dropdown unmounts.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search"
        className="h-10 w-full rounded-xl border border-border bg-card text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
      />

      {open && (
        <div className="absolute z-50 mt-2 w-[420px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-popover py-2 shadow-lg ltr:left-0 rtl:right-0">
          {RESULT_GROUPS.map((g) => (
            <div key={g.group}>
              <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-2">
                {g.group}
              </div>
              {g.items.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handlePick(item.title)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-muted"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                    <AlertTriangle className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          <div className="mt-1 flex items-center justify-between border-t border-border px-4 pt-3 text-sm">
            <span className="text-muted-foreground">Searches every product you have access to</span>
            <button
              type="button"
              onClick={() => handlePick("See all results")}
              className="shrink-0 font-semibold text-primary hover:underline"
            >
              See all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
