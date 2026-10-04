import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, CreditCard, FileText, Gauge, Gift, Plus, Settings } from "lucide-react";
import { useDisplayName } from "@/shared/hooks/useDisplayName";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";
import { cn } from "@/shared/lib/utils";
import { menuRowBase, menuRowIdle } from "@/shell/menuRow";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";

/* No billing integration yet.

   The header used to show a fixed "2,999,185 IRR" with "about 11 days of
   usage" — a specific enough figure to be read as this workspace's real
   credit, in the header of every page. Both are null until the balance is
   fetched; set WALLET_BALANCE from the API and the formatting below applies
   to it unchanged.

   The currency beside it was a fixed "IRR". It comes from the account now,
   like every other amount in the panel, so the header cannot disagree with
   the billing page. */
const WALLET_BALANCE: string | null = null;
const USAGE_ESTIMATE: string | null = null;

const MENU_ITEMS = [
  { title: "Redeem gift or credit code", icon: Gift },
  { title: "Usage & costs", icon: Gauge },
  { title: "Transactions", icon: ArrowLeftRight },
  { title: "Invoices", icon: FileText },
];

export function WalletMenu() {
  const [open, setOpen] = useState(false);
  const displayName = useDisplayName();
  const language = useAppLanguage();
  const t = useShellT();
  const { name: currency } = useBillingCurrency();
  const balance = WALLET_BALANCE === null ? null : localizeDigits(language, WALLET_BALANCE);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handlePick = (title: string) => {
    toast.info(t(title), { description: t("Coming soon.") });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm transition-colors hover:bg-muted/40 lg:flex"
      >
        <CreditCard className="size-5 text-primary" />
        {balance === null ? (
          <span className="sr-only">{t("Workspace balance")}</span>
        ) : (
          <>
            <span className="text-base font-bold text-foreground">{balance}</span>
            <span className="text-muted-foreground">{currency}</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-popover p-5 shadow-lg ltr:right-0 rtl:left-0">
          <p className="text-sm text-muted-foreground">{t("Workspace balance")}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            {balance === null ? (
              <span className="text-lg font-semibold text-muted-foreground">—</span>
            ) : (
              <>
                <span className="text-3xl font-bold text-foreground">{balance}</span>
                <span className="text-sm text-muted-foreground">{currency}</span>
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {[displayName, USAGE_ESTIMATE && t(USAGE_ESTIMATE)]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <button
            onClick={() => handlePick("Add credit")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            {t("Add credit")}
          </button>

          <div className="my-4 -mx-5 border-t border-border" />

          <div className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.title}
                onClick={() => handlePick(item.title)}
                className={cn(menuRowBase, menuRowIdle)}
              >
                <item.icon className="size-5 text-muted-foreground" />
                {t(item.title)}
              </button>
            ))}
          </div>

          <div className="my-4 -mx-5 border-t border-border" />

          <button
            onClick={() => handlePick("Billing & payment settings")}
            className={cn(menuRowBase, menuRowIdle)}
          >
            <Settings className="size-5 text-muted-foreground" />
            {t("Billing & payment settings")}
          </button>
        </div>
      )}
    </div>
  );
}
