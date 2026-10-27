import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, Copy, Download, FileKey2, KeyRound, MoreHorizontal, Plus, Server, Trash2 } from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Checkbox } from "@/features/factory/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useShellT } from "@/shared/i18n/shell";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { useT } from "../i18n";
import { useServers } from "../lib/serverStore";
import { deleteSshKeys, useSshKeys, type SshKeyRecord } from "../lib/sshKeyStore";
import { algorithmLabel, downloadText } from "../lib/sshKeyGen";
import { ConfirmDialog, CREATE_SSH_KEY_PATH, PageBreadcrumb, SERVERS_PATH, SSH_KEYS_PATH, TruncatedText } from "../ui";
import { Pill } from "../wizard";

/* SSH Keys: the public keys new servers can be given.
 *
 * The standard list: breadcrumb, header with count, the shared toolbar with
 * multi-select bulk actions, fixed columns, pagination, the empty state in
 * place of the rows. Opened, a row shows the fingerprint, the whole key and
 * the servers made with it.
 *
 * Nova cannot rename or change a key pair, so the actions are copy, download
 * and delete. Deleting a key leaves the servers made with it as they are: the
 * key was written into them when they were made.
 */

type SortKey = "newest" | "nameAsc" | "nameDesc";
type TypeFilter = "all" | "ed25519" | "rsa" | "other";

/** "ssh-ed25519 AAAAC3NzaC1lZDI1…Xk2p": the start and the end, which is how
    people tell their keys apart. */
