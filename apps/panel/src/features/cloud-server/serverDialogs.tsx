import { useEffect, useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useT } from "./i18n";
import { removeServers, renameServer, SERVER_NAME_RE, type ServerRecord } from "./lib/serverStore";
import { apiCall, ApiError } from "./lib/openstackErrors";
import { detachFrom } from "./lib/ipStore";
import { releaseFromServers, useFloatingIps } from "./lib/floatingStore";
import { deleteBackupsOf, useBackups } from "./lib/backupStore";
import { deleteSnapshotsOf, useSnapshots } from "./lib/snapshotStore";
import { releaseVolumesOf, useVolumes } from "./lib/volumeStore";
import { releaseServersFromFirewalls } from "./lib/firewallStore";
import { releaseServersFromNetworks } from "./lib/networkStore";
import { releaseServersFromLoadBalancers } from "./lib/loadBalancerStore";
import { deletePhraseOk, TypeToConfirm } from "./ui";

/* A server's delete and rename, the same from the server list and from the
 * server's own page. Deleting goes through deleteServers, so what goes with
 * a server (its addresses, disks, backups, snapshots, its place in firewalls,
 * networks and load balancers) is let go in one place. */

/** Deletes servers and lets go of everything they hold. A locked server is
    refused, as Nova refuses it. */
export function deleteServers(servers: ServerRecord[]) {
  const locked = servers.find((s) => s.locked);
  if (locked) throw new ApiError(409, "InstanceIsLocked", "", {}, true);
  const ids = servers.map((s) => s.id);
  detachFrom(ids);
  releaseFromServers(ids);
  deleteBackupsOf(ids);
  deleteSnapshotsOf(ids);
  releaseVolumesOf(ids);
  releaseServersFromFirewalls(ids);
  releaseServersFromNetworks(ids);
  releaseServersFromLoadBalancers(ids);
  removeServers(ids);
}

/** The delete confirmation: per server, the addresses and disks deleted with
    it, any reserved IP that stays, and a tick before Delete is offered. */
