import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Edit, Trash2, Mail, MessageSquare, Globe, Bell, Radio,
  Download, Pencil, Archive,
} from "lucide-react";
import { mockNotificationChannels } from "@/data/mockAlertData";
import type { NotificationChannelType } from "@/types/alerts";
import { ListToolbar, type ActionItem, type FilterField, type SortOption } from "@/components/panel/ListToolbar";
import { SmartPagination } from "@/components/SmartPagination";
import { useChannelsStore } from "@/hooks/useAlertStore";

const channelIcons: Record<NotificationChannelType, any> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  webhook: Globe,
  in_app: Bell,
  mqtt: Radio,
};

const channelLabels: Record<NotificationChannelType, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  webhook: "Webhook",
  in_app: "In-App",
  mqtt: "MQTT",
};

interface NotificationChannelsProps {
  onCreateClick?: () => void;
}

export const NotificationChannels = ({ onCreateClick }: NotificationChannelsProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;
  const { items: userChannels } = useChannelsStore();
  const [mockChannels, setMockChannels] = useState(mockNotificationChannels);
  const channels = useMemo(() => [...userChannels, ...mockChannels], [userChannels, mockChannels]);
  const setChannels = (updater: (prev: typeof mockNotificationChannels) => typeof mockNotificationChannels) => setMockChannels(updater);

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

  const toggleChannel = (id: string) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

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
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {channels.length} {t("alertChannelsCount")}
        </p>
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

      <div className="rounded-lg border bg-card overflow-hidden">
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
              const Icon = channelIcons[channel.type];
              return (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {channel.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{channelLabels[channel.type]}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                    {Object.entries(channel.config).map(([k, v]) => {
                      const labelKey = k === "to" ? "configFieldTo" : k === "topic" ? "configFieldTopic" : k === "url" ? "configFieldUrl" : k;
                      const translated = t(labelKey as any);
                      return `${translated || k}: ${v}`;
                    }).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={channel.enabled} onCheckedChange={() => toggleChannel(channel.id)} />
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
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  {tt("noResults") || "No results"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end">
          <SmartPagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
};
