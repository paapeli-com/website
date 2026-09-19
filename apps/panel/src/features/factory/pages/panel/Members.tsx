import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/shared/lib/formatDate";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { ListToolbar, type FilterField } from "@/features/factory/components/panel/ListToolbar";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { useToast } from "@/features/factory/hooks/use-toast";
import { Button } from "@/features/factory/components/ui/button";
import { Badge } from "@/features/factory/components/ui/badge";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/features/factory/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/features/factory/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/features/factory/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Plus, MoreHorizontal, Eye, Pencil, UserX, Trash2, Mail, Users as UsersIcon,
  Send, X as XIcon, ShieldCheck, ShieldAlert, Shield, Wrench, EyeIcon, Sparkles, Clock,
} from "lucide-react";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import {
  MEMBERS_STORAGE_KEY, MOCK_MEMBERS, mkInitials,
  type AiotRole, type Member, type MemberStatus,
} from "@/features/factory/data/workspaceMembers";

// ---------------- Types ----------------
type InviteStatus = "Pending" | "Accepted" | "Expired" | "Cancelled";

interface Invitation {
  id: string;
  email: string;
  role: AiotRole;
  invitedBy: string;
  sentAt: string;
  status: InviteStatus;
}

// ---------------- Storage ----------------
const LS = {
  members: MEMBERS_STORAGE_KEY,
  invites: "paapeli.members.invites.v3",
};
const loadLS = <T,>(k: string, fb: T): T => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : fb; } catch { return fb; }
};
const saveLS = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ---------------- Mock seeds ----------------
// The member seed lives in data/workspaceMembers, shared with channel pickers.
const MOCK_INVITES: Invitation[] = [
  { id: "i-1", email: "ali.tehrani@company.com", role: "Editor", invitedBy: "Armin Rajabi", sentAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), status: "Pending" },
  { id: "i-2", email: "leila.kazemi@company.com", role: "Viewer", invitedBy: "Armin Rajabi", sentAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(), status: "Pending" },
  { id: "i-3", email: "reza.aghaei@company.com", role: "Operator", invitedBy: "Sara Mohammadi", sentAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString(), status: "Expired" },
  { id: "i-4", email: "shirin.mansour@company.com", role: "Manager", invitedBy: "Armin Rajabi", sentAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), status: "Accepted" },
];

// ---------------- Helpers ----------------
const useRoleLabel = () => {
  const { t } = useLanguage();
  return (r: AiotRole) =>
    ({
      "Full Access": t("roleFull"),
      "Manager": t("roleManager"),
      "Editor": t("roleEditor"),
      "Operator": t("roleOperator"),
      "Viewer": t("roleViewer"),
      "Custom": t("roleCustom"),
    }[r]);
};
const useStatusLabel = () => {
  const { t } = useLanguage();
  return (s: MemberStatus | InviteStatus) =>
    ({
      "Active": t("memberStatusActive"),
      "Pending": t("memberStatusPending"),
      "Disabled": t("memberStatusDisabled"),
      "Accepted": t("statusAccepted") || "Accepted",
      "Expired": t("statusExpired") || "Expired",
      "Cancelled": t("woStatusCancelled"),
    }[s]);
};

const useFmtRel = () => {
  const { t, formatNumber } = useLanguage();
  return (iso?: string) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("justNow");
    if (m < 60) return t("minAgo").replace("{n}", formatNumber(m));
    const h = Math.floor(m / 60);
    if (h < 24) return h === 1 ? t("hourAgo") : t("hoursAgo").replace("{n}", formatNumber(h));
    const d = Math.floor(h / 24);
    if (d === 1) return t("yesterday");
    if (d < 7) return t("daysAgo").replace("{n}", formatNumber(d));
    if (d < 14) return t("oneWeekAgo");
    if (d < 30) return t("weeksAgo").replace("{n}", formatNumber(Math.floor(d / 7)));
    return formatDate(iso);
  };
};

const roleBadgeClass = (r: AiotRole) => {
  const map: Record<AiotRole, string> = {
    "Full Access": "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
    "Manager":     "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
    "Editor":      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    "Operator":    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    "Viewer":      "bg-muted text-muted-foreground border-border",
    "Custom":      "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/30",
  };
  return map[r];
};

