import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  Camera,
  Cpu,
  Disc,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  Link2,
  LifeBuoy,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Split,
  Trash2,
  Unlink,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Input } from "@/features/factory/components/ui/input";
import { Switch } from "@/features/factory/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/features/factory/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useBillingCurrency } from "@/shared/lib/billingCurrency";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { adminUser, BACKUP_GB_MONTHLY, DISK_TYPES, FLOATING_IP_MONTHLY, IMAGES, PLANS, serverFamily } from "../lib/catalog";
import {
  bootDiskGb,
  changePassword,
  defaultPtr,
  logServerEvent,
  ptrProblem,
  rebuildServer,
  rescueServer,
  resizeServer,
  restoreServer,
  serverPhase,
  serverStatus,
  setReverseDns,
  useServers,
  type ServerPhase,
  type ServerRecord,
} from "../lib/serverStore";
import { allocateFloating, associateFloating, disassociateFloating, useFloatingIps } from "../lib/floatingStore";
import {
  connectServer,
  disconnectServer,
  fixedIpProblem,
  networksOf,
  setPortSecurity,
  useNetworks,
  type NetworkPort,
  type PrivateNetwork,
} from "../lib/networkStore";
import {
  memberStatus,
  newMember,
  releaseServersFromLoadBalancers,
  ruleLabel,
  updateLoadBalancer,
  useLoadBalancers,
  type LoadBalancer,
  type TrafficRule,
} from "../lib/loadBalancerStore";
import { attachServer, detachServer, groupsOf, inboundSummary, useFirewalls, type FirewallGroup } from "../lib/firewallStore";
import { attachVolume, detachVolume, devicePath, nextDevicePath, useVolumes, volumeStatus, type VolumeRecord } from "../lib/volumeStore";
import {
  BACKUP_CAPACITY,
  backupNow,
  backupStatus,
  deleteBackups,
  deletePoint,
  enableBackup,
  nextBackupAt,
  restoreFrom,
  setPaused,
  useBackups,
  type BackupPoint,
} from "../lib/backupStore";
import { deleteSnapshots, restoreSnapshot, snapshotStatus, useSnapshots, type SnapshotRecord } from "../lib/snapshotStore";
import { imageOfSnapshot, imageProgress, useImages } from "../lib/imageStore";
import { useHosts } from "../lib/hostStore";
import { apiCall } from "../lib/openstackErrors";
import { MEMBER_TONE, StatusDot, useLbText } from "../lbUi";
import { CreateSnapshotDialog, SaveAsImageDialog } from "../snapshotDialog";
import {
  BACKUPS_PATH,
  ConfirmDialog,
  CopyButton,
  CREATE_FIREWALL_PATH,
  CREATE_NETWORK_PATH,
  CREATE_VOLUME_PATH,
  firewallPath,
  LOAD_BALANCERS_PATH,
  loadBalancerPath,
  networkPath,
  SNAPSHOTS_PATH,
  VOLUMES_PATH, IMAGES_PATH } from "../ui";
import { Note } from "../wizard";

/* The server page's tabs past Overview and Monitoring. Each is a few cards;
 * each card says what it holds in a line and has one button for its main
 * action. Anything that asks for input opens a dialog. Every change goes
 * through the store it belongs to (the same ones the list pages use), is
 * written to the server's activity, and a refusal comes back as a toast in
 * the person's language. */

const TABLE_FRAME = "overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs [&_th]:px-3";

