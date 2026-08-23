import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/features/factory/components/ui/sheet";
import { Input } from "@/features/factory/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/features/factory/components/ui/collapsible";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { TranslationKey } from "@/features/factory/i18n/translations";
import {
  Search,
  ChevronUp,
  Battery,
  Gauge,
  CircleDot,
  Hash,
  Circle,
  Container,
  Thermometer,
  BarChart3,
  Activity,
  LineChart,
  PieChart,
  Table,
  Grid3X3,
  AlertTriangle,
  TableProperties,
  Map,
  FormInput,
  SlidersHorizontal,
  Power,
} from "lucide-react";

export interface WidgetType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  isPro?: boolean;
}

interface WidgetDef {
  id: string;
  nameKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  isPro?: boolean;
}

interface CategoryDef {
  id: string;
  nameKey: TranslationKey;
  widgets: WidgetDef[];
}

const widgetCategories: CategoryDef[] = [
  {
    id: "metrics",
    nameKey: "catMetrics",
    widgets: [
      { id: "battery", nameKey: "wBattery", icon: Battery },
      { id: "gauge", nameKey: "wGauge", icon: Gauge },
      { id: "indicator", nameKey: "wIndicator", icon: CircleDot },
      { id: "metric", nameKey: "wMetric", icon: Hash },
      { id: "ring-gauge", nameKey: "wRingGauge", icon: Circle, isPro: true },
      { id: "tank", nameKey: "wTank", icon: Container },
      { id: "thermometer", nameKey: "wThermometer", icon: Thermometer },
    ],
  },
  {
    id: "charts",
    nameKey: "catCharts",
    widgets: [
      { id: "bar-chart", nameKey: "wBarChart", icon: BarChart3 },
      { id: "frequency-chart", nameKey: "wFrequencyChart", icon: Activity, isPro: true },
      { id: "histogram", nameKey: "wHistogram", icon: BarChart3 },
      { id: "line-chart", nameKey: "wLineChart", icon: LineChart },
      { id: "pie-chart", nameKey: "wPieChart", icon: PieChart },
      { id: "rose-chart", nameKey: "wRoseChart", icon: PieChart },
    ],
  },
  {
    id: "tables",
    nameKey: "catTables",
    widgets: [
      { id: "devices-table", nameKey: "wDevicesTable", icon: Table },
      { id: "heatmap-table", nameKey: "wHeatmapTable", icon: Grid3X3, isPro: true },
      { id: "incidents", nameKey: "wIncidents", icon: AlertTriangle, isPro: true },
      { id: "values-table", nameKey: "wValuesTable", icon: TableProperties },
      { id: "variables-table", nameKey: "wVariablesTable", icon: TableProperties },
    ],
  },
  {
    id: "maps",
    nameKey: "catMaps",
    widgets: [{ id: "map", nameKey: "wMap", icon: Map }],
  },
  {
    id: "control",
    nameKey: "catControl",
    widgets: [
      { id: "manual-input", nameKey: "wManualInput", icon: FormInput },
      { id: "slider", nameKey: "wSlider", icon: SlidersHorizontal },
      { id: "switch", nameKey: "wSwitch", icon: Power },
    ],
  },
];

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardName: string;
  onSelectWidget: (widget: WidgetType) => void;
}

export const WidgetPicker = ({ open, onOpenChange, dashboardName, onSelectWidget }: WidgetPickerProps) => {
  const { isRTL, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(widgetCategories.map((c) => [c.id, true])),
  );

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const q = searchQuery.toLowerCase();
  const filteredCategories = widgetCategories
    .map((category) => ({
      ...category,
      widgets: category.widgets.filter((w) => t(w.nameKey).toLowerCase().includes(q)),
    }))
    .filter((c) => c.widgets.length > 0);

  const handleWidgetClick = (widget: WidgetDef, categoryNameKey: TranslationKey) => {
    onSelectWidget({
      id: widget.id,
      name: t(widget.nameKey),
      icon: widget.icon,
      category: t(categoryNameKey),
      isPro: widget.isPro,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRTL ? "left" : "right"}
        className="w-[400px] sm:max-w-[400px] p-0 overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="bg-primary text-primary-foreground p-6 text-center">
          <p className="text-sm opacity-80">{dashboardName}</p>
          <SheetTitle className="text-2xl font-normal text-primary-foreground mt-1">
            {t("addNewWidget")}
          </SheetTitle>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder={t("searchWidgets")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${isRTL ? "pr-10" : "pl-10"} border-gray-300`}
            />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-200px)] px-4">
          {filteredCategories.map((category) => (
            <Collapsible
              key={category.id}
              open={openCategories[category.id]}
              onOpenChange={() => toggleCategory(category.id)}
              className="mb-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b">
                <span className="font-medium text-sm">{t(category.nameKey)}</span>
                <ChevronUp className={`h-4 w-4 transition-transform ${openCategories[category.id] ? "" : "rotate-180"}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-6 gap-3 py-4">
                  {category.widgets.map((widget) => (
                    <button
                      key={widget.id}
                      onClick={() => handleWidgetClick(widget, category.nameKey)}
                      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors group relative"
                    >
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <widget.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <span className="text-xs text-center leading-tight">{t(widget.nameKey)}</span>
                      {widget.isPro && (
                        <span className={`absolute -top-1 ${isRTL ? "-left-1" : "-right-1"} bg-primary text-primary-foreground text-[10px] px-1 rounded`}>
                          ★
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