const statusBadgeClass = (s: MemberStatus | InviteStatus) => {
  const map: Record<string, string> = {
    "Active":    "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    "Pending":   "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    "Disabled":  "bg-muted text-muted-foreground border-border",
    "Accepted":  "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    "Expired":   "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    "Cancelled": "bg-muted text-muted-foreground border-border",
  };
  return map[s];
};

const AIOT_ROLES: AiotRole[] = ["Full Access", "Manager", "Editor", "Operator", "Viewer"];

// ---------------- Roles tab cards data ----------------
const ROLE_CARDS: { role: AiotRole; icon: any; descKey: string; disabled?: boolean }[] = [
  { role: "Full Access", icon: ShieldCheck, descKey: "roleFullDesc" },
  { role: "Manager",     icon: ShieldAlert, descKey: "roleManagerDesc" },
  { role: "Editor",      icon: Pencil,      descKey: "roleEditorDesc" },
  { role: "Operator",    icon: Wrench,      descKey: "roleOperatorDesc" },
  { role: "Viewer",      icon: EyeIcon,     descKey: "roleViewerDesc" },
  { role: "Custom",      icon: Sparkles,    descKey: "roleCustomDesc", disabled: true },
];

// ============================================================
const MembersPage = () => {
  const { isRTL, language, t, formatNumber } = useLanguage();
  const roleLabel = useRoleLabel();
  const statusLabel = useStatusLabel();
  const fmtRel = useFmtRel();
  const roleBadge = (r: AiotRole) => (
    <Badge variant="outline" className={`${roleBadgeClass(r)} font-medium`}>{roleLabel(r)}</Badge>
  );
  const statusBadge = (s: MemberStatus | InviteStatus) => (
    <Badge variant="outline" className={`${statusBadgeClass(s)} font-medium`}>{statusLabel(s)}</Badge>
  );
  const { toast } = useToast();
  const navigate = useNavigate();
  const lp = (p: string) => localizedPath(p, language);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs = ["members", "invitations", "roles"] as const;
  const initialTab = (validTabs.includes(tabParam as any) ? tabParam : "members") as typeof validTabs[number];
  const [tab, setTabState] = useState<typeof validTabs[number]>(initialTab);
  const setTab = (v: typeof validTabs[number]) => {
    setTabState(v);
    const next = new URLSearchParams(searchParams);
    if (v === "members") next.delete("tab"); else next.set("tab", v);
    setSearchParams(next, { replace: true });
  };
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam as any) && tabParam !== tab) setTabState(tabParam as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // Data
  const [members, setMembers] = useState<Member[]>(() => loadLS(LS.members, MOCK_MEMBERS));
  const [invites, setInvites] = useState<Invitation[]>(() => loadLS(LS.invites, MOCK_INVITES));
  useEffect(() => saveLS(LS.members, members), [members]);
  useEffect(() => saveLS(LS.invites, invites), [invites]);

  // Members toolbar
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Invitations toolbar
  const [invSearch, setInvSearch] = useState("");
  const [invStatusFilter, setInvStatusFilter] = useState<string>("all");
  const [invPage, setInvPage] = useState(1);

  // Dialogs
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<AiotRole>("Viewer");
  const [confirmDisable, setConfirmDisable] = useState<Member | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);
  const [confirmCancelInvite, setConfirmCancelInvite] = useState<Invitation | null>(null);

  // Filtering / sorting
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesQ = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      const matchesR = roleFilter === "all" || m.role === roleFilter;
      const matchesS = statusFilter === "all" || m.status === statusFilter;
      return matchesQ && matchesR && matchesS;
    });
  }, [members, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const pagedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const filteredInvites = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return invites.filter((i) => {
      const matchesQ = !q || i.email.toLowerCase().includes(q);
      const matchesS = invStatusFilter === "all" || i.status === invStatusFilter;
      return matchesQ && matchesS;
    });
  }, [invites, invSearch, invStatusFilter]);
  const invTotalPages = Math.max(1, Math.ceil(filteredInvites.length / pageSize));
  const pagedInvites = filteredInvites.slice((invPage - 1) * pageSize, invPage * pageSize);
  useEffect(() => { if (invPage > invTotalPages) setInvPage(1); }, [invTotalPages, invPage]);

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: t("membersRefreshed"), description: t("membersListUpdated") });
    }, 500);
  };

  const handleSaveRole = () => {
    if (!editMember) return;
    setMembers((prev) => prev.map((m) => (m.id === editMember.id ? { ...m, role: editRoleValue } : m)));
    toast({ title: t("roleUpdated"), description: t("roleUpdatedDesc").replace("{name}", editMember.name).replace("{role}", roleLabel(editRoleValue)) });
    setEditMember(null);
  };

  const handleDisable = () => {
    if (!confirmDisable) return;
    setMembers((prev) => prev.map((m) => (m.id === confirmDisable.id
      ? { ...m, status: m.status === "Disabled" ? "Active" : "Disabled" } : m)));
    toast({ title: confirmDisable.status === "Disabled" ? t("userEnabled") : t("userDisabled") });
    setConfirmDisable(null);
  };

  const handleRemove = () => {
    if (!confirmRemove) return;
    setMembers((prev) => prev.filter((m) => m.id !== confirmRemove.id));
    toast({ title: t("memberRemoved"), description: confirmRemove.email });
    setConfirmRemove(null);
  };

  const handleResendInvite = (inv: Invitation) => {
    setInvites((prev) => prev.map((i) => i.id === inv.id
      ? { ...i, status: "Pending", sentAt: new Date().toISOString() } : i));
    toast({ title: t("invitationResent"), description: inv.email });
  };

  const handleCancelInvite = () => {
    if (!confirmCancelInvite) return;
    setInvites((prev) => prev.map((i) => i.id === confirmCancelInvite.id ? { ...i, status: "Cancelled" } : i));
    toast({ title: t("invitationCancelled"), description: confirmCancelInvite.email });
    setConfirmCancelInvite(null);
  };

  const memberFilters: FilterField[] = [
    {
      key: "role", label: t("aiotRole"), value: roleFilter, onChange: setRoleFilter,
      options: [{ value: "all", label: t("allRoles") }, ...AIOT_ROLES.map((r) => ({ value: r, label: roleLabel(r) }))],
    },
    {
      key: "status", label: t("status"), value: statusFilter, onChange: setStatusFilter,
      options: [
        { value: "all", label: t("allStatuses") },
        { value: "Active", label: t("memberStatusActive") },
        { value: "Pending", label: t("memberStatusPending") },
        { value: "Disabled", label: t("memberStatusDisabled") },
      ],
    },
  ];

  const invFilters: FilterField[] = [
    {
      key: "status", label: t("status"), value: invStatusFilter, onChange: setInvStatusFilter,
      options: [
        { value: "all", label: t("allStatuses") },
        { value: "Pending", label: t("memberStatusPending") },
        { value: "Accepted", label: t("statusAccepted") },
        { value: "Expired", label: t("statusExpired") },
        { value: "Cancelled", label: t("woStatusCancelled") },
      ],
    },
  ];

  const activeMemberFilters =
    (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  return (
    <>
      <PageHeader
        title={t("members")}
        count={members.length}
        countLabel={t("members")}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={UsersIcon}    label={t("totalMembers")}       value={formatNumber(members.length)}                                          sublabel={t("allMembers")}        tone="violet" />
        <KpiCard icon={ShieldCheck}  label={t("activeMembers")}      value={formatNumber(members.filter((m) => m.status === "Active").length)}     sublabel={t("currentlyActive")}   tone="green" />
        <KpiCard icon={Clock}        label={t("pendingInvitations")} value={formatNumber(invites.filter((i) => i.status === "Pending").length)}    sublabel={t("invitationsSent")}   tone="amber" />
        <KpiCard icon={Shield}       label={t("rolesLabel")}         value={formatNumber(ROLE_CARDS.length)}                                       sublabel={t("systemRoles")}       tone="blue" />
      </div>


      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members"><UsersIcon className="h-4 w-4 me-2" />{t("members")}</TabsTrigger>
          <TabsTrigger value="invitations"><Mail className="h-4 w-4 me-2" />{t("invitationsTab")}</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="h-4 w-4 me-2" />{t("rolesLabel")}</TabsTrigger>
        </TabsList>

        {/* ===================== MEMBERS TAB ===================== */}
        <TabsContent value="members">
          <ListToolbar
            search={{ value: search, onChange: setSearch, placeholder: t("searchMembersPlaceholder") }}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            filter={{ fields: memberFilters, activeCount: activeMemberFilters, onClear: () => { setRoleFilter("all"); setStatusFilter("all"); } }}
            rightExtras={
              <Button
                onClick={() => navigate(lp("/members/invite"))}
                className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> {t("inviteMemberBtn")}
              </Button>
            }
          />

          <Card className="overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("memberLabel")}</TableHead>
                  <TableHead>{t("emailLabel")}</TableHead>
                  <TableHead>{t("aiotRole")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("lastLogin")}</TableHead>
                  <TableHead className="text-end">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      {t("noMembersFound")}
                    </TableCell>
                  </TableRow>
                ) : pagedMembers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${m.avatarTone || "bg-primary/15 text-primary"}`}>
                          {m.initials || mkInitials(m.name)}
                        </div>
                        <span className="truncate font-medium">{m.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>{roleBadge(m.role)}</TableCell>
                    <TableCell>{statusBadge(m.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtRel(m.lastLogin)}</TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] min-w-[180px]">
                          <DropdownMenuItem onClick={() => setViewMember(m)}>
                            <Eye className="h-4 w-4 me-2" /> {t("viewMember")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditMember(m); setEditRoleValue(m.role === "Custom" ? "Viewer" : m.role); }}>
                            <Pencil className="h-4 w-4 me-2" /> {t("editRole")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmDisable(m)}>
                            <UserX className="h-4 w-4 me-2" /> {m.status === "Disabled" ? t("enableUser") : t("disableUser")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setConfirmRemove(m)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 me-2" /> {t("removeMemberItem")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {filteredMembers.length > pageSize && (
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground">
                {t("showingResults")
                  .replace("{from}", formatNumber((page - 1) * pageSize + 1))
                  .replace("{to}", formatNumber(Math.min(page * pageSize, filteredMembers.length)))
                  .replace("{total}", formatNumber(filteredMembers.length))}
              </div>
              <SmartPagination
                currentPage={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </TabsContent>

        {/* ===================== INVITATIONS TAB ===================== */}
        <TabsContent value="invitations">
          <ListToolbar
            search={{ value: invSearch, onChange: setInvSearch, placeholder: t("searchInvitationsPlaceholder") }}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            filter={{ fields: invFilters, activeCount: invStatusFilter !== "all" ? 1 : 0, onClear: () => setInvStatusFilter("all") }}
            rightExtras={
              <Button
                onClick={() => navigate(lp("/members/invite"))}
                className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> {t("inviteMemberBtn")}
              </Button>
            }
          />

          <Card className="overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("emailLabel")}</TableHead>
                  <TableHead>{t("aiotRole")}</TableHead>
                  <TableHead>{t("invitedByLabel")}</TableHead>
                  <TableHead>{t("sentAt")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-end">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedInvites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      {t("noInvitations")}
                    </TableCell>
                  </TableRow>
                ) : pagedInvites.map((i) => {
                  const isPending = i.status === "Pending";
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.email}</TableCell>
                      <TableCell>{roleBadge(i.role)}</TableCell>
                      <TableCell className="text-muted-foreground">{i.invitedBy}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtRel(i.sentAt)}</TableCell>
                      <TableCell>{statusBadge(i.status)}</TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? "start" : "end"} className="z-[100] min-w-[180px]">
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(i)}
                              disabled={i.status === "Accepted"}
                            >
                              <Send className="h-4 w-4 me-2" /> {t("resendInvitation")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setConfirmCancelInvite(i)}
                              disabled={!isPending}
                              className="text-destructive focus:text-destructive"
                            >
                              <XIcon className="h-4 w-4 me-2" /> {t("cancelInvitationItem")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {filteredInvites.length > pageSize && (
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground">
                {t("showingResults")
                  .replace("{from}", formatNumber((invPage - 1) * pageSize + 1))
                  .replace("{to}", formatNumber(Math.min(invPage * pageSize, filteredInvites.length)))
                  .replace("{total}", formatNumber(filteredInvites.length))}
              </div>
              <SmartPagination
                currentPage={invPage}
                totalPages={invTotalPages}
                onChange={setInvPage}
              />
            </div>
          )}
        </TabsContent>

        {/* ===================== ROLES TAB ===================== */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir={isRTL ? "rtl" : "ltr"}>
            {ROLE_CARDS.map((rc) => {
              const Icon = rc.icon;
              return (
                <Card key={rc.role} className={`p-5 ${rc.disabled ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{roleLabel(rc.role)}</h3>
                        {rc.disabled && (
                          <Badge variant="outline" className="text-[10px] py-0 h-5">{t("informational")}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(rc.descKey as any)}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Member */}
      <Sheet open={!!viewMember} onOpenChange={(o) => !o && setViewMember(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
          {viewMember && (
            <>
              <SheetHeader>
                <SheetTitle>{viewMember.name}</SheetTitle>
                <SheetDescription>{viewMember.email}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6 text-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center text-lg font-semibold ${viewMember.avatarTone || "bg-primary/15 text-primary"}`}>
                    {viewMember.initials || mkInitials(viewMember.name)}
                  </div>
                  <div>
                    <div className="font-medium">{viewMember.name}</div>
                    <div className="text-muted-foreground text-xs">{viewMember.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-xs text-muted-foreground mb-1">{t("aiotRole")}</div>{roleBadge(viewMember.role)}</div>
                  <div><div className="text-xs text-muted-foreground mb-1">{t("status")}</div>{statusBadge(viewMember.status)}</div>
                  <div className="col-span-2"><div className="text-xs text-muted-foreground mb-1">{t("lastLogin")}</div><div>{fmtRel(viewMember.lastLogin)}</div></div>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setEditMember(viewMember); setEditRoleValue(viewMember.role === "Custom" ? "Viewer" : viewMember.role); setViewMember(null); }}>
                    <Pencil className="h-4 w-4 me-2" /> {t("editRole")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Role */}
      <Sheet open={!!editMember} onOpenChange={(o) => !o && setEditMember(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
          {editMember && (
            <>
              <SheetHeader>
                <SheetTitle>{t("editRole")}</SheetTitle>
                <SheetDescription>{editMember.name} · {editMember.email}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("aiotRole")}</label>
                  <Select value={editRoleValue} onValueChange={(v) => setEditRoleValue(v as AiotRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      {AIOT_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditMember(null)}>{t("cancel")}</Button>
                  <Button className="flex-1" onClick={handleSaveRole}>{t("save")}</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Disable / Enable */}
      <AlertDialog open={!!confirmDisable} onOpenChange={(o) => !o && setConfirmDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDisable?.status === "Disabled" ? t("enableUserQ") : t("disableUserQ")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(confirmDisable?.status === "Disabled" ? t("enableUserDesc") : t("disableUserDesc"))
                .replace("{name}", confirmDisable?.name || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable}>
              {confirmDisable?.status === "Disabled" ? t("enable") : t("disable")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeMember")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeMemberDesc")
                .replace("{name}", confirmRemove?.name || "")
                .replace("{email}", confirmRemove?.email || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel invitation */}
      <AlertDialog open={!!confirmCancelInvite} onOpenChange={(o) => !o && setConfirmCancelInvite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelInvitation")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelInvitationDesc").replace("{email}", confirmCancelInvite?.email || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keep")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvite} className="bg-destructive hover:bg-destructive/90">
              {t("cancelInvitationItem")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const KpiCard = ({
  icon: Icon, label, value, sublabel, tone,
}: {
  icon: any; label: string; value: string | number; sublabel?: string;
  tone: "primary" | "amber" | "red" | "blue" | "green" | "violet";
}) => {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600",
    red: "bg-red-500/10 text-red-600",
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-emerald-500/10 text-emerald-600",
    violet: "bg-violet-500/10 text-violet-600",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold leading-tight mt-0.5">{value}</div>
          {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default MembersPage;

