import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, CreditCard, FileText, Gauge, Gift, Plus, Settings } from "lucide-react";
import { CURRENT_USER } from "@paapeli/brand/config";

// No billing integration yet — placeholder balance to match the design.
const WALLET_BALANCE = "2,999,185";
const USAGE_ESTIMATE = "about 11 days of usage";

const MENU_ITEMS = [
  { title: "Redeem gift or credit code", icon: Gift },
  { title: "Usage & costs", icon: Gauge },
  { title: "Transactions", icon: ArrowLeftRight },
  { title: "Invoices", icon: FileText },
];

export function WalletMenu() {
  const [open, setOpen] = useState(false);
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
    toast.info(title, { description: "Coming soon." });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm transition-colors hover:bg-muted/40 lg:flex"
      >
        <CreditCard className="size-5 text-primary" />
        <span className="text-base font-bold text-foreground">{WALLET_BALANCE}</span>
        <span className="text-muted-foreground">IRR</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-popover p-5 shadow-lg ltr:right-0 rtl:left-0">
          <p className="text-sm text-muted-foreground">Workspace balance</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-foreground">{WALLET_BALANCE}</span>
            <span className="text-sm text-muted-foreground">IRR</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {CURRENT_USER.name} · {USAGE_ESTIMATE}
          </p>

          <button
            onClick={() => handlePick("Add credit")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Add credit
          </button>

          <div className="my-4 -mx-5 border-t border-border" />

          <div className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.title}
                onClick={() => handlePick(item.title)}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-start text-sm text-foreground transition-colors hover:bg-muted"
              >
                <item.icon className="size-5 text-muted-foreground" />
                {item.title}
              </button>
            ))}
          </div>

          <div className="my-4 -mx-5 border-t border-border" />

          <button
            onClick={() => handlePick("Billing & payment settings")}
            className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-start text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Settings className="size-5 text-muted-foreground" />
            Billing & payment settings
          </button>
        </div>
      )}
    </div>
  );
}