function Section({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

function IconAction({ label, onClick, danger, disabled, children }: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-8 text-muted-foreground", danger ? "hover:text-destructive" : "hover:text-foreground")}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}


/** A password, hidden until asked, with copy. */
export function PasswordReveal({ value }: { value: string }) {
  const t = useT();
  const [shown, setShown] = useState(false);
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5">
      {/* As wide as the password either way, so showing it moves nothing. */}
      <span dir="ltr" className="inline-block overflow-hidden whitespace-nowrap font-mono text-sm text-foreground" style={{ width: `${value.length}ch` }}>
        {shown ? value : "•".repeat(value.length)}
      </span>
      <button
        type="button"
        onClick={() => setShown((x) => !x)}
        className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        aria-label={shown ? t("Hide") : t("Show")}
        title={shown ? t("Hide") : t("Show")}
      >
        {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
      <CopyButton text={value} className="size-6" />
    </span>
  );
}

// ---- Network ----------------------------------------------------------------------

export function NetworkTab({ s }: { s: ServerRecord }) {
  const t = useT();
  const navigate = useNavigate();
  const lbText = useLbText();
  const floating = useFloatingIps();
  const networks = useNetworks();
  const lbs = useLoadBalancers();
  const mineFloating = floating.filter((f) => f.attachedTo?.serverId === s.id);
  const priv = networksOf(networks, s.id);

  const [ptrFor, setPtrFor] = useState<string | null>(null);
  const [attachFloating, setAttachFloating] = useState(false);
  const [detaching, setDetaching] = useState<{ id: string; address: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [leaving, setLeaving] = useState<{ network: PrivateNetwork; port: NetworkPort } | null>(null);
  const [securityOff, setSecurityOff] = useState<{ network: PrivateNetwork; port: NetworkPort } | null>(null);
  const [joining, setJoining] = useState(false);
  const [removing, setRemoving] = useState<{ lb: LoadBalancer; rule: TrafficRule } | null>(null);

  const publics: { address: string; kind: string; floatingId?: string }[] = [
    { address: s.ipv4, kind: t("Primary IPv4") },
    ...(s.ipv6 ? [{ address: s.ipv6, kind: t("IPv6") }] : []),
    ...(s.extraIps ?? []).map((ip) => ({ address: ip.address, kind: ip.reservedId ? t("Reserved IP") : t("Additional IP") })),
    ...mineFloating.map((f) => ({ address: f.address, kind: t("Floating IP"), floatingId: f.id })),
  ];
  const memberships = lbs.flatMap((lb) =>
    lb.rules.flatMap((rule) => rule.members.filter((m) => m.serverId === s.id).map((m) => ({ lb, rule, member: m }))),
  );
  const leavingLbs = leaving ? lbs.filter((l) => l.networkId === leaving.network.id && memberships.some((m) => m.lb.id === l.id)) : [];

  return (
    <div className="space-y-4">
      <Section
        title={t("Public addresses")}
        description={t("Reachable from the internet. Reverse DNS is the name an address answers to, used by mail servers among others.")}
        action={
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setAttachFloating(true)}>
            <Plus className="size-3.5" />
            {t("Attach a floating IP")}
          </Button>
        }
      >
        <div className={TABLE_FRAME}>
          <Table className="min-w-[640px] table-fixed">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[18%]" />
              <col />
              <col className="w-[96px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("Address")}</TableHead>
                <TableHead>{t("Type")}</TableHead>
                <TableHead>{t("Reverse DNS")}</TableHead>
                <TableHead className="text-end">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publics.map((p) => (
                <TableRow key={p.address} className="border-b">
                  <TableCell>
                    <span dir="ltr" className="block truncate font-medium text-foreground">
                      {p.address}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.kind}</TableCell>
                  <TableCell>
                    <span dir="ltr" className={cn("block truncate", s.ptr?.[p.address] ? "text-foreground" : "text-muted-foreground")}>
                      {s.ptr?.[p.address] ?? defaultPtr(p.address)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <IconAction label={t("Edit reverse DNS")} onClick={() => setPtrFor(p.address)}>
                        <Pencil className="size-4" />
                      </IconAction>
                      {p.floatingId && (
                        <IconAction label={t("Detach")} danger onClick={() => setDetaching({ id: p.floatingId!, address: p.address })}>
                          <Unlink className="size-4" />
                        </IconAction>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section
        title={t("Private networks")}
        description={t("Networks of your own between your servers, closed to the internet.")}
        action={
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setConnecting(true)}>
            <Link2 className="size-3.5" />
            {t("Connect to a network")}
          </Button>
        }
      >
        {priv.length === 0 ? (
          <Empty>{t("Not connected to any private network.")}</Empty>
        ) : (
          <div className={TABLE_FRAME}>
            <Table className="min-w-[640px] table-fixed">
              <colgroup>
                <col />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[16%]" />
                <col className="w-[64px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("Network")}</TableHead>
                  <TableHead>{t("Subnet")}</TableHead>
                  <TableHead>{t("Private IP")}</TableHead>
                  <TableHead>{t("Port security")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {priv.map(({ network, port }) => (
                  <TableRow key={port.id} className="border-b">
                    <TableCell>
                      <button type="button" className="block max-w-full truncate text-start font-medium hover:text-primary" onClick={() => navigate(networkPath(network.id))}>
                        <span dir="ltr">{network.name}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span dir="ltr">{network.cidr}</span>
                    </TableCell>
                    <TableCell>
                      <span dir="ltr" className="text-foreground">
                        {port.ip}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={port.portSecurity}
                        onCheckedChange={(on) =>
                          on
                            ? void apiCall(() => setPortSecurity(network.id, s.id, true), t)
                            : setSecurityOff({ network, port })
                        }
                        aria-label={t("Port security")}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <IconAction label={t("Disconnect")} danger onClick={() => setLeaving({ network, port })}>
                          <Unlink className="size-4" />
                        </IconAction>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <Section
        title={t("Load balancers")}
        description={t("Load balancers that send traffic to this server.")}
        action={
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setJoining(true)}>
            <Split className="size-3.5" />
            {t("Add to a load balancer")}
          </Button>
        }
      >
        {memberships.length === 0 ? (
          <Empty>{t("Not behind any load balancer.")}</Empty>
        ) : (
          <div className={TABLE_FRAME}>
            <Table className="min-w-[640px] table-fixed">
              <colgroup>
                <col />
                <col className="w-[26%]" />
                <col className="w-[12%]" />
                <col className="w-[20%]" />
                <col className="w-[64px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("Load balancer")}</TableHead>
                  <TableHead>{t("Traffic rule")}</TableHead>
                  <TableHead>{t("Weight")}</TableHead>
                  <TableHead>{t("Health")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map(({ lb, rule, member }) => {
                  const health = memberStatus(rule, serverStatus(s), member.weight);
                  return (
                    <TableRow key={member.id} className="border-b">
                      <TableCell>
                        <button type="button" className="block max-w-full truncate text-start font-medium hover:text-primary" onClick={() => navigate(loadBalancerPath(lb.id))}>
                          <span dir="ltr">{lb.name}</span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span dir="ltr" className="text-foreground">
                          {ruleLabel(rule)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.weight}</TableCell>
                      <TableCell>
                        <StatusDot tone={MEMBER_TONE[health]} label={lbText.member[health]} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <IconAction label={t("Remove")} danger onClick={() => setRemoving({ lb, rule })}>
                            <Trash2 className="size-4" />
                          </IconAction>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <PtrDialog server={s} address={ptrFor} onClose={() => setPtrFor(null)} />
      <FloatingDialog server={s} open={attachFloating} onClose={() => setAttachFloating(false)} />
      <ConnectNetworkDialog server={s} open={connecting} onClose={() => setConnecting(false)} />
      <JoinLbDialog server={s} open={joining} onClose={() => setJoining(false)} />

      <ConfirmDialog
        open={!!detaching}
        onClose={() => setDetaching(null)}
        title={t("Detach {ip}?", { ip: detaching?.address ?? "" })}
        description={t("The server can no longer be reached at this address. The floating IP stays in your account.")}
        destructive
        confirmLabel={t("Detach")}
        onConfirm={async () => {
          const d = detaching;
          setDetaching(null);
          if (!d) return;
          if (
            await apiCall(() => {
              disassociateFloating(d.id);
              logServerEvent(s.id, "Floating IP detached", "{ip}", { ip: d.address });
              return true;
            }, t)
          )
            toast.success(t("{ip} detached", { ip: d.address }));
        }}
      />
      <ConfirmDialog
        open={!!leaving}
        onClose={() => setLeaving(null)}
        title={t("Disconnect {server} from {name}?", { server: s.name, name: leaving?.network.name ?? "" })}
        description={
          t("The server loses its address {ip} on this network right away, and can no longer reach the other servers on it.", {
            ip: leaving?.port.ip ?? "",
          }) +
          (leavingLbs.length > 0 ? " " + t("It is also taken out of these load balancers: {names}", { names: leavingLbs.map((l) => l.name).join("، ") }) : "")
        }
        destructive
        confirmLabel={t("Disconnect")}
        onConfirm={async () => {
          const l = leaving;
          setLeaving(null);
          if (!l) return;
          if (
            await apiCall(() => {
              disconnectServer(l.network.id, s.id);
              releaseServersFromLoadBalancers([s.id], l.network.id);
              logServerEvent(s.id, "Disconnected from a private network", "{name}", { name: l.network.name });
              return true;
            }, t)
          )
            toast.success(t("{server} disconnected from {name}", { server: s.name, name: l.network.name }));
        }}
      />
      <ConfirmDialog
        open={!!securityOff}
        onClose={() => setSecurityOff(null)}
        title={t("Turn off port security for {server}?", { server: s.name })}
        description={t(
          "Firewalls stop applying to this server's traffic on this network, and it may send traffic from any address. Turn it off only for a server that routes for others, such as a VPN or firewall server.",
        )}
        acknowledge={t("I confirm that this server needs port security off.")}
        destructive
        confirmLabel={t("Turn off")}
        onConfirm={async () => {
          const x = securityOff;
          setSecurityOff(null);
          if (x) await apiCall(() => setPortSecurity(x.network.id, s.id, false), t);
        }}
      />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={t("Take {server} out of {name}?", { server: s.name, name: removing?.lb.name ?? "" })}
        description={t("The load balancer stops sending traffic to this server on rule {rule}.", { rule: removing ? ruleLabel(removing.rule) : "" })}
        destructive
        confirmLabel={t("Remove")}
        onConfirm={async () => {
          const r = removing;
          setRemoving(null);
          if (!r) return;
          if (
            await apiCall(() => {
              updateLoadBalancer(r.lb.id, {
                ...r.lb,
                rules: r.lb.rules.map((x) => (x.id === r.rule.id ? { ...x, members: x.members.filter((m) => m.serverId !== s.id) } : x)),
              });
              logServerEvent(s.id, "Taken out of a load balancer", "{name}", { name: r.lb.name });
              return true;
            }, t)
          )
            toast.success(t("Taken out of {name}", { name: r.lb.name }));
        }}
      />
    </div>
  );
}

function PtrDialog({ server, address, onClose }: { server: ServerRecord; address: string | null; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const [name, setName] = useState("");
  useEffect(() => setName(address ? (server.ptr?.[address] ?? "") : ""), [address, server.ptr]);
  const problem = ptrProblem(name);
  return (
    <Dialog open={!!address} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Reverse DNS")}</DialogTitle>
          <DialogDescription>
            {t("The name {ip} answers to. Leave it empty for the default.", { ip: address ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <div>
          <Input
            dir="ltr"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
            placeholder={address ? defaultPtr(address) : ""}
            aria-label={t("Reverse DNS")}
            aria-invalid={!!problem}
            className={cn("h-10 rtl:text-right", problem && "border-destructive")}
          />
          {problem ? (
            <p className="mt-1.5 text-xs text-destructive">{t(problem)}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">{t("Point the name's own A or AAAA record at this address as well, or mail servers will not trust it.")}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!!problem}
            onClick={async () => {
              if (!address) return;
              if (await apiCall(() => (setReverseDns(server.id, address, name), true), t)) {
                toast.success(t("Reverse DNS saved"));
                onClose();
              }
            }}
          >
            {fx("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FloatingDialog({ server, open, onClose }: { server: ServerRecord; open: boolean; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const { currency, format } = useBillingCurrency();
  const free = useFloatingIps().filter((f) => f.region === server.region && !f.attachedTo);
  const [choice, setChoice] = useState("new");
  useEffect(() => {
    if (open) setChoice(free[0]?.id ?? "new");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Attach a floating IP")}</DialogTitle>
          <DialogDescription>{t("An address you can move between servers without it changing.")}</DialogDescription>
        </DialogHeader>
        <Select value={choice} onValueChange={setChoice}>
          <SelectTrigger className="h-11" aria-label={t("Floating IP")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {free.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span dir="ltr">{f.address}</span>
                {f.description && <span className="text-muted-foreground"> · {f.description}</span>}
              </SelectItem>
            ))}
            <SelectItem value="new">
              {t("A new floating IP")} <span className="text-muted-foreground">({format(FLOATING_IP_MONTHLY[currency])} {t("/ month")})</span>
            </SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            onClick={async () => {
              const ip = await apiCall(() => {
                const target = choice === "new" ? allocateFloating(server.region, server.zone, server.name) : free.find((f) => f.id === choice);
                if (!target) throw new Error("gone");
                associateFloating(target.id, server.id, server.name);
                logServerEvent(server.id, "Floating IP attached", "{ip}", { ip: target.address });
                return target;
              }, t);
              if (!ip) return;
              toast.success(t("{ip} attached to {server}", { ip: ip.address, server: server.name }));
              onClose();
            }}
          >
            {t("Attach")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConnectNetworkDialog({ server, open, onClose }: { server: ServerRecord; open: boolean; onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const choices = useNetworks().filter((n) => n.region === server.region && !n.ports.some((p) => p.serverId === server.id));
  const [networkId, setNetworkId] = useState("");
  const [mode, setMode] = useState<"auto" | "fixed">("auto");
  const [ip, setIp] = useState("");
  useEffect(() => {
    if (!open) return;
    setNetworkId(choices[0]?.id ?? "");
    setMode("auto");
    setIp("");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const network = choices.find((n) => n.id === networkId);
  const problem = network && mode === "fixed" && ip ? fixedIpProblem(network, ip) : undefined;
  const ok = !!network && (mode === "auto" || (!!ip && !problem));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Connect to a network")}</DialogTitle>
          <DialogDescription>{t("The server gets an address on the network and can reach the other servers on it.")}</DialogDescription>
        </DialogHeader>
        {choices.length === 0 ? (
          <Note>
            {t("No other private network in this region.")}{" "}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(CREATE_NETWORK_PATH)}>
              {t("Create private network")}
            </button>
          </Note>
        ) : (
          <div className="space-y-4">
            <Select value={networkId} onValueChange={setNetworkId}>
              <SelectTrigger className="h-11" aria-label={t("Network")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choices.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    <span dir="ltr">{n.name}</span> <span className="text-muted-foreground">·</span>{" "}
                    <span dir="ltr" className="text-muted-foreground">
                      {n.cidr}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("Private IP")}</p>
              <div className="inline-flex rounded-lg border border-border p-0.5">
                {(
                  [
                    ["auto", t("Next free address")],
                    ["fixed", t("A chosen address")],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMode(v)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      mode === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === "fixed" && (
                <>
                  <Input
                    dir="ltr"
                    value={ip}
                    onChange={(e) => setIp(e.target.value.trim())}
                    placeholder={network?.pools[0]?.start ?? "10.0.0.20"}
                    aria-invalid={!!problem}
                    className={cn("h-10 rtl:text-right", problem && "border-destructive")}
                  />
                  {problem && <p className="text-xs text-destructive">{t(problem.text, problem.vars)}</p>}
                </>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!ok}
            onClick={async () => {
              if (!network) return;
              const port = await apiCall(() => {
                const p = connectServer(network.id, server.id, mode === "fixed" ? ip : undefined);
                logServerEvent(server.id, "Connected to a private network", "{name}, {ip}", { name: network.name, ip: p.ip });
                return p;
              }, t);
              if (!port) return;
              toast.success(t("Connected with the address {ip}", { ip: port.ip }));
              onClose();
            }}
          >
            {t("Connect")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JoinLbDialog({ server, open, onClose }: { server: ServerRecord; open: boolean; onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const networks = useNetworks();
  const mine = networksOf(networks, server.id).map((x) => x.network.id);
  const eligible = useLoadBalancers().filter((l) => l.region === server.region && mine.includes(l.networkId) && l.rules.length > 0);
  const [lbId, setLbId] = useState("");
  const [ruleId, setRuleId] = useState("");
  useEffect(() => {
    if (!open) return;
    setLbId(eligible[0]?.id ?? "");
    setRuleId("");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const lb = eligible.find((l) => l.id === lbId);
  const freeRules = lb?.rules.filter((r) => !r.members.some((m) => m.serverId === server.id)) ?? [];
  useEffect(() => {
    if (lb && !freeRules.some((r) => r.id === ruleId)) setRuleId(freeRules[0]?.id ?? "");
  }, [lb, freeRules, ruleId]);
  const rule = freeRules.find((r) => r.id === ruleId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Add to a load balancer")}</DialogTitle>
          <DialogDescription>{t("The load balancer starts sending this server traffic on the rule chosen.")}</DialogDescription>
        </DialogHeader>
        {eligible.length === 0 ? (
          <Note>
            {t("No load balancer can reach this server: it must be on the load balancer's private network, and the load balancer must have a rule.")}{" "}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(LOAD_BALANCERS_PATH)}>
              {t("Load balancers")}
            </button>
          </Note>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">{t("Load balancer")}</p>
              <Select value={lbId} onValueChange={setLbId}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eligible.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span dir="ltr">{l.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">{t("Traffic rule")}</p>
              {freeRules.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("The server is already behind every rule of this load balancer.")}</p>
              ) : (
                <Select value={ruleId} onValueChange={setRuleId}>
                  <SelectTrigger className="h-10" dir="ltr">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {freeRules.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {ruleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!lb || !rule}
            onClick={async () => {
              if (!lb || !rule) return;
              const done = await apiCall(() => {
                updateLoadBalancer(lb.id, {
                  ...lb,
                  rules: lb.rules.map((r) => (r.id === rule.id ? { ...r, members: [...r.members, newMember(server.id)] } : r)),
                });
                logServerEvent(server.id, "Added to a load balancer", "{name}, {rule}", { name: lb.name, rule: ruleLabel(rule) });
                return true;
              }, t);
              if (!done) return;
              toast.success(t("Added to {name}", { name: lb.name }));
              onClose();
            }}
          >
            {t("Add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Firewall ---------------------------------------------------------------------

export function FirewallTab({ s }: { s: ServerRecord }) {
  const t = useT();
  const navigate = useNavigate();
  const all = useFirewalls();
  const applied = groupsOf(all, s.id);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<FirewallGroup | null>(null);

  return (
    <div className="space-y-4">
      <Section
        title={t("Firewalls")}
        description={t("Inbound traffic is let in only where a rule of these allows it; outbound is open unless a rule limits it.")}
        action={
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" />
            {t("Apply a firewall")}
          </Button>
        }
      >
        {applied.length === 0 ? (
          <Empty>{t("No firewall applies, so no inbound traffic reaches this server.")}</Empty>
        ) : (
          <div className={TABLE_FRAME}>
            <Table className="min-w-[560px] table-fixed">
              <colgroup>
                <col className="w-[34%]" />
                <col />
                <col className="w-[64px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Inbound rules")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {applied.map((f) => (
                  <TableRow key={f.id} className="border-b">
                    <TableCell>
                      <button type="button" className="block max-w-full truncate text-start font-medium hover:text-primary" onClick={() => navigate(firewallPath(f.id))}>
                        <span dir="ltr">{f.name}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="block truncate">{f.inbound.length ? inboundSummary(f) : t("None")}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <IconAction label={t("Remove")} danger onClick={() => setRemoving(f)}>
                          <Trash2 className="size-4" />
                        </IconAction>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <ApplyFirewallDialog server={s} open={adding} onClose={() => setAdding(false)} onCreate={() => navigate(CREATE_FIREWALL_PATH)} />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={t("Take {name} off this server?", { name: removing?.name ?? "" })}
        description={
          applied.length === 1
            ? t("It is the only firewall on this server: with none, no inbound traffic reaches it, SSH included.")
            : t("Traffic its rules let in is no longer let in, unless another firewall on the server allows it.")
        }
        destructive
        confirmLabel={t("Remove")}
        onConfirm={async () => {
          const f = removing;
          setRemoving(null);
          if (!f) return;
          if (
            await apiCall(() => {
              detachServer(f.id, s.id);
              logServerEvent(s.id, "Firewall removed", "{name}", { name: f.name });
              return true;
            }, t)
          )
            toast.success(t("Firewall removed"));
        }}
      />
    </div>
  );
}

function ApplyFirewallDialog({ server, open, onClose, onCreate }: { server: ServerRecord; open: boolean; onClose: () => void; onCreate: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const choices = useFirewalls().filter((f) => !f.serverIds.includes(server.id));
  const [id, setId] = useState("");
  useEffect(() => {
    if (open) setId(choices[0]?.id ?? "");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = choices.find((f) => f.id === id);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Apply a firewall")}</DialogTitle>
          <DialogDescription>{t("Its rules apply on top of the firewalls already on the server.")}</DialogDescription>
        </DialogHeader>
        {choices.length === 0 ? (
          <Note>
            {t("Every firewall already applies to this server.")}{" "}
            <button type="button" className="font-medium text-primary hover:underline" onClick={onCreate}>
              {t("Create firewall")}
            </button>
          </Note>
        ) : (
          <>
            <Select value={id} onValueChange={setId}>
              <SelectTrigger className="h-10" dir="ltr">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choices.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chosen && <p className="text-xs text-muted-foreground">{chosen.inbound.length ? inboundSummary(chosen) : t("No inbound rules.")}</p>}
          </>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!chosen}
            onClick={async () => {
              if (!chosen) return;
              if (
                await apiCall(() => {
                  attachServer(chosen.id, server.id);
                  logServerEvent(server.id, "Firewall applied", "{name}", { name: chosen.name });
                  return true;
                }, t)
              ) {
                toast.success(t("Firewall applied"));
                onClose();
              }
            }}
          >
            {t("Apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Disks ------------------------------------------------------------------------

export function DisksTab({ s }: { s: ServerRecord }) {
  const t = useT();
  const navigate = useNavigate();
  const { formatNumber } = useLanguage();
  const volumes = useVolumes();
  const [attaching, setAttaching] = useState(false);
  const [detaching, setDetaching] = useState<VolumeRecord | null>(null);
  const family = serverFamily(s);
  const attached = volumes.filter((v) => v.attachedTo?.serverId === s.id);
  /* Servers saved before disks were volumes keep their own list. */
  const legacy = volumes.some((v) => v.madeWithServerId === s.id) ? [] : (s.disks ?? []).slice(1);
  const typeName = (id: string) => DISK_TYPES.find((d) => d.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <Section
        title={t("Disks")}
        description={t("The boot disk and the cloud disks attached. A cloud disk can be moved to another server in the same zone.")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setAttaching(true)}>
              <Link2 className="size-3.5" />
              {t("Attach a disk")}
            </Button>
            <Button size="sm" className="h-8 gap-1.5" onClick={() => navigate(`${CREATE_VOLUME_PATH}?server=${s.id}`)}>
              <Plus className="size-3.5" />
              {t("Create disk")}
            </Button>
          </div>
        }
      >
        <div className={TABLE_FRAME}>
          <Table className="min-w-[680px] table-fixed">
            <colgroup>
              <col />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[20%]" />
              <col className="w-[64px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("Name")}</TableHead>
                <TableHead>{t("Type")}</TableHead>
                <TableHead>{t("Size")}</TableHead>
                <TableHead>{t("Path")}</TableHead>
                <TableHead>{t("When the server is deleted")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b">
                <TableCell className="font-medium text-foreground">{t("Boot disk")}</TableCell>
                <TableCell className="text-muted-foreground">{s.hostId ? t("Local") : "SSD"}</TableCell>
                <TableCell>
                  {formatNumber(bootDiskGb(s))} {t("GB")}
                </TableCell>
                <TableCell>
                  <span dir="ltr">{s.disks?.[0]?.path || devicePath(0, family)}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{t("Deleted with it")}</TableCell>
                <TableCell />
              </TableRow>
              {legacy.map((d) => (
                <TableRow key={d.path} className="border-b">
                  <TableCell className="font-medium text-foreground">{t(d.label)}</TableCell>
                  <TableCell className="text-muted-foreground">SSD</TableCell>
                  <TableCell>
                    {formatNumber(d.sizeGb)} {t("GB")}
                  </TableCell>
                  <TableCell>
                    <span dir="ltr">{d.path}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t("Deleted with it")}</TableCell>
                  <TableCell />
                </TableRow>
              ))}
              {attached.map((v) => (
                <TableRow key={v.id} className="border-b">
                  <TableCell>
                    <button type="button" className="block max-w-full truncate text-start font-medium hover:text-primary" onClick={() => navigate(VOLUMES_PATH)}>
                      <span dir="ltr">{v.name}</span>
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t(typeName(v.type))}</TableCell>
                  <TableCell>
                    {formatNumber(v.sizeGb)} {t("GB")}
                  </TableCell>
                  <TableCell>
                    <span dir="ltr">{v.attachedTo?.path}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{v.deleteWithServer ? t("Deleted with it") : t("Kept, detached")}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <IconAction label={t("Detach")} danger onClick={() => setDetaching(v)}>
                        <Unlink className="size-4" />
                      </IconAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("To grow a disk or change its name, open it in")}{" "}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(VOLUMES_PATH)}>
            {t("Cloud Disks")}
          </button>
          .
        </p>
      </Section>

      <AttachDiskDialog server={s} open={attaching} onClose={() => setAttaching(false)} />
      <ConfirmDialog
        open={!!detaching}
        onClose={() => setDetaching(null)}
        title={t("Detach {name}?", { name: detaching?.name ?? "" })}
        description={t("Unmount it inside the server first, or data still being written can be lost. The disk stays in Cloud Disks with its data.")}
        acknowledge={t("I confirm that the disk is unmounted, or that nothing is writing to it.")}
        destructive
        confirmLabel={t("Detach")}
        onConfirm={async () => {
          const v = detaching;
          setDetaching(null);
          if (!v) return;
          if (
            await apiCall(() => {
              detachVolume(v.id);
              logServerEvent(s.id, "Disk detached", "{name}", { name: v.name });
              return true;
            }, t)
          )
            toast.success(t("{name} detached", { name: v.name }));
        }}
      />
    </div>
  );
}

function AttachDiskDialog({ server, open, onClose }: { server: ServerRecord; open: boolean; onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const { t: ft, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const volumes = useVolumes();
  const now = Date.now();
  /* Free disks in the server's zone; a local disk only on its own machine. */
  const choices = volumes.filter(
    (v) =>
      !v.attachedTo &&
      volumeStatus(v, now) === "available" &&
      v.region === server.region &&
      v.zone === server.zone &&
      (v.type !== "local" || v.hostId === server.hostId),
  );
  const [id, setId] = useState("");
  useEffect(() => {
    if (open) setId(choices[0]?.id ?? "");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = choices.find((v) => v.id === id);
  const path = nextDevicePath(server, volumes);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Attach a disk")}</DialogTitle>
          <DialogDescription>{t("A free cloud disk in this server's zone.")}</DialogDescription>
        </DialogHeader>
        {choices.length === 0 ? (
          <Note>
            {t("No free disk in this zone.")}{" "}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(`${CREATE_VOLUME_PATH}?server=${server.id}`)}>
              {t("Create disk")}
            </button>
          </Note>
        ) : (
          <>
            <Select value={id} onValueChange={setId}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <span dir="ltr">{v.name}</span>{" "}
                    <span className="text-muted-foreground">
                      · {formatNumber(v.sizeGb)} {t("GB")}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("It shows in the server as {path}.", { path })}
            </p>
          </>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!chosen}
            onClick={async () => {
              if (!chosen) return;
              if (
                await apiCall(() => {
                  attachVolume(chosen.id, server.id, path);
                  logServerEvent(server.id, "Disk attached", "{name}", { name: chosen.name });
                  return true;
                }, t)
              ) {
                toast.success(t("{name} attached", { name: chosen.name }));
                onClose();
              }
            }}
          >
            {t("Attach")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Backups and snapshots --------------------------------------------------------

export function BackupsTab({ s, now }: { s: ServerRecord; now: number }) {
  const t = useT();
  const navigate = useNavigate();
  const { language, formatNumber } = useLanguage();
  const { currency, format } = useBillingCurrency();
  const backup = useBackups().find((b) => b.serverId === s.id);
  const snapshots = useSnapshots().filter((x) => x.serverId === s.id);
  const [disabling, setDisabling] = useState(false);
  const [restoring, setRestoring] = useState<{ kind: "backup"; point: BackupPoint } | { kind: "snapshot"; snapshot: SnapshotRecord } | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<BackupPoint | null>(null);
  const [deletingSnapshot, setDeletingSnapshot] = useState<SnapshotRecord | null>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState<SnapshotRecord | null>(null);
  const images = useImages();
  const boot = bootDiskGb(s);
  const status = backup ? backupStatus(backup, now) : null;
  const next = backup ? nextBackupAt(backup) : null;
  const points = backup ? [...backup.points].sort((a, b) => b.createdAt - a.createdAt) : [];

  return (
    <div className="space-y-4">
      <Section
        title={t("Automatic backup")}
        description={t("A copy of the boot disk once a week, the newest {n} kept. A backup by hand can be taken any time.", {
          n: formatNumber(BACKUP_CAPACITY),
        })}
        action={
          backup ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => {
                  backupNow(backup.id);
                  logServerEvent(s.id, "Backup taken");
                  toast.success(t("Backup started"));
                }}
              >
                <Camera className="size-3.5" />
                {t("Back up now")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => {
                  setPaused(backup.id, !backup.paused);
                  logServerEvent(s.id, backup.paused ? "Automatic backup resumed" : "Automatic backup paused");
                }}
              >
                {backup.paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                {backup.paused ? t("Resume") : t("Pause")}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => setDisabling(true)}>
                {t("Turn off")}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => {
                enableBackup({ name: `${s.name}-backup`, serverId: s.id, region: s.region, zone: s.zone, diskGb: boot });
                logServerEvent(s.id, "Automatic backup turned on");
                toast.success(t("Backup enabled for {name}", { name: s.name }));
              }}
            >
              <Archive className="size-3.5" />
              {t("Turn on backups")}
            </Button>
          )
        }
      >
        {!backup ? (
          <Note>
            {t("Costs up to {price} a month for this server: {gb} GB per copy, {n} copies kept.", {
              price: format(boot * BACKUP_CAPACITY * BACKUP_GB_MONTHLY[currency]),
              gb: formatNumber(boot),
              n: formatNumber(BACKUP_CAPACITY),
            })}
          </Note>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {status === "paused"
                ? t("Automatic backups are paused.")
                : next
                  ? t("Next automatic backup: {at}", { at: formatDateTime(next, language) })
                  : null}{" "}
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(BACKUPS_PATH)}>
                {t("All backups")}
              </button>
            </p>
            {points.length === 0 ? (
              <Empty>{t("No backup yet. The first automatic one comes within a day.")}</Empty>
            ) : (
              <div className={TABLE_FRAME}>
                <Table className="min-w-[560px] table-fixed">
                  <colgroup>
                    <col />
                    <col className="w-[20%]" />
                    <col className="w-[16%]" />
                    <col className="w-[96px]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>{t("Taken")}</TableHead>
                      <TableHead>{t("Type")}</TableHead>
                      <TableHead>{t("Size")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {points.map((p) => (
                      <TableRow key={p.id} className="border-b">
                        <TableCell className="text-foreground">{formatDateTime(p.createdAt, language)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.kind === "auto" ? t("Automatic") : t("By hand")}</TableCell>
                        <TableCell>
                          {formatNumber(p.sizeGb)} {t("GB")}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-0.5">
                            <IconAction label={t("Restore")} onClick={() => setRestoring({ kind: "backup", point: p })}>
                              <RotateCcw className="size-4" />
                            </IconAction>
                            <IconAction label={t("Delete")} danger onClick={() => setDeletingPoint(p)}>
                              <Trash2 className="size-4" />
                            </IconAction>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </Section>

      <Section
        title={t("Snapshots")}
        description={t("A copy of the boot disk at one moment, kept until deleted. Take one before a risky change.")}
        action={
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setSnapshotOpen(true)}>
            <Camera className="size-3.5" />
            {t("Create snapshot")}
          </Button>
        }
      >
        {snapshots.length === 0 ? (
          <Empty>{t("No snapshot of this server yet.")}</Empty>
        ) : (
          <div className={TABLE_FRAME}>
            <Table className="min-w-[560px] table-fixed">
              <colgroup>
                <col />
                <col className="w-[26%]" />
                <col className="w-[14%]" />
                <col className="w-[96px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Taken")}</TableHead>
                  <TableHead>{t("Size")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((x) => {
                  const st = snapshotStatus(x, now);
                  return (
                    <TableRow key={x.id} className="border-b">
                      <TableCell>
                        <button type="button" className="block max-w-full truncate text-start font-medium hover:text-primary" onClick={() => navigate(SNAPSHOTS_PATH)}>
                          <span dir="ltr">{x.name}</span>
                        </button>
                        {st !== "ready" && <span className="text-xs text-sky-700 dark:text-sky-400">{st === "creating" ? t("Creating") : t("Restoring")}</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(x.createdAt, language)}</TableCell>
                      <TableCell>
                        {formatNumber(x.sizeGb)} {t("GB")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-0.5">
                          <IconAction label={t("Restore")} disabled={st !== "ready"} onClick={() => setRestoring({ kind: "snapshot", snapshot: x })}>
                            <RotateCcw className="size-4" />
                          </IconAction>
                          {imageOfSnapshot(x.id, images) ? (
                            <IconAction label={t("View image")} onClick={() => navigate(IMAGES_PATH)}>
                              <Disc className="size-4 text-primary" />
                            </IconAction>
                          ) : (
                            <IconAction label={t("Save as image")} disabled={st === "creating"} onClick={() => setSavingSnapshot(x)}>
                              <Disc className="size-4" />
                            </IconAction>
                          )}
                          <IconAction label={t("Delete")} danger disabled={st !== "ready"} onClick={() => setDeletingSnapshot(x)}>
                            <Trash2 className="size-4" />
                          </IconAction>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <CreateSnapshotDialog open={snapshotOpen} serverId={s.id} onClose={() => setSnapshotOpen(false)} />
      <SaveAsImageDialog snapshot={savingSnapshot} onClose={() => setSavingSnapshot(null)} />

      <ConfirmDialog
        open={!!restoring}
        onClose={() => setRestoring(null)}
        title={t("Restore {name}?", { name: s.name })}
        description={t("The boot disk is replaced with the copy from {at}. Everything written to it since is lost. Cloud disks are not touched.", {
          at: restoring ? formatDateTime(restoring.kind === "backup" ? restoring.point.createdAt : restoring.snapshot.createdAt, language) : "",
        })}
        acknowledge={t("I confirm that what was written to the boot disk since then is lost.")}
        destructive
        confirmLabel={t("Restore")}
        onConfirm={async () => {
          const r = restoring;
          setRestoring(null);
          if (!r) return;
          const done = await apiCall(() => {
            if (r.kind === "backup") {
              restoreServer(s.id, formatDateTime(r.point.createdAt, "en"));
              restoreFrom(backup!.id);
            } else {
              restoreServer(s.id, r.snapshot.name);
              restoreSnapshot(r.snapshot.id);
            }
            return true;
          }, t);
          if (done) toast.success(t("Restoring"));
        }}
      />
      <ConfirmDialog
        open={disabling}
        onClose={() => setDisabling(false)}
        title={t("Turn off backups for {name}?", { name: s.name })}
        description={t("Automatic backups stop and the {n} saved backups are deleted.", { n: formatNumber(points.length) })}
        acknowledge={t("I confirm that the saved backups of this server are deleted.")}
        destructive
        confirmLabel={t("Turn off")}
        onConfirm={() => {
          setDisabling(false);
          if (!backup) return;
          deleteBackups([backup.id]);
          logServerEvent(s.id, "Automatic backup turned off");
          toast.success(t("Backups turned off"));
        }}
      />
      <ConfirmDialog
        open={!!deletingPoint}
        onClose={() => setDeletingPoint(null)}
        title={t("Delete this backup?")}
        description={t("The backup from {at} is deleted. This cannot be undone.", {
          at: deletingPoint ? formatDateTime(deletingPoint.createdAt, language) : "",
        })}
        destructive
        confirmLabel={t("Delete")}
        onConfirm={() => {
          const p = deletingPoint;
          setDeletingPoint(null);
          if (backup && p) deletePoint(backup.id, p.id);
        }}
      />
      <ConfirmDialog
        open={!!deletingSnapshot}
        onClose={() => setDeletingSnapshot(null)}
        title={t("Delete {name}?", { name: deletingSnapshot?.name ?? "" })}
        description={t("The snapshot is deleted. This cannot be undone.")}
        destructive
        confirmLabel={t("Delete")}
        onConfirm={() => {
          const x = deletingSnapshot;
          setDeletingSnapshot(null);
          if (x) deleteSnapshots([x.id]);
        }}
      />
    </div>
  );
}

// ---- Maintenance ------------------------------------------------------------------

/** Why the server cannot take maintenance now, or nothing. */
function blockedBecause(s: ServerRecord, phase: ServerPhase, t: (k: string) => string) {
  if (s.locked) return t("Unlock the server first.");
  const why: Partial<Record<ServerPhase, string>> = {
    creating: t("Wait until the server is created."),
    busy: t("Wait for the current work to finish."),
    verifyResize: t("Confirm or revert the plan change first."),
    rescue: t("End rescue first."),
    shelved: t("Unshelve the server first."),
  };
  return why[phase];
}

export function MaintenanceTab({ s, now }: { s: ServerRecord; now: number }) {
  const t = useT();
  const phase = serverPhase(s, now);
  const blocked = blockedBecause(s, phase, t);
  const user = adminUser(serverFamily(s));
  const [resizing, setResizing] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [rescuing, setRescuing] = useState(false);
  const [resetting, setResetting] = useState(false);
  /* A new password, with the user it belongs to: root in rescue, the
     image's own admin user otherwise. */
  const [password, setPassword] = useState<{ title: string; user: string; value: string } | null>(null);

  return (
    <div className="space-y-3">
      {blocked && (
        <p className="text-sm text-muted-foreground">
          {t("Not available right now.")} {blocked}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Tile
          icon={Cpu}
          title={t("Change plan")}
          description={t("More or fewer vCPUs and RAM. The server restarts; then you confirm the change or go back. A disk only grows.")}
          action={t("Change plan")}
          disabled={!!blocked}
          onClick={() => setResizing(true)}
        />
        <Tile
          icon={Layers}
          title={t("Rebuild")}
          description={t("Reinstall the server from an image. Its address and plan stay; everything on the boot disk is erased.")}
          action={t("Rebuild")}
          disabled={!!blocked}
          danger
          onClick={() => setRebuilding(true)}
        />
        <Tile
          icon={LifeBuoy}
          title={t("Rescue")}
          description={t("Boot from a rescue image to repair a server that does not start. Its own disk is attached as a second disk.")}
          action={t("Start rescue")}
          disabled={!!blocked}
          onClick={() => setRescuing(true)}
        />
        <Tile
          icon={KeyRound}
          title={t("Reset {user} password", { user })}
          description={t("Sets a new password inside the running server through the guest agent. It fails if the agent was removed.")}
          action={t("Reset password")}
          disabled={!!blocked || phase !== "running"}
          note={!blocked && phase !== "running" ? t("The server must be running.") : undefined}
          onClick={() => setResetting(true)}
        />
      </div>

      <ResizeDialog server={s} open={resizing} onClose={() => setResizing(false)} />
      <RebuildDialog server={s} open={rebuilding} onClose={() => setRebuilding(false)} />
      <RescueDialog
        server={s}
        open={rescuing}
        onClose={() => setRescuing(false)}
        onPassword={(value) => setPassword({ title: t("Rescue started"), user: "root", value })}
      />
      <ConfirmDialog
        open={resetting}
        onClose={() => setResetting(false)}
        title={t("Reset the {user} password of {name}?", { user, name: s.name })}
        description={t("The current password stops working at once. The new one is shown only once.")}
        confirmLabel={t("Reset password")}
        onConfirm={async () => {
          setResetting(false);
          const value = await apiCall(() => changePassword(s.id), t);
          if (value) setPassword({ title: t("New {user} password", { user }), user, value });
        }}
      />
      <Dialog open={!!password} onOpenChange={(o) => !o && setPassword(null)}>
        <DialogContent data-uniform-type className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{password?.title}</DialogTitle>
            <DialogDescription>{t("Shown only this once. Keep it somewhere safe.")}</DialogDescription>
          </DialogHeader>
          {password && (
            <div className="divide-y divide-border rounded-lg border border-border bg-muted/30 text-sm">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-muted-foreground">{t("Username")}</span>
                <span className="inline-flex items-center gap-1">
                  <span dir="ltr" className="font-mono font-medium text-foreground">
                    {password.user}
                  </span>
                  <CopyButton text={password.user} className="size-6" />
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-muted-foreground">{t("Password")}</span>
                <PasswordReveal value={password.value} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="min-w-[100px]" onClick={() => setPassword(null)}>
              {t("Done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tile({
  icon: Icon,
  title,
  description,
  action,
  onClick,
  disabled,
  danger,
  note,
}: {
  icon: typeof Cpu;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  note?: string;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 ps-12">
        <Button size="sm" variant={danger ? "outline" : "default"} className={cn(danger && "text-destructive hover:text-destructive")} disabled={disabled} onClick={onClick}>
          {action}
        </Button>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
    </Card>
  );
}

function ResizeDialog({ server, open, onClose }: { server: ServerRecord; open: boolean; onClose: () => void }) {
  const t = useT();
  const { t: ft, isRTL, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const { currency, format } = useBillingCurrency();
  const servers = useServers();
  const host = useHosts().find((h) => h.id === server.hostId);
  const isGpu = server.kind === "gpu";
  const plans = PLANS.filter((p) => (isGpu ? p.family === "gpu" : p.family === "shared" || p.family === "dedicated"));
  const [planId, setPlanId] = useState("");
  useEffect(() => {
    if (open) setPlanId("");
  }, [open]);
  /* Room left on the dedicated server, counting this one's own share as free. */
  const others = host ? servers.filter((x) => x.hostId === host.id && x.id !== server.id) : [];
  const freeCores = host ? host.cores - others.reduce((a, x) => a + x.vcpu, 0) : Infinity;
  const freeRam = host ? host.ramGb - others.reduce((a, x) => a + x.ramGb, 0) : Infinity;
  const why = (p: (typeof PLANS)[number]) =>
    p.id === server.planId
      ? t("Current plan")
      : p.diskGb < server.diskGb
        ? t("Smaller disk")
        : p.availability === "soldOut"
          ? t("Sold out")
          : p.vcpu > freeCores || p.ramGb > freeRam
            ? t("No room on {host}", { host: host?.name ?? "" })
            : undefined;
  const current = PLANS.find((p) => p.id === server.planId);
  const chosen = plans.find((p) => p.id === planId);
  const price = (p?: (typeof PLANS)[number]) => (host || !p ? 0 : p.monthly[currency]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("Change plan")}</DialogTitle>
          <DialogDescription>
            {t("Now on {plan}. The server restarts on the new plan; then you confirm the change or go back to this one.", {
              plan: server.planId.toUpperCase(),
            })}
          </DialogDescription>
        </DialogHeader>
        <RadioGroup dir={isRTL ? "rtl" : "ltr"} value={planId} onValueChange={setPlanId} className="block">
          <div className={TABLE_FRAME}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[44px]" />
                  <TableHead>{t("Plan")}</TableHead>
                  <TableHead>{t("vCPU")}</TableHead>
                  <TableHead>{t("RAM")}</TableHead>
                  <TableHead>{t("Disk")}</TableHead>
                  <TableHead className="text-end">{host ? "" : t("Price")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => {
                  const reason = why(p);
                  return (
                    <TableRow
                      key={p.id}
                      onClick={() => !reason && setPlanId(p.id)}
                      className={cn("border-b", reason ? "opacity-60" : "cursor-pointer hover:bg-muted/30", p.id === planId && "bg-primary/[0.04]")}
                    >
                      <TableCell>
                        <div className="flex w-5 justify-center">
                          <RadioGroupItem value={p.id} disabled={!!reason} aria-label={p.id.toUpperCase()} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span dir="ltr" className="font-medium">
                          {isGpu && p.gpu ? p.gpu : p.id.toUpperCase()}
                        </span>
                        {reason && <span className="block text-xs text-muted-foreground">{reason}</span>}
                      </TableCell>
                      <TableCell>{formatNumber(p.vcpu)}</TableCell>
                      <TableCell>
                        {formatNumber(p.ramGb)} {t("GB")}
                      </TableCell>
                      <TableCell>
                        {formatNumber(p.diskGb)} {t("GB")}
                      </TableCell>
                      <TableCell className="text-end">{host ? "" : `${format(p.monthly[currency])} ${t("/ month")}`}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </RadioGroup>
        {chosen && !host && (
          <p className="text-sm text-muted-foreground">
            {t("From {from} to {to} a month.", { from: format(price(current)), to: format(price(chosen)) })}
          </p>
        )}
        {chosen && chosen.diskGb > bootDiskGb(server) && (
          <p className="text-xs text-muted-foreground">
            {t("The boot disk grows to {gb} GB and cannot be made smaller again, even if you go back.", { gb: formatNumber(chosen.diskGb) })}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            disabled={!chosen}
            onClick={async () => {
              if (!chosen) return;
              if (await apiCall(() => (resizeServer(server.id, chosen), true), t)) {
                toast.success(t("Changing plan"));
                onClose();
              }
            }}
          >
            {t("Change plan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** System images by name and version, then the account's own ready images. */
function useImageChoices() {
  const custom = useImages().filter((i) => imageProgress(i).status === "ready");
  return [
    ...IMAGES.map((i) => ({ value: `os:${i.id}`, imageId: i.id, label: `${i.name} ${i.versions[0]}`, versions: i.versions, name: i.name })),
    ...custom.map((i) => ({ value: `custom:${i.id}`, imageId: i.id, label: i.name, versions: [] as string[], name: i.name })),
  ];
}

function RebuildDialog({ server, open, onClose }: { server: ServerRecord; open: boolean; onClose: () => void }) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const choices = useImageChoices();
  const [value, setValue] = useState("");
  const [version, setVersion] = useState("");
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    if (!open) return;
    const same = choices.find((c) => c.imageId === server.imageId) ?? choices[0];
    setValue(same.value);
    setVersion(same.versions.find((v) => server.image.endsWith(v)) ?? same.versions[0] ?? "");
    setAgreed(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = choices.find((c) => c.value === value);
  const label = chosen ? (chosen.versions.length ? `${chosen.name} ${version}` : chosen.label) : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Rebuild {name}", { name: server.name })}</DialogTitle>
          <DialogDescription>{t("The server is reinstalled from the image chosen. Its addresses, plan, cloud disks and firewalls stay.")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">{t("Image")}</p>
            <Select
              value={value}
              onValueChange={(v) => {
                setValue(v);
                setVersion(choices.find((c) => c.value === v)?.versions[0] ?? "");
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choices.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span dir="ltr">{c.versions.length ? c.name : c.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {chosen && chosen.versions.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">{t("Version")}</p>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger className="h-10" dir="ltr">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chosen.versions.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
          <Checkbox checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-0.5" />
          <span>{t("I confirm that everything on the boot disk of {name} is erased.", { name: server.name })}</span>
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={!chosen || !agreed}
            onClick={async () => {
              if (!chosen) return;
              if (await apiCall(() => (rebuildServer(server.id, { imageId: chosen.imageId, label }), true), t)) {
                toast.success(t("Rebuilding"));
                onClose();
              }
            }}
          >
            {t("Rebuild")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const RESCUE_SYSTEM = "rescue";

function RescueDialog({
  server,
  open,
  onClose,
  onPassword,
}: {
  server: ServerRecord;
  open: boolean;
  onClose: () => void;
  onPassword: (value: string) => void;
}) {
  const t = useT();
  const { t: ft } = useLanguage();
  const fx = ft as (k: string) => string;
  const choices = useImageChoices();
  const [value, setValue] = useState(RESCUE_SYSTEM);
  useEffect(() => {
    if (open) setValue(RESCUE_SYSTEM);
  }, [open]);
  const label = value === RESCUE_SYSTEM ? t("Rescue system (Linux)") : (choices.find((c) => c.value === value)?.label ?? "");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-uniform-type className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Start rescue")}</DialogTitle>
          <DialogDescription>
            {t("The server restarts from the image chosen, with a one-time root password. Its own disk is attached as a second disk, untouched.")}
          </DialogDescription>
        </DialogHeader>
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">{t("Boot from")}</p>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RESCUE_SYSTEM}>{t("Rescue system (Linux)")}</SelectItem>
              {choices.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span dir="ltr">{c.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("An image of your own, such as an installer, can be uploaded under Images.")}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {fx("cancel")}
          </Button>
          <Button
            onClick={async () => {
              const pw = await apiCall(() => rescueServer(server.id, label), t);
              if (!pw) return;
              onClose();
              onPassword(pw);
            }}
          >
            {t("Start rescue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