export function DeleteServersDialog({
  servers,
  onClose,
  onDeleted,
}: {
  servers: ServerRecord[];
  onClose: () => void;
  onDeleted: (ids: string[]) => void;
}) {
  const t = useT();
  const { t: ft, isRTL, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const [phrase, setPhrase] = useState("");
  const floatingIps = useFloatingIps();
  const backups = useBackups();
  const snapshots = useSnapshots();
  const volumes = useVolumes();
  const open = servers.length > 0;
  useEffect(() => setPhrase(""), [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="max-h-[90vh] sm:max-w-[520px]">
        <DialogHeader className={isRTL ? "text-right" : ""}>
          <DialogTitle className={isRTL ? "text-right" : ""}>
            {servers.length === 1
              ? t("Delete {name}?", { name: servers[0].name })
              : t("Delete {n} servers?", { n: formatNumber(servers.length) })}
          </DialogTitle>
          <DialogDescription className={isRTL ? "text-right" : ""}>
            {t("These are deleted with the servers. This cannot be undone.")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[45vh] divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {servers.map((sv) => {
            const released = [sv.ipv4, ...(sv.ipv6 ? [sv.ipv6] : []), ...(sv.extraIps ?? []).filter((i) => !i.reservedId).map((i) => i.address)];
            const kept = (sv.extraIps ?? []).filter((i) => i.reservedId);
            const keptFloating = floatingIps.filter((f) => f.attachedTo?.serverId === sv.id);
            const backup = backups.find((b) => b.serverId === sv.id);
            const serverSnapshots = snapshots.filter((sn) => sn.serverId === sv.id);
            /* The boot disk and the disks made with the server go; a disk
               attached from Cloud Disks stays there, detached. Servers saved
               before disks were volumes keep their own list. */
            const attached = volumes.filter((v) => v.attachedTo?.serverId === sv.id);
            const legacy = !volumes.some((v) => v.madeWithServerId === sv.id);
            const disks = [
              ...(sv.disks ?? [{ label: "Boot disk", sizeGb: sv.diskGb, path: "" }]).slice(0, legacy ? undefined : 1),
              ...attached.filter((v) => v.deleteWithServer).map((v) => ({ label: "Additional disk", sizeGb: v.sizeGb, path: v.attachedTo!.path })),
            ];
            const keptDisks = attached.filter((v) => !v.deleteWithServer);
            return (
              <div key={sv.id} className="space-y-1 px-3 py-2.5 text-xs">
                <p className="text-sm font-semibold text-foreground" dir="ltr">
                  {sv.name}
                </p>
                <p className="flex flex-wrap items-center gap-x-1.5 text-destructive">
                  <Trash2 className="size-3 shrink-0" />
                  <span className="text-muted-foreground">{t("Public IPs")}:</span>
                  <span dir="ltr">
                    {released.join("  ·  ")}
                  </span>
                </p>
                <p className="flex flex-wrap items-center gap-x-1.5 text-destructive">
                  <Trash2 className="size-3 shrink-0" />
                  <span className="text-muted-foreground">{t("Disks")}:</span>
                  <span>
                    {disks.map((d) => `${t(d.label)} ${formatNumber(d.sizeGb)} ${t("GB")}`).join("  ·  ")}
                  </span>
                </p>
                {kept.length > 0 && (
                  <p className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                    <span dir="ltr">
                      {kept.map((k) => k.address).join("  ·  ")}
                    </span>
                    <span>{t("reserved, stays under Public IPs")}</span>
                  </p>
                )}
                {keptDisks.length > 0 && (
                  <p className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                    <span dir="ltr">{keptDisks.map((v) => v.name).join("  ·  ")}</span>
                    <span>{t("detached, stays under Cloud Disks")}</span>
                  </p>
                )}
                {keptFloating.length > 0 && (
                  <p className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                    <span dir="ltr">
                      {keptFloating.map((k) => k.address).join("  ·  ")}
                    </span>
                    <span>{t("stays under Floating IPs")}</span>
                  </p>
                )}
                {backup && (
                  <p className="flex flex-wrap items-center gap-x-1.5 text-destructive">
                    <Trash2 className="size-3 shrink-0" />
                    <span className="text-muted-foreground">{t("Backup")}:</span>
                    <span>
                      {t("{name}, with {n} saved backups", { name: backup.name, n: formatNumber(backup.points.length) })}
                    </span>
                  </p>
                )}
                {serverSnapshots.length > 0 && (
                  <p className="flex flex-wrap items-center gap-x-1.5 text-destructive">
                    <Trash2 className="size-3 shrink-0" />
                    <span className="text-muted-foreground">{t("Snapshots")}:</span>
                    <span dir="ltr">{serverSnapshots.map((sn) => sn.name).join("  ·  ")}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <TypeToConfirm value={phrase} onChange={setPhrase} />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button variant="destructive" disabled={!deletePhraseOk(phrase)} onClick={() => onDeleted(servers.map((sv) => sv.id))}>
            {fx("delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RenameDialog({ server, onClose }: { server: ServerRecord | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const [name, setName] = useState("");
  useEffect(() => setName(server?.name ?? ""), [server]);
  const ok = SERVER_NAME_RE.test(name);

  return (
    <Dialog open={!!server} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Rename server")}</DialogTitle>
          <DialogDescription>{t("Lowercase letters, digits and hyphens; 3 to 63 characters.")}</DialogDescription>
        </DialogHeader>
        <Input dir="ltr" value={name} onChange={(e) => setName(e.target.value.toLowerCase())} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!ok}
            onClick={async () => {
              if (!server) return;
              if (await apiCall(() => (renameServer(server.id, name), true), t)) onClose();
            }}
          >
            {fx("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
