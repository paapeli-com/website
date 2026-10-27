import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge, MapPin, Plus, Server, Tag } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { useShellT } from "@/shared/i18n/shell";
import { localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { BACKUP_GB_MONTHLY, REGIONS } from "../lib/catalog";
import { useServers } from "../lib/serverStore";
import { BACKUP_CAPACITY, enableBackup, useBackups } from "../lib/backupStore";
import { BACKUPS_PATH, CREATE_SERVER_PATH, CreateFooter, CreatePage, PageBreadcrumb } from "../ui";
import { FieldBox, Note, RegionBox, ServerOption, SummaryLine } from "../wizard";

/* Enable backup: one page, no steps. Where, then which server and a name;
 * the rules under them and the price beside them.
 *
 * Only servers in the chosen region and zone are offered, and a server that
 * already has a backup is shown but not choosable: one backup per server.
 */

const NAME_RE = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;

export default function CreateBackup() {
  const t = useT();
  const shellT = useShellT();
  const navigate = useNavigate();
  const language = useAppLanguage();
  const n = (v: number | string) => localizeDigits(language, v);
  const { currency, format } = useBillingCurrency();
  const backups = useBackups();
  const goToList = () => navigate(BACKUPS_PATH);

  const [regionId, setRegionId] = useState(REGIONS[0].id);
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const [zone, setZone] = useState(region.zones[0]);
  const servers = useServers().filter((s) => s.region === region.city && s.zone === zone);
  const hasBackup = (id: string) => backups.some((b) => b.serverId === id);

  const [serverId, setServerId] = useState("");
  const server = servers.find((s) => s.id === serverId);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  /* The region or zone changed: a server from elsewhere no longer fits. */
  useEffect(() => {
    if (serverId && !server) setServerId("");
  }, [serverId, server]);
  /* The name follows the server until it is typed in. */
  useEffect(() => {
    if (!nameTouched) setName(server ? `${server.name}-backup` : "");
  }, [server, nameTouched]);

  const bootGb = server ? (server.disks?.[0]?.sizeGb ?? server.diskGb) : 0;
  const perGb = BACKUP_GB_MONTHLY[currency];
  const maxMonthly = bootGb * BACKUP_CAPACITY * perGb;
  const nameOk = NAME_RE.test(name);
  const ok = nameOk && !!server;

  const create = () => {
    if (!ok || !server) {
      setShowErrors(true);
      toast.error(t("Fix the highlighted field to continue."));
      return;
    }
    enableBackup({ name, serverId: server.id, region: region.city, zone, diskGb: bootGb });
    toast.success(t("Backup enabled for {name}", { name: server.name }));
    goToList();
  };

  return (
    <CreatePage>
      <PageBreadcrumb
        items={[
          { label: shellT("Storage"), path: BACKUPS_PATH },
          { label: shellT("Backup"), path: BACKUPS_PATH },
          { label: t("Enable backup") },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("Enable backup")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Weekly backups of a server's main disk, ready to restore.")}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 space-y-5 p-4 lg:p-5">
          {/* Where, what it is called and which server, as three equal boxes. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RegionBox
              regionId={regionId}
              zone={zone}
              onChange={(r, z) => {
                setRegionId(r);
                setZone(z);
              }}
              description={t("Only servers in this region and zone can be chosen.")}
            />

            <FieldBox title={t("Backup name")} required description={t("Lowercase letters, digits and hyphens; 3 to 63 characters.")}>
              <Input
                id="backup-name"
                dir="ltr"
                value={name}
                onChange={(e) => {
                  setNameTouched(true);
                  setName(e.target.value.toLowerCase());
                }}
                placeholder="web-01-backup"
                aria-label={t("Backup name")}
                aria-invalid={showErrors && !nameOk}
                className={cn("h-12", showErrors && !nameOk && "border-destructive")}
              />
              {showErrors && !nameOk && (
                <p className="mt-1.5 text-xs text-destructive">{t("Use 3 to 63 lowercase letters, digits or hyphens, starting with a letter.")}</p>
              )}
            </FieldBox>

            <FieldBox title={t("Server")} required description={t("Its main disk is what is backed up.")}>
              <Select value={serverId} onValueChange={setServerId} disabled={servers.length === 0}>
                <SelectTrigger className={cn("h-12", showErrors && !server && "border-destructive")} aria-label={t("Server")}>
                  {server ? <ServerOption server={server} /> : <SelectValue placeholder={t("Choose a server")} />}
                </SelectTrigger>
                <SelectContent>
                  {servers.map((s) => (
                    <SelectItem key={s.id} value={s.id} disabled={hasBackup(s.id)}>
                      <span className="flex items-center gap-2">
                        <ServerOption server={s} />
                        {hasBackup(s.id) && <span className="text-xs text-muted-foreground">· {t("Already backed up")}</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {servers.length === 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {t("No server in this region and zone yet.")}
                  <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => navigate(CREATE_SERVER_PATH)}>
                    <Plus className="size-3.5" />
                    {t("Create server")}
                  </Button>
                </div>
              ) : (
                showErrors && !server && <p className="mt-1.5 text-xs text-destructive">{t("Choose a server to back up.")}</p>
              )}
            </FieldBox>
          </div>

          <Note>
            <ul className="list-disc space-y-1 ps-4">
              <li>{t("Once enabled, you can back up by hand at any time.")}</li>
              <li>{t("The first automatic backup is made within 24 hours, then one every week.")}</li>
              <li>{t("Only the server's main disk is backed up.")}</li>
              <li>
                {t("Each server has room for {n} backups. When it is full, a new backup takes the place of the oldest.", {
                  n: n(BACKUP_CAPACITY),
                })}
              </li>
            </ul>
          </Note>
        </Card>

        <aside className="xl:sticky xl:top-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("Price per GB")}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">{format(perGb)}</span>
              <span className="text-sm text-muted-foreground">{t("/ month")}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {server
                ? t("Up to {amount} a month with all {n} kept", { amount: format(maxMonthly), n: n(BACKUP_CAPACITY) })
                : t("Billed for the backups kept.")}
            </p>

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-semibold text-foreground">{t("Summary")}</p>
              <SummaryLine icon={MapPin} label={t("Region")} value={`${t(region.city)} · ${zone}`} />
              <SummaryLine icon={Server} label={t("Server")} value={<span dir="ltr">{server?.name ?? "-"}</span>} />
              <SummaryLine icon={Tag} label={t("Backup name")} value={<span dir="ltr">{name || "-"}</span>} />
              <SummaryLine icon={Gauge} label={t("Capacity")} value={t("{n} backups", { n: n(BACKUP_CAPACITY) })} />
            </div>

            <Button onClick={create} className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t("Enable backup")}
            </Button>
          </Card>
        </aside>
      </div>

      <CreateFooter cancel={{ label: t("Cancel"), onClick: goToList }} primary={{ label: t("Enable backup"), onClick: create }} />
    </CreatePage>
  );
}
