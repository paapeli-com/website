import { useEffect, useRef, useState } from "react";
import { CameraOff, Loader2 } from "lucide-react";
import type { DecodeHintType } from "@zxing/library";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { Modal } from "@/features/track/components/ui/modal";
import { Button } from "@/features/track/components/ui/button";

/* Reads a tracker's IMEI off its label with the camera.
 *
 * ZXing rather than the native BarcodeDetector: the latter is missing from
 * iOS Safari and Firefox, which is most of the phones this gets used on. It is
 * imported only when the scanner opens, so the device form doesn't carry it.
 *
 * Tracker labels usually hold several barcodes (IMEI, serial, the SIM's
 * ICCID), and some QR codes pack them all into one string. So a read counts
 * only if it contains a standalone 15-digit run whose last digit is a valid
 * Luhn check — an IMEI's own checksum. Anything else keeps the camera going. */

/** A standalone 15-digit IMEI with a valid Luhn check digit in `text`, if any. */
export function extractImei(text: string): string | null {
  for (const [candidate] of text.matchAll(/(?<!\d)\d{15}(?!\d)/g)) {
    if (luhnValid(candidate)) return candidate;
  }
  return null;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

type Status = "starting" | "scanning" | "unsupported" | "denied" | "failed";

export function ImeiScanner({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (imei: string) => void;
}) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("starting");

  // Held in a ref so a re-render with a new callback doesn't restart the camera.
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    if (!open) return;
    setStatus("starting");

    // getUserMedia exists only in a secure context (https or localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;
    let stop: (() => void) | undefined;

    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType: Hint }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        if (cancelled || !videoRef.current) return;

        const hints = new Map<DecodeHintType, unknown>([
          [
            Hint.POSSIBLE_FORMATS,
            [BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX],
          ],
          [Hint.TRY_HARDER, true],
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, _error, liveControls) => {
            if (!result || cancelled) return;
            const imei = extractImei(result.getText());
            if (!imei) return;
            cancelled = true;
            liveControls.stop();
            navigator.vibrate?.(60);
            onDetectedRef.current(imei);
          },
        );
        // Closed while the camera was still starting.
        if (cancelled) return controls.stop();
        stop = () => controls.stop();
        setStatus("scanning");
      } catch (error) {
        if (cancelled) return;
        const name = (error as { name?: string })?.name;
        setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "failed");
      }
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [open]);

  const problem =
    status === "unsupported" ? t("cameraUnsupported")
    : status === "denied" ? t("cameraDenied")
    : status === "failed" ? t("cameraFailed")
    : null;

  return (
    <Modal open={open} onClose={onClose} title={t("scanImei")}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-white/80" />
          </div>
        )}
        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-lg border-2 border-white/80" />
        )}
        {problem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white/90">
            <CameraOff className="size-6" />
            {problem}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("scanImeiHint")}</p>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
      </div>
    </Modal>
  );
}