function shortKey(k: SshKeyRecord) {
  if (k.type === "x509") return "-----BEGIN CERTIFICATE-----";
  const [type, body = ""] = k.publicKey.split(/\s+/);
  return body.length > 40 ? `${type} ${body.slice(0, 22)}…${body.slice(-10)}` : `${type} ${body}`;
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 shrink-0"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          toast.success(t("Copied"));
          window.setTimeout(() => setDone(false), 1500);
        });
      }}
    >
      {done ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

export default function SshKeys() {
  const t = useT();
  const shellT = useShellT();
  const { t: ft, isRTL, language, formatNumber } = useLanguage();
  const fx = ft as (k: string) => string;
  const navigate = useNavigate();
  const keys = useSshKeys();
  const servers = useServers();
  const madeWith = (id: string) => servers.filter((s) => s.sshKeyId === id);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return keys
      .filter(
        (k) =>
          (!q || k.name.toLowerCase().includes(q) || k.fingerprint.toLowerCase().includes(q) || k.publicKey.toLowerCase().includes(q)) &&
          (typeFilter === "all" ||
            (typeFilter === "other" ? k.algorithm !== "ed25519" && k.algorithm !== "rsa" : k.algorithm === typeFilter)),
      )
      .sort((a, b) =>
        sortKey === "nameAsc" ? a.name.localeCompare(b.name) : sortKey === "nameDesc" ? b.name.localeCompare(a.name) : b.createdAt - a.createdAt,
      );
  }, [keys, search, typeFilter, sortKey]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((k) => selected.includes(k.id));

  const downloadPublic = (k: SshKeyRecord) => downloadText(k.type === "x509" ? `${k.name}.crt` : `${k.name}.pub`, `${k.publicKey}\n`);

  const exportCsv = () => {
    const header = ["name", "type", "fingerprint", "availability", "created", "publicKey"];
    const rows = filtered.map((k) => [
      k.name,
      algorithmLabel(k.algorithm, k.bits),
      k.fingerprint,
      k.allZones ? "all zones" : `${k.region} ${k.zone}`,
      new Date(k.createdAt).toISOString(),
      k.publicKey,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadText(`ssh-keys-${Date.now()}.csv`, csv);
  };

  const filterFields: FilterField[] = [
    {
      key: "type",
      label: t("Key type"),
      value: typeFilter,
      onChange: (v) => {
        setTypeFilter(v as TypeFilter);
        setCurrentPage(1);
      },
      options: [
        { value: "all", label: fx("all") },
        { value: "ed25519", label: "Ed25519" },
        { value: "rsa", label: "RSA" },
        { value: "other", label: t("Other") },
      ],
    },
  ];
  const sortOptions: SortOption[] = [
    { key: "newest", label: t("Newest first") },
    { key: "nameAsc", label: fx("sortNameAsc") },
    { key: "nameDesc", label: fx("sortNameDesc") },
  ];
  const actionItems: ActionItem[] = [
    { key: "export", label: fx("export"), icon: Download, onSelect: exportCsv },
    { key: "delete", label: fx("delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteIds(selected) },
  ];

  const createButton = (
    <Button onClick={() => navigate(CREATE_SSH_KEY_PATH)} className="h-10 gap-2 rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
      <Plus className="h-4 w-4" />
      {t("Add SSH key")}
    </Button>
  );

  const toDelete = keys.filter((k) => deleteIds?.includes(k.id));
  const usedBy = toDelete.reduce((sum, k) => sum + madeWith(k.id).length, 0);

  return (
    <div data-uniform-type className="space-y-4 p-4 lg:p-6">
      <PageBreadcrumb items={[{ label: shellT("Security"), path: SSH_KEYS_PATH }, { label: shellT("SSH Keys") }]} />
      <PageHeader title={shellT("SSH Keys")} count={keys.length} countLabel={t("keys")} actions={createButton} />

      <Card>
        <CardContent className="pt-6">
          <ListToolbar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setCurrentPage(1);
              },
              placeholder: t("Search by name, key or fingerprint"),
            }}
            onRefresh={() => {
              setIsRefreshing(true);
              window.setTimeout(() => setIsRefreshing(false), 400);
            }}
            isRefreshing={isRefreshing}
            filter={{
              fields: filterFields,
              activeCount: typeFilter !== "all" ? 1 : 0,
              onClear: () => {
                setTypeFilter("all");
                setCurrentPage(1);
              },
            }}
            sort={{ options: sortOptions, value: sortKey, onChange: (k) => setSortKey(k as SortKey) }}
            actions={actionItems}
            selectionCount={selected.length}
          />

          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
            <Table className="min-w-[1000px] table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[36px]" />
                <col className="w-[20%]" />
                <col className="w-[32%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[96px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={(c) =>
                          setSelected(
                            c
                              ? Array.from(new Set([...selected, ...pageRows.map((k) => k.id)]))
                              : selected.filter((id) => !pageRows.some((k) => k.id === id)),
                          )
                        }
                        aria-label={t("Select all")}
                      />
                    </div>
                  </TableHead>
                  <TableHead />
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Public key")}</TableHead>
                  <TableHead>{t("Key type")}</TableHead>
                  <TableHead>{t("Availability zones")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead className="text-end">{fx("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <KeyRound className="size-7" />
                        </span>
                        <h2 className="mt-5 text-lg font-semibold text-foreground">{t("No SSH keys yet")}</h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                          {t("Add a key you already have, or make a new pair here, and log in to your servers without a password.")}
                        </p>
                        <div className="mt-6">{createButton}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <p className="py-12 text-center text-muted-foreground">{t("No keys match these filters.")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((k) => {
                    const isExpanded = expanded.includes(k.id);
                    const toggle = () => setExpanded((prev) => (prev.includes(k.id) ? prev.filter((x) => x !== k.id) : [...prev, k.id]));
                    const used = madeWith(k.id);
                    return (
                      <Fragment key={k.id}>
                        <TableRow className="cursor-pointer border-b hover:bg-muted/30" onClick={toggle}>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={selected.includes(k.id)}
                                onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, k.id] : prev.filter((id) => id !== k.id)))}
                                aria-label={k.name}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                {k.type === "x509" ? <FileKey2 className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                              </span>
                              <TruncatedText text={k.name} ltr className="font-medium text-foreground" />
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex min-w-0 items-center gap-1">
                              <TruncatedText text={shortKey(k)} ltr mono />
                              <CopyButton text={k.publicKey} label={t("Copy public key")} />
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            <span dir="ltr">{algorithmLabel(k.algorithm, k.bits)}</span>
                          </TableCell>
                          <TableCell>
                            {k.allZones ? (
                              <Pill tone="ok">{t("All zones")}</Pill>
                            ) : (
                              <span className="text-muted-foreground">
                                {t(k.region)} · <span dir="ltr">{k.zone}</span>
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <TruncatedText text={formatDateTime(k.createdAt, language)} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label={fx("actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] w-52 bg-background">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void navigator.clipboard?.writeText(k.publicKey).then(() => toast.success(t("Copied")))
                                    }
                                  >
                                    <Copy className="me-2 h-4 w-4" />
                                    {t("Copy public key")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => downloadPublic(k)}>
                                    <Download className="me-2 h-4 w-4" />
                                    {t("Download public key")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteIds([k.id])}>
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {fx("delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* The fingerprint first: it is what ssh shows on a first login. */}
                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                                <div className="space-y-3 rounded-lg border bg-background px-4 py-3">
                                  <Detail label={t("Fingerprint")} help={k.type === "x509" ? "SHA-1" : t("SHA-256, as ssh-keygen -l shows it")}>
                                    <div className="flex min-w-0 items-center gap-1">
                                      <code dir="ltr" className="min-w-0 break-all font-mono text-[13px] text-foreground">
                                        {k.fingerprint}
                                      </code>
                                      <CopyButton text={k.fingerprint} label={t("Copy fingerprint")} />
                                    </div>
                                  </Detail>
                                  <Detail label={k.type === "x509" ? t("Certificate") : t("Public key")}>
                                    <div className="relative rounded-md border border-border bg-muted/40 p-2.5 pe-10">
                                      <pre dir="ltr" className="max-h-28 overflow-y-auto whitespace-pre-wrap break-all text-start font-mono text-xs leading-5 text-foreground">
                                        {k.publicKey}
                                      </pre>
                                      <div className="absolute end-1.5 top-1.5">
                                        <CopyButton text={k.publicKey} label={t("Copy public key")} />
                                      </div>
                                    </div>
                                  </Detail>
                                </div>
                                <div className="space-y-3 rounded-lg border bg-background px-4 py-3">
                                  <Detail label={t("Origin")}>
                                    <span className="text-sm text-foreground">{k.origin === "generated" ? t("Made in the panel") : t("Added from your computer")}</span>
                                  </Detail>
                                  <Detail label={t("Servers made with it")}>
                                    {used.length === 0 ? (
                                      <span className="text-sm text-muted-foreground">{t("None yet")}</span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {used.map((s) => (
                                          <button
                                            key={s.id}
                                            type="button"
                                            dir="ltr"
                                            onClick={() => navigate(SERVERS_PATH)}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:border-primary/40 hover:text-primary"
                                          >
                                            <Server className="size-3.5 text-muted-foreground" />
                                            {s.name}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </Detail>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > itemsPerPage && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{fx("rowsPerPage")}</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="min-w-[70px]" sideOffset={4}>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ms-3 text-sm text-muted-foreground">
                  {formatNumber(startIndex + 1)}-{formatNumber(Math.min(endIndex, filtered.length))} {fx("of")}{" "}
                  {formatNumber(filtered.length)}
                </span>
              </div>
              <SmartPagination
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onChange={(p) => p >= 1 && p <= totalPages && setCurrentPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteIds}
        onClose={() => setDeleteIds(null)}
        title={toDelete.length === 1 ? t("Delete {name}?", { name: toDelete[0].name }) : t("Delete {n} keys?", { n: formatNumber(toDelete.length) })}
        description={[
          t("New servers can no longer be given these keys. This cannot be undone."),
          usedBy > 0
            ? t("{n} servers were made with them and keep them: to stop a key working there, remove it from ~/.ssh/authorized_keys on each server.", {
                n: formatNumber(usedBy),
              })
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        destructive
        confirmLabel={fx("delete")}
        onConfirm={() => {
          deleteSshKeys(deleteIds ?? []);
          setSelected((prev) => prev.filter((id) => !deleteIds?.includes(id)));
          setExpanded((prev) => prev.filter((id) => !deleteIds?.includes(id)));
          toast.success(t("Keys deleted"));
          setDeleteIds(null);
        }}
      />
    </div>
  );
}

function Detail({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className={cn("mb-1 text-xs font-medium text-muted-foreground")}>
        {label}
        {help && <span className="ms-1.5 font-normal text-muted-foreground/80">({help})</span>}
      </p>
      {children}
    </div>
  );
}
