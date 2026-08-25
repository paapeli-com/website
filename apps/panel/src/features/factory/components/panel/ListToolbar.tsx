import { ReactNode } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ArrowUpDown,
  Rows3,
  LayoutGrid,
  Table as TableIcon,
  Columns3,
  X,
} from "lucide-react";
import { Input } from "@/features/factory/components/ui/input";
import { Button } from "@/features/factory/components/ui/button";
import { Label } from "@/features/factory/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/factory/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/features/factory/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/factory/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/features/factory/components/ui/tooltip";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { cn } from "@/shared/lib/utils";

export type ViewMode = "table" | "grid" | "compact" | "board";

export type FilterField = {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export type SortOption = { key: string; label: string };

export type ActionItem = {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onSelect?: () => void;
};

export interface ListToolbarProps {
  search: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  view?: {
    value: ViewMode;
    onChange: (v: ViewMode) => void;
    available?: ViewMode[]; // modes that are implemented; others render disabled
  };
  onRefresh?: () => void;
  isRefreshing?: boolean;
  filter?: {
    fields: FilterField[];
    onClear?: () => void;
    activeCount?: number;
  };
  sort?: {
    options: SortOption[];
    value: string;
    onChange: (k: string) => void;
  };
  actions?: ActionItem[];
  selectionCount?: number;
  className?: string;
  rightExtras?: ReactNode;
}

export function ListToolbar({
  search,
  view,
  onRefresh,
  isRefreshing,
  filter,
  sort,
  actions,
  selectionCount = 0,
  className,
  rightExtras,
}: ListToolbarProps) {
  const { t, isRTL } = useLanguage();

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 mb-6",
        className,
      )}
    >
      {/* Search (left) */}
      <div className="relative flex-1 min-w-[240px] max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <Search
          className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`}
        />
        <Input
          dir={isRTL ? "rtl" : "ltr"}
          placeholder={search.placeholder || t("search")}
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          className={`${isRTL ? "pr-9 text-right placeholder:text-right" : "pl-9 text-left placeholder:text-left"} h-9 rounded-full text-xs`}
        />
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 text-xs">

        {/* View switch */}
        {view && (
          <ViewSwitch
            value={view.value}
            onChange={view.onChange}
            available={view.available ?? ["table", "grid", "compact", "board"]}
          />
        )}

        {/* Refresh */}
        {onRefresh && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  aria-label={t("refresh")}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      isRefreshing && "animate-spin",
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("refresh")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Filter */}
        {filter && filter.fields.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 text-xs">
                <Filter className="h-4 w-4" />
                {t("filters")}
                {filter.activeCount ? (
                  <span className="ms-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                    {filter.activeCount}
                  </span>
                ) : (
                  <ChevronDown className="h-4 w-4 opacity-60" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[300px] p-4"
              align={isRTL ? "start" : "end"}
              sideOffset={6}
            >
              <div className="space-y-4">
                {filter.fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {f.label}
                    </Label>
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {f.options.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {filter.onClear && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={filter.onClear}
                  >
                    <X className="h-3.5 w-3.5 me-2" />
                    {t("clear")}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Sort */}
        {sort && sort.options.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 text-xs">
                <ArrowUpDown className="h-4 w-4" />
                {t("sort")}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isRTL ? "start" : "end"}
              className="z-[100] min-w-[200px]"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t("sort")}
              </DropdownMenuLabel>
              {sort.options.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => sort.onChange(opt.key)}
                  className={cn(
                    sort.value === opt.key && "bg-primary/10 text-primary",
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 gap-2 text-xs"
                disabled={selectionCount === 0}
              >
                {t("actions")}
                {selectionCount > 0 && (
                  <span className="ms-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                    {selectionCount}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isRTL ? "start" : "end"}
              className="z-[100] min-w-[180px]"
            >
              {actions.map((a, i) => {
                const Icon = a.icon;
                const isDestructive = a.destructive;
                const isDisabled = a.disabled || a.comingSoon;
                const showSep = isDestructive && i > 0 && !actions[i - 1].destructive;
                return (
                  <div key={a.key}>
                    {showSep && <DropdownMenuSeparator />}
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <DropdownMenuItem
                              disabled={isDisabled}
                              onClick={() => !isDisabled && a.onSelect?.()}
                              className={cn(
                                isDestructive &&
                                  "text-destructive focus:text-destructive",
                              )}
                            >
                              {Icon && <Icon className="h-4 w-4 me-2" />}
                              {a.label}
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        {a.comingSoon && (
                          <TooltipContent>{t("comingSoon")}</TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {rightExtras}
      </div>
    </div>
  );
}

function ViewSwitch({
  value,
  onChange,
  available,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  available: ViewMode[];
}) {
  const { t } = useLanguage();
  const modes: { key: ViewMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "table", icon: TableIcon, label: t("viewTable") },
    { key: "board", icon: Columns3, label: t("viewBoard") },
    { key: "grid", icon: LayoutGrid, label: t("viewGrid") },
    { key: "compact", icon: Rows3, label: t("viewCompact") },
  ];

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5 h-9">
      <TooltipProvider delayDuration={200}>
        {modes.map((m) => {
          const isAvailable = available.includes(m.key);
          const active = value === m.key;
          return (
            <Tooltip key={m.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => isAvailable && onChange(m.key)}
                  className={cn(
                    "inline-flex items-center justify-center h-8 w-8 rounded-[5px] transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                    !isAvailable && "opacity-40 cursor-not-allowed",
                  )}
                  aria-label={m.label}
                  aria-pressed={active}
                >
                  <m.icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isAvailable ? m.label : t("comingSoon")}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
