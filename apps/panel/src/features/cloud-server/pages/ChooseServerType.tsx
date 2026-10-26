import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info, Layers, Server, type LucideIcon } from "lucide-react";
import { Card } from "@/features/factory/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { CLOUD_SERVER_BASE } from "@/shell/nav/cloudServerNav";
import { useT } from "../i18n";
import { CREATE_SERVER_PATH, CreateFooter, CreateHeader, CreatePage, SERVERS_PATH } from "../ui";

/* The first page of Create cloud server: one machine, or a managed group of
 * them. One machine continues into the wizard. An Auto Scale group belongs to
 * the Auto Scale section, whose own create flow is not designed yet, so it
 * goes there.
 */

type Kind = "single" | "group";

const AUTO_SCALE_PATH = `${CLOUD_SERVER_BASE}/auto-scale`;

export default function ChooseServerType() {
  const t = useT();
  const navigate = useNavigate();
  const [kind, setKind] = useState<Kind>("single");

  return (
    <CreatePage>
      <CreateHeader description={t("Choose how you want to create your cloud workload.")} />

      <Card className="p-4">
        <div role="radiogroup" className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          <KindCard
            icon={Server}
            title={t("Single virtual machine")}
            description={t("One server with its own configuration.")}
            selected={kind === "single"}
            onSelect={() => setKind("single")}
          />
          <KindCard
            icon={Layers}
            title={t("Auto Scale group")}
            description={t("A managed group of servers that grows and shrinks with load.")}
            selected={kind === "group"}
            onSelect={() => setKind("group")}
          />
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-px size-4 shrink-0" />
          {t("You can also create Auto Scale groups later from the Auto Scale section.")}
        </p>
      </Card>

      <CreateFooter
        cancel={{ label: t("Cancel"), onClick: () => navigate(SERVERS_PATH) }}
        primary={{
          label: t("Continue"),
          onClick: () => navigate(kind === "single" ? CREATE_SERVER_PATH : AUTO_SCALE_PATH),
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
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center rounded-xl border px-6 py-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
        selected ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:border-primary/30 hover:bg-muted/30",
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
          "flex size-14 items-center justify-center rounded-full",
          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-6" />
      </span>
      <span className="mt-4 text-base font-semibold text-foreground">{title}</span>
      <span className="mt-1 text-sm text-muted-foreground">{description}</span>
    </button>
  );
}
