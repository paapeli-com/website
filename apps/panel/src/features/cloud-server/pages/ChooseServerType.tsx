import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Cpu, Disc, HardDrive, Info, Layers, MemoryStick, Server, Shapes, Waypoints, type LucideIcon } from "lucide-react";
import { Card } from "@/features/factory/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { CLOUD_SERVER_BASE } from "@/shell/nav/cloudServerNav";
import { useT } from "../i18n";
import { CREATE_SERVER_PATH, CreateFooter, CreateHeader, CreatePage, SERVERS_PATH } from "../ui";

/* The first page of Create cloud server: one machine, or a managed group of
 * them. Laid out like the wizard that follows (choices beside the price and
 * summary column) so the column is already in place when the steps begin;
 * here it only names the type, since nothing else is chosen yet.
 *
 * One machine continues into the wizard. An Auto Scale group belongs to the
 * Auto Scale section, whose own create flow is not designed yet, so it goes
 * there.
 */

type Kind = "single" | "group";

const AUTO_SCALE_PATH = `${CLOUD_SERVER_BASE}/auto-scale`;

export default function ChooseServerType() {
  const t = useT();
  const navigate = useNavigate();
  const [kind, setKind] = useState<Kind>("single");
  const proceed = (next: Kind) => navigate(next === "single" ? CREATE_SERVER_PATH : AUTO_SCALE_PATH);
  const [noteBefore, noteAfter = ""] = t("You can also create Auto Scale groups later from the {link}.").split("{link}");

  return (
    <CreatePage>
      <CreateHeader description={t("Choose how you want to create your cloud workload.")} />

      {/* Stretched rows: the two choices take the whole width and height up
          to the price column, so there is no empty band beside them. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col">
          <div role="radiogroup" className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <KindCard
              icon={Server}
              title={t("Single virtual machine")}
              description={t("One server with its own configuration.")}
              selected={kind === "single"}
              onSelect={() => setKind("single")}
              onConfirm={() => proceed("single")}
            />
            <KindCard
              icon={Layers}
              title={t("Auto Scale group")}
              description={t("A managed group of servers that grows and shrinks with load.")}
              selected={kind === "group"}
              onSelect={() => setKind("group")}
              onConfirm={() => proceed("group")}
            />
          </div>

          {/* Only for the group: it says where else a group can be made. Its
              space is kept when it is hidden, so the cards above, which
              stretch to fill the column, keep their size as the choice
              changes. */}
          <div
            aria-hidden={kind !== "group"}
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-lg bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground",
              kind !== "group" && "invisible",
            )}
          >
            <Info className="mt-px size-4 shrink-0" />
            {/* One sentence with the link inside it, split where {link} falls,
                since the link sits in a different place in each language. */}
            <span>
              {noteBefore}
              <button
                type="button"
                tabIndex={kind === "group" ? 0 : -1}
                onClick={() => navigate(AUTO_SCALE_PATH)}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {t("Auto Scale section")}
              </button>
              {noteAfter}
            </span>
          </div>
        </div>

        {/* The wizard's price and summary column, empty until the server is
            configured. */}
        <aside>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("Estimated price")}</p>
            <div className="mt-2 flex items-center gap-1.5" aria-label={t("Not chosen yet")}>
              <span className="h-1 w-4 rounded-full bg-muted-foreground/30" />
              <span className="h-1 w-4 rounded-full bg-muted-foreground/30" />
              <span className="h-1 w-4 rounded-full bg-muted-foreground/30" />
              <span className="ms-1 text-sm text-muted-foreground">{t("/ month")}</span>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <SummaryLine
                icon={Shapes}
                label={t("Type")}
                value={kind === "single" ? t("Single virtual machine") : t("Auto Scale group")}
              />
              <SummaryLine icon={Cpu} label={t("vCPU")} />
              <SummaryLine icon={MemoryStick} label={t("RAM")} />
              <SummaryLine icon={HardDrive} label={t("Disk")} />
              <SummaryLine icon={Waypoints} label={t("Traffic")} />
              <SummaryLine icon={Disc} label={t("Operating system")} />
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
              <Info className="mt-px size-4 shrink-0" />
              <span>{t("The price and details appear as you configure the server.")}</span>
            </div>
          </Card>
        </aside>
      </div>

      <CreateFooter
        cancel={{ label: t("Cancel"), onClick: () => navigate(SERVERS_PATH) }}
        primary={{
          label: t("Continue"),
          onClick: () => proceed(kind),
        }}
      />
    </CreatePage>
  );
}

function KindCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
  onConfirm,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  /** A double-click picks the card and moves on, as Continue would. */
  onConfirm: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onDoubleClick={onConfirm}
      className={cn(
        "relative flex min-h-[18rem] flex-col items-center justify-center rounded-xl border bg-card px-6 py-12 text-center shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
        selected ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30",
      )}
    >
      <span
        className={cn(
          "absolute end-3 top-3 flex size-5 items-center justify-center rounded-full border",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {selected && <Check className="size-3.5" />}
      </span>
      <span
        className={cn(
          "flex size-20 items-center justify-center rounded-full",
          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-9" />
      </span>
      <span className="mt-6 text-lg font-semibold text-foreground">{title}</span>
      <span className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</span>
    </button>
  );
}

function SummaryLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("ms-auto min-w-0 truncate text-end", value ? "font-medium text-foreground" : "text-muted-foreground")}>
        {value ?? "-"}
      </span>
    </div>
  );
}
