import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Search } from "lucide-react";
import { useShellT } from "@/shared/i18n/shell";

/* No search backend yet.

   This used to answer every query with the same three invented hits — a
   critical alarm, a pump with 3 days of remaining life, an online sensor —
   regardless of what was typed. The dropdown now says it has no data instead
   of naming assets that don't exist. Fill RESULT_GROUPS from the query when
   there is one; the rendering below already works off whatever it holds. */
type ResultGroup = {
  group: string;
  items: { title: string; subtitle: string }[];
};

const RESULT_GROUPS: ResultGroup[] = [];

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const t = useShellT();
  const open = focused && query.trim().length > 0;

  const handlePick = (title: string) => {
    toast.info(t(title), { description: t("Coming soon.") });
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
        placeholder={t("Search")}
        className="h-10 w-full rounded-xl border border-border bg-card text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
      />

      {open && (
        <div className="absolute z-50 mt-2 w-[420px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-popover py-2 shadow-lg ltr:left-0 rtl:right-0">
          {RESULT_GROUPS.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Nothing here yet.")}</p>
          )}
          {RESULT_GROUPS.map((g) => (
            <div key={g.group}>
              <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-2">
                {t(g.group)}
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
                    <span className="block truncate text-sm font-semibold text-foreground">{t(item.title)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{t(item.subtitle)}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          <div className="mt-1 flex items-center justify-between border-t border-border px-4 pt-3 text-sm">
            <span className="text-muted-foreground">{t("Searches every product you have access to")}</span>
            <button
              type="button"
              onClick={() => handlePick("See all results")}
              className="shrink-0 font-semibold text-primary hover:underline"
            >
              {t("See all")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
