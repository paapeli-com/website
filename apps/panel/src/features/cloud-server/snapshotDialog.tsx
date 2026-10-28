import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/factory/components/ui/dialog";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { IMAGE_GB_MONTHLY, SNAPSHOT_GB_MONTHLY } from "./lib/catalog";
import { useServers } from "./lib/serverStore";
import { takeSnapshot, type SnapshotRecord } from "./lib/snapshotStore";
import { addImageFromSnapshot, snapshotFamily } from "./lib/imageStore";
import { Note } from "./wizard";

/* New snapshot: a server and a name, nothing else. Opened from the Snapshots
 * page, or from a server's menu with that server already chosen. A running
 * server is snapshotted as it is; the popup says that turning it off first
 * keeps the data consistent, and shows it when the chosen server is on.
 */

const NAME_RE = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;

export function CreateSnapshotDialog({
  open,
  onClose,
  serverId: initialServerId,
  region,
  onTaken,
}: {
  open: boolean;
  onClose: () => void;
  serverId?: string;
  /** Offer only the servers in this region. */
  region?: string;
  onTaken?: (snapshot: SnapshotRecord) => void;
}) {
  const t = useT();
  const { formatNumber } = useLanguage();
  const { currency, format } = useBillingCurrency();
  const servers = useServers().filter((s) => !region || s.region === region);
  const [serverId, setServerId] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [tried, setTried] = useState(false);
  const server = servers.find((s) => s.id === serverId);

  useEffect(() => {
    if (!open) return;
    setServerId(initialServerId ?? "");
    setNameTouched(false);
    setTried(false);
  }, [open, initialServerId]);
  useEffect(() => {
    if (!nameTouched) setName(server ? `${server.name}-snapshot` : "");
  }, [server, nameTouched]);

  const sizeGb = server ? (server.disks?.[0]?.sizeGb ?? server.diskGb) : 0;
  const nameOk = NAME_RE.test(name);

  const submit = () => {
    setTried(true);
    if (!server || !nameOk) return;
    const taken = takeSnapshot({ name, serverId: server.id, region: server.region, zone: server.zone, sizeGb });
    toast.success(t("Taking a snapshot of {name}", { name: server.name }));
    onTaken?.(taken);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Create snapshot")}</DialogTitle>
          <DialogDescription>{t("A copy of a server's main disk as it is now, to restore later.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <FieldLabel required>{t("Server")}</FieldLabel>
            <Select value={serverId} onValueChange={setServerId} disabled={servers.length === 0}>
              <SelectTrigger className={cn(tried && !server && "border-destructive")}>
                <SelectValue placeholder={servers.length === 0 ? t("No servers yet") : t("Choose a server")} />
              </SelectTrigger>
              <SelectContent>
                {servers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span dir="ltr">{s.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {t(s.region)} / {s.zone}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tried && !server && <p className="mt-1.5 text-xs text-destructive">{t("Choose a server to take a snapshot of.")}</p>}
          </div>
          <div>
            <FieldLabel required htmlFor="snapshot-name">
              {t("Snapshot name")}
            </FieldLabel>
            <Input
              id="snapshot-name"
              dir="ltr"
              value={name}
              placeholder="web-01-snapshot"
              onChange={(e) => {
                setNameTouched(true);
                setName(e.target.value.toLowerCase());
              }}
              className={cn(tried && !nameOk && "border-destructive")}
            />
            <p className={cn("mt-1.5 text-xs", tried && !nameOk ? "text-destructive" : "text-muted-foreground")}>
              {tried && !nameOk
                ? t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")
                : t("Lowercase letters, digits and hyphens; 3 to 63 characters.")}
            </p>
          </div>

          <Note>
            <ul className="list-disc space-y-1 ps-4">
              <li>{t("For consistent data, turn the server off before taking the snapshot.")}</li>
              <li>{t("Only the server's main disk is saved.")}</li>
            </ul>
          </Note>
          {server?.powerOn && (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-px size-4 shrink-0" />
              <span>{t("{name} is on. Files being written now may not be saved whole.", { name: server.name })}</span>
            </div>
          )}

          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">{t("Price per GB")}</span>
            <span className="font-medium text-foreground">
              {format(SNAPSHOT_GB_MONTHLY[currency])} <span className="font-normal text-muted-foreground">{t("/ month")}</span>
            </span>
          </div>
          {server && (
            <p className="-mt-2 text-xs text-muted-foreground">
              {t("{size} GB for this server: {amount} a month", {
                size: formatNumber(sizeGb),
                amount: format(sizeGb * SNAPSHOT_GB_MONTHLY[currency]),
              })}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit} disabled={servers.length === 0}>
            {t("Create snapshot")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Save as image: a snapshot belongs to its server and goes when the server
 * is deleted. An image saved from it is the account's own, kept until it is
 * deleted, and new servers and Auto Scale groups can be made from it. In
 * Glance both are images; this one is kept apart from the server.
 */
export function SaveAsImageDialog({ snapshot, onClose }: { snapshot: SnapshotRecord | null; onClose: () => void }) {
  const t = useT();
  const { formatNumber } = useLanguage();
  const { currency, format } = useBillingCurrency();
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!snapshot) return;
    setName(`${snapshot.name.replace(/-snapshot$/, "")}-image`.slice(0, 63));
    setTried(false);
  }, [snapshot]);
  const nameOk = NAME_RE.test(name);

  const submit = () => {
    setTried(true);
    if (!snapshot || !nameOk) return;
    addImageFromSnapshot({
      name,
      snapshotId: snapshot.id,
      snapshotName: snapshot.name,
      region: snapshot.region,
      osFamily: snapshotFamily(snapshot.serverId),
      sizeGb: snapshot.sizeGb,
    });
    toast.success(t("Saving {name} as an image", { name: snapshot.name }));
    onClose();
  };

  return (
    <Dialog open={!!snapshot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Save as image")}</DialogTitle>
          <DialogDescription>
            {t("An image is kept after its server is deleted. New servers and Auto Scale groups can be made from it.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <FieldLabel required htmlFor="image-name">
              {t("Image name")}
            </FieldLabel>
            <Input
              id="image-name"
              dir="ltr"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              className={cn(tried && !nameOk && "border-destructive")}
            />
            <p className={cn("mt-1.5 text-xs", tried && !nameOk ? "text-destructive" : "text-muted-foreground")}>
              {tried && !nameOk
                ? t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")
                : t("Lowercase letters, digits and hyphens; 3 to 63 characters.")}
            </p>
          </div>
          <Note>{t("The snapshot stays as it is. Delete it if you no longer need it.")}</Note>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">{t("Price per GB")}</span>
            <span className="font-medium text-foreground">
              {format(IMAGE_GB_MONTHLY[currency])} <span className="font-normal text-muted-foreground">{t("/ month")}</span>
            </span>
          </div>
          {snapshot && (
            <p className="-mt-2 text-xs text-muted-foreground">
              {t("{size} GB for this image: {amount} a month", {
                size: formatNumber(snapshot.sizeGb),
                amount: format(snapshot.sizeGb * IMAGE_GB_MONTHLY[currency]),
              })}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit}>{t("Save as image")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
