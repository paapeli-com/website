import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/factory/components/ui/popover";
import {
  Plus,
  Cpu,
  Server,
  MapPin,
  Bell,
  FileCode,
  Wrench,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { localizedPath } from "@/features/factory/lib/localizedPath";

interface CreateOption {
  icon: React.ElementType;
  title: string;
  description: string;
  path: string;
  disabled?: boolean;
}

export const QuickCreatePanel = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const lp = (p: string) => localizedPath(p, language);
  const isFaAr = language === "fa" || language === "ar";
  const titleCls = "text-sm";
  const descCls = "text-xs";
  const headTitleCls = "text-sm";

  const mainOptions: CreateOption[] = [
    {
      icon: Cpu,
      title: t("device"),
      description: (t as any)("deviceDesc") || "Add a new sensor, machine, PLC or industrial device.",
      path: lp("/devices/new"),
    },
    {
      icon: Server,
      title: (t as any)("gateway") || "Gateway",
      description: (t as any)("gatewayDesc") || "Register an edge gateway and connect devices.",
      path: lp("/devices/gateways/new"),
    },
    {
      icon: MapPin,
      title: (t as any)("location") || "Location",
      description: (t as any)("locationDesc") || "Create a new Region, Site, Unit or Production Line.",
      path: lp("/locations"),
    },
    {
      icon: Bell,
      title: (t as any)("alertRule") || "Alarm Rule",
      description: (t as any)("alarmRuleDesc") || "Create a new monitoring and alerting rule.",
      path: lp("/alarms/rules/new"),
    },
  ];

  const advancedOptions: CreateOption[] = [
    {
      icon: Wrench,
      title: (t as any)("workOrder") || "Work Order",
      description:
        (t as any)("workOrderDesc") ||
        "Create a maintenance task for technicians.",
      path: lp("/work-orders/new"),
    },
    {
      icon: LayoutDashboard,
      title: (t as any)("dashboard") || "Dashboard",
      description:
        (t as any)("dashboardCreateDesc") ||
        "Create a new operational dashboard.",
      path: lp("/dashboard/new"),
    },
  ];


  const handleClick = (opt: CreateOption) => {
    if (opt.disabled) return;
    setOpen(false);
    navigate(opt.path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="quick-create-btn h-10 px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shrink-0 inline-flex items-center">
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline text-sm font-medium leading-none">{t("newThings")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        dir={language === "en" ? "ltr" : "rtl"}
        data-quick-create
        className="w-[360px] max-w-[380px] p-0 bg-popover border border-border shadow-lg rounded-xl overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <h3 className={`${headTitleCls} font-semibold text-foreground`}>
            {(t as any)("createNew") || "Create New"}
          </h3>
          <p className={`${descCls} text-muted-foreground mt-0.5 leading-tight`}>
            {(t as any)("createNewSubtitle") ||
              "Create and configure a new industrial entity."}
          </p>
        </div>

        {/* Main Options */}
        <div className="p-2 grid grid-cols-1 gap-0.5">
          {mainOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(opt)}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-start transition-colors hover:bg-primary/5 group focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <div className="shrink-0 h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                <opt.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className={`${titleCls} font-medium text-foreground group-hover:text-primary transition-colors leading-tight`}>
                  {opt.title}
                </div>
                <div className={`${descCls} text-muted-foreground mt-0.5 leading-tight truncate`}>
                  {opt.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Divider + Advanced Label */}
        <div className="px-4">
          <div className="border-t border-border" />
          <div className="py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {(t as any)("advancedOptions") || "Advanced Options"}
            </span>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="px-2 pb-2 grid grid-cols-1 gap-0.5">
          {advancedOptions.map((opt, idx) => {
            const disabled = opt.disabled;
            return (
              <button
                key={idx}
                onClick={() => handleClick(opt)}
                disabled={disabled}
                className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-start transition-colors ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-primary/5 group focus:outline-none focus:ring-2 focus:ring-primary/20"
                }`}
              >
                <div
                  className={`shrink-0 h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                    disabled
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`${titleCls} font-medium transition-colors leading-tight ${
                      disabled
                        ? "text-foreground"
                        : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {opt.title}
                  </div>
                  <div className={`${descCls} text-muted-foreground mt-0.5 leading-tight truncate`}>
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
