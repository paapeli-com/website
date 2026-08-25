import { useState } from "react";
import { toast } from "sonner";
import { AlarmClock, BatteryCharging, BellRing, MoonStar, Power, RotateCcw, Search, Timer } from "lucide-react";
import { Device } from "@/data/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { Drawer } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TypeAvatar } from "@/components/DeviceBits";

const INTERVALS = [1, 3, 5, 10, 30];

/* Device command drawer. All actions are mock (optimistic + toast);      */
/* later they map to ThingsBoard RPC / two-way commands via the gateway.  */
export function CommandDrawer({ open, onClose, device }: { open: boolean; onClose: () => void; device: Device }) {
  const { t, num } = useLanguage();
  const [powerOn, setPowerOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dnd, setDnd] = useState(false);
  const [interval, setInterval] = useState(device.reportingIntervalMin);
  const [confirmReset, setConfirmReset] = useState(false);

  const sent = () => toast.success(t("commandSent"));

  const ActionRow = ({ icon: Icon, label, children, onClick, danger }: any) => (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-start transition-colors hover:bg-muted disabled:opacity-60"
    >
      <span className={`flex size-9 items-center justify-center rounded-lg ${danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
        <Icon className="size-5" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {children}
    </button>
  );

  return (
    <>
      <Drawer open={open} onClose={onClose} title={t("commands")}>
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted p-3">
          <TypeAvatar type={device.type} size={40} />
          <div>
            <p className="text-sm font-semibold">{device.name}</p>
            <p className="text-xs text-muted-foreground">{device.model} · {device.imei}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <ActionRow icon={Search} label={t("findDevice")} onClick={sent} />
          <ActionRow icon={BellRing} label={t("ring")} onClick={sent} />

          <ActionRow icon={Power} label={t("powerOnOff")}>
            <Switch checked={powerOn} onChange={(v) => { setPowerOn(v); sent(); }} />
          </ActionRow>

          <ActionRow icon={BatteryCharging} label={t("powerSaving")}>
            <Switch checked={saving} onChange={(v) => { setSaving(v); sent(); }} />
          </ActionRow>

          <ActionRow icon={MoonStar} label={t("notDisturb")}>
            <Switch checked={dnd} onChange={(v) => { setDnd(v); sent(); }} />
          </ActionRow>

          {/* Update time */}
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Timer className="size-5" />
              </span>
              <span className="flex-1 text-sm font-medium">{t("updateTime")}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTERVALS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setInterval(m); sent(); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${interval === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {num(m)}m
                </button>
              ))}
            </div>
          </div>

          <ActionRow icon={AlarmClock} label={t("alarmClock")} onClick={sent} />
          <ActionRow icon={RotateCcw} label={t("factoryReset")} danger onClick={() => setConfirmReset(true)} />
        </div>
      </Drawer>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title={t("factoryReset")}>
        <p className="text-sm text-muted-foreground">{t("factoryResetWarn")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmReset(false)}>{t("cancel")}</Button>
          <Button variant="destructive" onClick={() => { setConfirmReset(false); sent(); }}>{t("confirm")}</Button>
        </div>
      </Modal>
    </>
  );
}
