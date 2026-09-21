import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Badge } from "@/features/factory/components/ui/badge";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/features/factory/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/features/factory/components/ui/tooltip";
import { Plus, Copy } from "lucide-react";
import { NoData } from "@/features/factory/components/NoData";
import type { AlertSeverity, AlertTemplate } from "@/features/factory/types/alerts";

const severityColors: Record<AlertSeverity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

interface AlertTemplatesProps {
  onUseTemplate: () => void;
}

const tplI18n: Record<string, { name: string; desc: string; category: string }> = {
  "ATPL-001": { name: "tplTempThresholdName", desc: "tplTempThresholdDesc", category: "tplCatTemperature" },
  "ATPL-002": { name: "tplVibrationName", desc: "tplVibrationDesc", category: "tplCatVibration" },
  "ATPL-003": { name: "tplHeartbeatName", desc: "tplHeartbeatDesc", category: "tplCatConnectivity" },
  "ATPL-004": { name: "tplPressureName", desc: "tplPressureDesc", category: "tplCatPressure" },
};

const severityLabelKey: Record<AlertSeverity, string> = {
  critical: "alertCritical",
  high: "alertHigh",
  medium: "alertMedium",
  low: "alertLow",
};

const ruleTypeKey: Record<string, string> = {
  threshold: "ruleTypeThreshold",
  heartbeat: "ruleTypeHeartbeat",
};

export const AlertTemplates = ({ onUseTemplate }: AlertTemplatesProps) => {
  const { t, isRTL } = useLanguage();
  const tt = t as (k: string) => string;

  /* The four ATPL-* templates that used to render here were invented, and
     "Use template" never carried the choice into the rule form anyway — it
     just navigates. Nothing serves templates yet, so the tab says so. */
  const templates: AlertTemplate[] = [];

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-end items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" disabled>
              <Plus className="h-4 w-4 me-1" />
              {t("alertCreateTemplate")}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("settingsComingSoon")}</TooltipContent>
        </Tooltip>
      </div>

      {/* The table the alarm and device lists use, rather than a grid of
          cards: one card around it, the shared type scale and row height,
          and the empty state inside the body so the columns stay on screen.
          Nothing serves templates yet, so that is what it reports \u2014 there is
          no "add your first" here, because creating one is not possible. */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative rounded-lg border bg-card overflow-hidden text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{tt("name")}</TableHead>
                  <TableHead>{tt("alertSeverity")}</TableHead>
                  <TableHead>{tt("triggerType")}</TableHead>
                  <TableHead className="hidden md:table-cell">{tt("alertTemplateCategory")}</TableHead>
                  <TableHead className="w-[140px] text-end">{tt("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="p-0">
                      <NoData />
                    </TableCell>
                  </TableRow>
                ) : templates.map(template => {
                  const k = tplI18n[template.id];
                  const name = k ? tt(k.name) : template.name;
                  const desc = k ? tt(k.desc) : template.description;
                  const category = k ? tt(k.category) : template.category;
                  const ruleType = ruleTypeKey[template.ruleType] ? tt(ruleTypeKey[template.ruleType]) : template.ruleType;
                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <span className="flex flex-col">
                          <span className="font-medium">{name}</span>
                          <span className="text-xs text-muted-foreground">{desc}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={severityColors[template.severity]}>
                          {tt(severityLabelKey[template.severity])}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{ruleType}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{category}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" onClick={onUseTemplate}>
                            <Copy className="h-3 w-3 me-1" />
                            {t("alertUseTemplate")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
