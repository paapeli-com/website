import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Button } from "@/features/factory/components/ui/button";
import { Calendar } from "@/features/factory/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/factory/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import { formatDate } from "@/shared/lib/formatDate";
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  fromJalali,
  jalaliMonthLength,
  saturdayFirstIndex,
  toJalali,
  type JalaliDay,
} from "@/features/factory/lib/jalali";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromIsoDay = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * A calendar day, picked in the calendar the reader keeps: the Persian one in
 * Persian, the Gregorian one otherwise. The value is yyyy-MM-dd, or "" for
 * none. Work orders' DueDatePicker is the same with a time of day; a planting
 * or harvest date has none.
 */
export function DayPicker({
  value,
  onChange,
  clearable = false,
  disabled,
}: {
  value: string;
  onChange: (day: string) => void;
  clearable?: boolean;
  disabled?: boolean;
}) {
  const { language, t, formatNumber } = useLanguage();
  const [open, setOpen] = useState(false);
  const chosen = value ? fromIsoDay(value) : null;
  const persian = language === "fa";
  const [view, setView] = useState(() => {
    const j = toJalali(chosen ?? new Date());
    return { year: j.year, month: j.month };
  });
  useEffect(() => {
    if (!open) return;
    const j = toJalali(chosen ?? new Date());
    setView({ year: j.year, month: j.month });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (date: Date) => {
    onChange(isoDay(date));
    setOpen(false);
  };
  const step = (by: number) =>
    setView((v) => {
      const index = v.year * 12 + (v.month - 1) + by;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });

  const today = toJalali(new Date());
  const chosenJalali = chosen ? toJalali(chosen) : null;
  const same = (a: JalaliDay | null, day: number) => !!a && a.year === view.year && a.month === view.month && a.day === day;
  const blanks = saturdayFirstIndex(fromJalali({ year: view.year, month: view.month, day: 1 }));
  const days = Array.from({ length: jalaliMonthLength(view.year, view.month) }, (_, i) => i + 1);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn("h-10 flex-1 justify-start gap-2 px-3 font-normal", !chosen && "text-muted-foreground")}
          >
            <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">{chosen ? formatDate(chosen, language) : t("woPickDate")}</span>
          </Button>
        </PopoverTrigger>
        {clearable && chosen && !disabled && (
          <Button type="button" variant="ghost" size="icon" className="h-10 w-9 shrink-0" aria-label={t("woClear")} onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        {persian ? (
          <div className="p-3 w-[272px]" dir="rtl">
            <div className="flex items-center justify-between mb-2">
              <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => step(-1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {JALALI_MONTHS[view.month - 1]} {formatNumber(view.year)}
              </span>
              <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => step(1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {JALALI_WEEKDAYS.map((d) => (
                <span key={d} className="text-[11px] text-muted-foreground py-1">{d}</span>
              ))}
              {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} />)}
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(fromJalali({ year: view.year, month: view.month, day }))}
                  className={cn(
                    "h-8 rounded-md text-sm hover:bg-accent",
                    same(today, day) && "border border-primary/40",
                    same(chosenJalali, day) && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {formatNumber(day)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={chosen ?? undefined}
            defaultMonth={chosen ?? undefined}
            onSelect={(date) => { if (date) pick(date); }}
            initialFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
