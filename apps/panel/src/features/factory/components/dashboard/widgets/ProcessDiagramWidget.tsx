import { TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { Hint, useBoxSize } from "./chartKit";
import { SCENES, Scene, isScene } from "./processScenes";
import { useLatestReadings } from "./useLatestReadings";
import type { WidgetRenderProps } from "./types";

const T = {
  noBinding: { en: "Pick a device and a telemetry key in the widget settings", ar: "اختر جهازًا ومفتاح قياس في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه و یک کلید تله‌متری انتخاب کنید" },
  failed: { en: "Couldn't load the readings", ar: "تعذر تحميل القراءات", fa: "بارگذاری داده‌ها ممکن نشد" },
};

type Options = { scene?: string; decimals?: number };
type Role = "reading" | "motion" | "level" | "travel";

const fraction = (v: number | null) => (v === null ? 0 : Math.min(1, Math.max(0, v / 100)));

/**
 * The "process-diagram" widget: a sample picture of a process that moves with
 * its telemetry, with the readings beside it.
 *
 * Telemetry comes at the dashboard's refresh rate; the motion is the browser's.
 * A binding with the `motion` role keeps parts turning for as long as it is
 * above zero, so the picture stays live between readings. `level` fills tanks
 * and `travel` raises the moving part, both on a 0 to 100 scale.
 */
export function ProcessDiagramWidget({ widget, dataSources, window: [, refreshedAt], lang }: WidgetRenderProps) {
  const options = (widget.options ?? {}) as Options;
  const { values, bound, failed, error } = useLatestReadings(widget, dataSources, refreshedAt);
  const [boxRef, box] = useBoxSize<HTMLDivElement>();

  if (!bound) return <Hint>{T.noBinding[lang]}</Hint>;
  if (failed && values.every((v) => v === undefined)) {
    return (
      <Hint>
        <span className="inline-flex items-center gap-1.5 text-destructive" title={apiErrorMessage(error, T.failed[lang])}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />{T.failed[lang]}
        </span>
      </Hint>
    );
  }

  const name = isScene(options.scene) ? options.scene : "drilling-rig";
  const numberFor = (role: Role) => {
    const i = widget.data.findIndex((d) => d.role === role);
    return i < 0 ? null : toNumber(values[i]);
  };
  const decimals = Number.isInteger(options.decimals) ? Number(options.decimals) : 1;
  const format = (raw: unknown) => {
    const n = toNumber(raw);
    if (n !== null) return n.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
    return raw === undefined || raw === null || raw === "" ? "—" : String(raw);
  };
  // Beside a wide picture, under a narrow one.
  const wide = !box || box.width > box.height * 1.5;

  return (
    <div ref={boxRef} className={`flex h-full w-full min-h-0 min-w-0 gap-3 ${wide ? "flex-row" : "flex-col"}`}>
      <div className="min-h-0 min-w-0 flex-1" dir="ltr">
        <Scene
          name={name}
          title={SCENES[name].label[lang]}
          running={(numberFor("motion") ?? 0) > 0}
          level={fraction(numberFor("level"))}
          travel={fraction(numberFor("travel"))}
        />
      </div>
      <dl className={`shrink-0 gap-1.5 overflow-y-auto ${wide ? "flex w-2/5 max-w-56 flex-col justify-center" : "grid grid-cols-2"}`}>
        {widget.data.map((item, i) => (
          <div key={`${item.source}-${item.key}-${i}`} className="min-w-0 rounded-md bg-muted/60 px-2 py-1">
            <dt className="truncate text-[10px] text-muted-foreground">{item.label?.trim() || item.key}</dt>
            <dd className="truncate text-sm font-semibold tabular-nums text-foreground" dir="ltr">
              {format(values[i])}
              {item.unit?.trim() && <span className="ms-1 text-[10px] font-normal text-muted-foreground">{item.unit.trim()}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
