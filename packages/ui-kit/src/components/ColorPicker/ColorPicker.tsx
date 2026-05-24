import type {
  CSSProperties,
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import './ColorPicker.scss';
import { buildClassName } from '../../util/buildClassName.js';
import {
  hexToHsv,
  hexToRgb,
  hsvToHex,
  isValidHex,
  normalizeHex,
  rgbToHex,
} from './colorUtils.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColorPickerMode = 'swatches' | 'advanced';

export type ColorPickerProps = {
  /** Current color (hex). */
  value?: string;
  /** Initial color (uncontrolled). */
  defaultValue?: string;
  /** Fires whenever the picked color changes. */
  onChange?: (hex: string) => void;

  /** `swatches` (default) shows a preset grid; `advanced` shows the SV/hue editor. */
  mode?: ColorPickerMode;

  /** Custom palette for `swatches` mode. */
  swatches?: string[];
  /** Color used by the "Reset color" action (only shown if set). */
  resetColor?: string;
  /** Replace the "Pick a color" header text. */
  label?: ReactNode;

  className?: string;
  style?: CSSProperties;
};

// ─── Default palette (matches the Figma swatches frame) ──────────────────────

export const DEFAULT_SWATCHES: string[] = [
  '#155dfc', '#00c950', '#ffdf20', '#fb2c36', '#ff8a4c', '#00bba7',
  '#a3b3ff', '#7c86ff', '#193cb8', '#fcd9bd', '#a3004c', '#46ecd5',
  '#9810fa', '#dab2ff', '#e60076', '#fda5d5', '#fee685', '#831843',
  '#1447e6', '#b43403', '#fff085', '#1d4ed8', '#a3b3ff', '#b9f8cf',
  '#74d4ff', '#00d5be', '#f6339a', '#bedbff', '#016630', '#0f172b',
  '#45556c', '#62748e', '#cad5e2', '#f1f5f9', '#f8fafc', '#e2e8f0',
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── Inline icons ────────────────────────────────────────────────────────────

const EyedropperIcon = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M11.5 2.5l2 2-3 3-2-2 3-3z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 4.5l-6 6v3h3l6-6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

const ColorPicker: React.FC<ColorPickerProps> = ({
  value: controlledValue,
  defaultValue,
  onChange,
  mode = 'swatches',
  swatches = DEFAULT_SWATCHES,
  resetColor,
  label,
  className,
  style,
}) => {
  const [internal, setInternal] = useState<string>(
    () => normalizeHex(defaultValue ?? '#ff7900'),
  );
  const isControlled = controlledValue !== undefined;
  const current = normalizeHex(isControlled ? controlledValue! : internal);

  const setColor = useCallback(
    (hex: string) => {
      const next = normalizeHex(hex);
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const wrapperClassName = buildClassName(
    'ColorPicker',
    `ColorPicker--${mode}`,
    className,
  );

  if (mode === 'advanced') {
    return (
      <div className={wrapperClassName} style={style}>
        <AdvancedBody current={current} onChange={setColor} />
      </div>
    );
  }

  return (
    <div className={wrapperClassName} style={style}>
      <SwatchBody
        current={current}
        onChange={setColor}
        swatches={swatches}
        resetColor={resetColor}
        label={label}
      />
    </div>
  );
};

export default ColorPicker;

// ─── Swatch body ─────────────────────────────────────────────────────────────

type SwatchBodyProps = {
  current: string;
  onChange: (hex: string) => void;
  swatches: string[];
  resetColor?: string;
  label?: ReactNode;
};

const SwatchBody: React.FC<SwatchBodyProps> = ({
  current,
  onChange,
  swatches,
  resetColor,
  label,
}) => {
  return (
    <>
      <div className="ColorPicker__top">
        <div
          className="ColorPicker__current"
          style={{ background: current }}
          aria-label={`Current color ${current}`}
        />
        <span className="ColorPicker__title">{label ?? 'Pick a color'}</span>
      </div>

      <div className="ColorPicker__swatches">
        {swatches.map((c) => {
          const norm = normalizeHex(c);
          const isCurrent = norm === current;
          return (
            <button
              key={c}
              type="button"
              className={buildClassName(
                'ColorPicker__swatch',
                isCurrent && 'ColorPicker__swatch--current',
              )}
              style={{ background: norm }}
              aria-label={norm}
              aria-pressed={isCurrent}
              onClick={() => onChange(norm)}
            />
          );
        })}
      </div>

      {resetColor !== undefined && (
        <button
          type="button"
          className="ColorPicker__reset"
          onClick={() => onChange(resetColor)}
        >
          Reset color
        </button>
      )}
    </>
  );
};

// ─── Advanced body ───────────────────────────────────────────────────────────

type AdvancedBodyProps = {
  current: string;
  onChange: (hex: string) => void;
};

const AdvancedBody: React.FC<AdvancedBodyProps> = ({ current, onChange }) => {
  const { r, g, b } = hexToRgb(current);
  const { h, s, v } = hexToHsv(current);

  // Hex input state — keep editable text local so the user can type freely
  // (e.g. "#ff" mid-typing) without the controlled value snapping back.
  const [hexDraft, setHexDraft] = useState(current);
  useEffect(() => setHexDraft(current), [current]);

  // ── SV canvas drag ─────────────────────────────────────────────────────────

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingSV, setDraggingSV] = useState(false);

  const setFromCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      onChange(hsvToHex(h, x * 100, (1 - y) * 100));
    },
    [h, onChange],
  );

  // ── Hue slider drag ────────────────────────────────────────────────────────

  const hueRef = useRef<HTMLDivElement>(null);
  const [draggingHue, setDraggingHue] = useState(false);

  const setFromHue = useCallback(
    (clientX: number) => {
      const el = hueRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      onChange(hsvToHex(x * 360, s, v));
    },
    [s, v, onChange],
  );

  useEffect(() => {
    if (!draggingSV && !draggingHue) return;

    const onMove = (e: PointerEvent) => {
      if (draggingSV) setFromCanvas(e.clientX, e.clientY);
      if (draggingHue) setFromHue(e.clientX);
    };
    const onUp = () => {
      setDraggingSV(false);
      setDraggingHue(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingSV, draggingHue, setFromCanvas, setFromHue]);

  const startSV = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingSV(true);
    setFromCanvas(e.clientX, e.clientY);
  };
  const startHue = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingHue(true);
    setFromHue(e.clientX);
  };

  // ── Eyedropper (chromium-based browsers only) ──────────────────────────────

  const handleEyedropper = async () => {
    type EyeDropperResult = { sRGBHex: string };
    type EyeDropperCtor = new () => { open: () => Promise<EyeDropperResult> };
    const W = window as unknown as { EyeDropper?: EyeDropperCtor };
    if (!W.EyeDropper) return;
    try {
      const ed = new W.EyeDropper();
      const { sRGBHex } = await ed.open();
      onChange(sRGBHex);
    } catch {
      /* user cancelled */
    }
  };

  // ── Hex / RGB input handlers ───────────────────────────────────────────────

  const commitHex = () => {
    if (isValidHex(hexDraft)) {
      onChange(normalizeHex(hexDraft));
    } else {
      setHexDraft(current);
    }
  };

  const onRgbChange =
    (channel: 'r' | 'g' | 'b') => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const num = clamp(parseInt(raw || '0', 10) || 0, 0, 255);
      const next = { r, g, b, [channel]: num } as Record<'r' | 'g' | 'b', number>;
      onChange(rgbToHex(next.r, next.g, next.b));
    };

  // ── Render ─────────────────────────────────────────────────────────────────

  const huePct = (h / 360) * 100;
  const hueColor = hsvToHex(h, 100, 100);

  return (
    <>
      <div
        ref={canvasRef}
        className="ColorPicker__canvas"
        onPointerDown={startSV}
        style={{ background: hueColor }}
        role="application"
        aria-label="Saturation and value picker"
      >
        <span className="ColorPicker__canvas-overlay-x" />
        <span className="ColorPicker__canvas-overlay-y" />
        <span
          className="ColorPicker__canvas-thumb"
          style={{
            left: `${s}%`,
            top: `${100 - v}%`,
            background: current,
          }}
        />
      </div>

      <div className="ColorPicker__hue-row">
        <button
          type="button"
          className="ColorPicker__eyedropper"
          onClick={handleEyedropper}
          aria-label="Pick from screen"
          title="Pick from screen"
        >
          <EyedropperIcon />
        </button>

        <span
          className="ColorPicker__circle"
          style={{ background: current }}
          aria-hidden="true"
        />

        <div
          ref={hueRef}
          className="ColorPicker__hue"
          onPointerDown={startHue}
          role="slider"
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(h)}
        >
          <span
            className="ColorPicker__hue-thumb"
            style={{
              left: `${huePct}%`,
              background: hsvToHex(h, 100, 100),
            }}
          />
        </div>
      </div>

      <div className="ColorPicker__inputs">
        <input
          className="ColorPicker__input ColorPicker__input--hex"
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <input
          className="ColorPicker__input"
          type="number"
          min={0}
          max={255}
          value={r}
          onChange={onRgbChange('r')}
        />
        <input
          className="ColorPicker__input"
          type="number"
          min={0}
          max={255}
          value={g}
          onChange={onRgbChange('g')}
        />
        <input
          className="ColorPicker__input"
          type="number"
          min={0}
          max={255}
          value={b}
          onChange={onRgbChange('b')}
        />
      </div>

      <div className="ColorPicker__labels">
        <span>Hex</span>
        <span>R</span>
        <span>G</span>
        <span>B</span>
      </div>
    </>
  );
};
