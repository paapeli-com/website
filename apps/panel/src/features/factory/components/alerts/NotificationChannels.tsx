import { useMemo, useState } from "react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Switch } from "@/features/factory/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import {
  Plus, Edit, Trash2, Mail, MessageSquare, Bell, Phone,
  Download, Pencil, Archive,
} from "lucide-react";
import type { NotificationChannelType } from "@/features/factory/types/alerts";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/features/factory/components/panel/ListToolbar";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { AddFirst } from "@/features/factory/components/AddFirst";
import { SmartPagination } from "@/features/factory/components/SmartPagination";
import { useChannelsStore } from "@/features/factory/hooks/useAlertStore";

const channelIcons: Record<NotificationChannelType, any> = {
  phone: Phone,
  sms: MessageSquare,
  email: Mail,
  in_app: Bell,
};

const channelLabels: Record<NotificationChannelType, string> = {
  phone: "Phone",
  sms: "SMS",
  email: "Email",
  in_app: "In-App",
};

interface NotificationChannelsProps {
  onCreateClick?: () => void;
}

export const NotificationChannels = ({ onCreateClick }: NotificationChannelsProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  /* Only what the user actually created (localStorage-backed). The seeded
     email/SMS/webhook channels that used to be concatenated here were
     invented — there is no channels endpoint yet, so an empty store means
     no data rather than an empty result set. */
  const { items: storedChannels } = useChannelsStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState("nameAsc");
  const [listView, setListView] = useState<"table" | "grid" | "compact" | "board">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  /* The switch was never persisted for the seeded channels either; this keeps
     it responsive without claiming a write the store cannot make. */
  const [enabledOverrides, setEnabledOverrides] = useState<Record<string, boolean>>({});
  const isEnabled = (id: string, fallback: boolean) => enabledOverrides[id] ?? fallback;
  const toggleChannel = (id: string, current: boolean) => {
    setEnabledOverrides((prev) => ({ ...prev, [id]: !current }));
  };

  const channels = useMemo(
    () => storedChannels.map((c) => ({ ...c, enabled: isEnabled(c.id, c.enabled) })),
    [storedChannels, enabledOverrides],
  );

  const filtered = useMemo(() => {
    return channels
      .filter((c) => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== "all") {
          const on = statusFilter === "enabled";
          if (c.enabled !== on) return false;
        }
        if (typeFilter !== "all" && c.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "nameDesc": return b.name.localeCompare(a.name);
          case "type": return a.type.localeCompare(b.type);
          case "nameAsc":
          default: return a.name.localeCompare(b.name);
        }
      });
  }, [channels, search, statusFilter, typeFilter, sortKey]);

  const filterFields: FilterField[] = [
    {
      key: "status", label: tt("status"), value: statusFilter, onChange: setStatusFilter,
      options: [
        { value: "all", label: tt("all") },
        { value: "enabled", label: tt("enabled") },
        { value: "disabled", label: tt("disabled") || "Disabled" },
      ],
    },
    {
      key: "type", label: tt("alertChannelType"), value: typeFilter, onChange: setTypeFilter,
      options: [
        { value: "all", label: tt("all") },
        ...Object.keys(channelLabels).map((k) => ({ value: k, label: channelLabels[k as NotificationChannelType] })),
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { key: "nameAsc", label: tt("sortNameAsc") },
    { key: "nameDesc", label: tt("sortNameDesc") },
    { key: "type", label: tt("alertChannelType") },
  ];

  const handleExport = () => {
    const header = ["id", "name", "type", "enabled"];
    const csv = [
      header.join(","),
      ...filtered.map((c) => header.map((h) => `"${String((c as any)[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `channels-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const actionItems: ActionItem[] = [
    { key: "export", label: tt("export"), icon: Download, onSelect: handleExport },
    { key: "bulkEdit", label: tt("bulkEdit"), icon: Pencil, comingSoon: true },
    { key: "archive", label: tt("archive"), icon: Archive, comingSoon: true },
    { key: "delete", label: tt("delete"), icon: Trash2, destructive: true, comingSoon: true },
  ];

  const activeFilterCount = [statusFilter, typeFilter].filter((v) => v !== "all").length;

  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-end items-center">
        <Button
          size="sm"
          onClick={onCreateClick}
          disabled={!onCreateClick}
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 gap-2 rounded-md"
        >
          <Plus className="h-4 w-4" />
          {t("alertAddChannel")}
        </Button>
      </div>

      {/* Toolbar, table and pagination in one card, the shape every other
          list on the panel uses. */}
      <Card>
        <CardContent className="pt-6">

      <ListToolbar
        search={{ value: search, onChange: setSearch, placeholder: tt("search") }}
        view={{ value: listView, onChange: setListView, available: ["table"] }}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        filter={{
          fields: filterFields,
          activeCount: activeFilterCount,
          onClear: () => { setStatusFilter("all"); setTypeFilter("all"); },
        }}
        sort={{ options: sortOptions, value: sortKey, onChange: setSortKey }}
        actions={actionItems}
        selectionCount={0}
      />

      <div className="relative rounded-lg border bg-card overflow-hidden text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("alertChannelType")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("alertChannelConfig")}</TableHead>
              <TableHead>{t("enabled")}</TableHead>
              <TableHead className="w-[80px] text-end">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((channel) => {
              // Channels saved before WhatsApp, Webhook and MQTT were dropped keep
              // their type in the browser; show them with its raw name.
              const Icon = channelIcons[channel.type] ?? Bell;
              return (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {channel.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{channelLabels[channel.type] ?? channel.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                    {Object.entries(channel.config).map(([k, v]) => {
                      const labelKey = k === "to" ? "configFieldTo" : k === "topic" ? "configFieldTopic" : k === "url" ? "configFieldUrl" : k;
                      const translated = t(labelKey as any);
                      return `${translated || k}: ${v}`;
                    }).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={channel.enabled} onCheckedChange={() => toggleChannel(channel.id, channel.enabled)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" disabled>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("settingsComingSoon")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" disabled>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("settingsComingSoon")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {paged.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-0">
                  {/* Nothing stored at all offers the way to start; nothing
                      matching the current search or filters is a different
                      thing and says so. */}
                  {channels.length === 0 ? (
                    <AddFirst icon={Bell} label={tt("addYourFirstChannel")} onAction={() => onCreateClick?.()} />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-10">{tt("noResults") || "No results"}</p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end mt-4 pt-4">
          <SmartPagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

        </CardContent>
      </Card>
    </div>
  );
};
