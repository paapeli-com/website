import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import './RangeSlider.scss';
import { buildClassName } from '../../util/buildClassName.js';

export type RangeSliderValue = number | [number, number];

export type RangeSliderTooltipMode = 'always' | 'hover' | 'never';

export type RangeSliderProps = {
  /** Controlled value. Pass a single number for default mode, `[min, max]` for range mode. */
  value?: RangeSliderValue;
  /** Initial uncontrolled value. */
  defaultValue?: RangeSliderValue;
  onChange?: (value: RangeSliderValue) => void;

  min?: number;
  max?: number;
  step?: number;

  /** Format the tooltip + auto-generated side labels. */
  formatValue?: (v: number) => string;
  /** Tooltip visibility — `always` (default), `hover` (on focus/active drag), or `never`. */
  tooltip?: RangeSliderTooltipMode;

  /** Leading icon (rendered before everything else). */
  leadingIcon?: ReactNode;
  /** Trailing icon. */
  trailingIcon?: ReactNode;
  /** Leading text. Defaults to `formatValue(min)` when an icon is set. */
  leadingLabel?: ReactNode;
  /** Trailing text. Defaults to `formatValue(max)` when an icon is set. */
  trailingLabel?: ReactNode;
  /** Tick labels rendered below the track, distributed evenly. */
  ticks?: ReactNode[];

  disabled?: boolean;
  id?: string;
  name?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function snap(v: number, step: number, min: number): number {
  return Math.round((v - min) / step) * step + min;
}

// ─── Component ───────────────────────────────────────────────────────────────

const RangeSlider: React.FC<RangeSliderProps> = ({
  value: controlledValue,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue,
  tooltip = 'always',
  leadingIcon,
  trailingIcon,
  leadingLabel,
  trailingLabel,
  ticks,
  disabled,
  id,
  name,
  ariaLabel,
  className,
  style,
}) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  const isRange =
    Array.isArray(controlledValue) ||
    Array.isArray(defaultValue);

  const fallback: RangeSliderValue = isRange ? [min, max] : min;
  const [internalValue, setInternalValue] = useState<RangeSliderValue>(
    defaultValue ?? fallback,
  );

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue! : internalValue;

  const trackRef = useRef<HTMLDivElement>(null);
  const dragIdxRef = useRef<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const fmt = formatValue ?? ((v: number) => String(v));

  const valueAt = (idx: number): number =>
    Array.isArray(currentValue) ? currentValue[idx]! : currentValue;

  const valueToPct = (v: number): number =>
    max === min ? 0 : ((v - min) / (max - min)) * 100;

  const pctToValue = (pct: number): number => {
    const raw = min + (clamp(pct, 0, 100) / 100) * (max - min);
    return clamp(snap(raw, step, min), min, max);
  };

  const setValueAt = useCallback(
    (idx: number, newV: number) => {
      let next: RangeSliderValue;
      if (Array.isArray(currentValue)) {
        const [a, b] = currentValue;
        next = idx === 0 ? [Math.min(newV, b), b] : [a, Math.max(newV, a)];
      } else {
        next = newV;
      }
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [currentValue, isControlled, onChange],
  );

  // ── Pointer-driven drag ────────────────────────────────────────────────────

  const setFromPointer = useCallback(
    (clientX: number, idx: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width === 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setValueAt(idx, pctToValue(pct));
    },
    [setValueAt, min, max, step], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (activeIdx === null) return;

    const onMove = (e: PointerEvent) => {
      if (dragIdxRef.current === null) return;
      setFromPointer(e.clientX, dragIdxRef.current);
    };
    const onUp = () => {
      dragIdxRef.current = null;
      setActiveIdx(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [activeIdx, setFromPointer]);

  const startDrag = (e: ReactPointerEvent<HTMLElement>, idx: number) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).focus?.();
    dragIdxRef.current = idx;
    setActiveIdx(idx);
  };

  const handleTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const newV = pctToValue(pct);

    let idx = 0;
    if (Array.isArray(currentValue)) {
      const [a, b] = currentValue;
      idx = Math.abs(newV - a) <= Math.abs(newV - b) ? 0 : 1;
    }
    setValueAt(idx, newV);
    dragIdxRef.current = idx;
    setActiveIdx(idx);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>, idx: number) => {
    if (disabled) return;
    let next: number | null = null;
    const v = valueAt(idx);
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = clamp(v - step, min, max);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = clamp(v + step, min, max);
        break;
      case 'PageDown':
        next = clamp(v - step * 10, min, max);
        break;
      case 'PageUp':
        next = clamp(v + step * 10, min, max);
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
    }
    if (next !== null) {
      e.preventDefault();
      setValueAt(idx, next);
    }
  };

  // ── Computed positions ─────────────────────────────────────────────────────

  let fillStartPct = 0;
  let fillEndPct = 0;
  if (Array.isArray(currentValue)) {
    fillStartPct = valueToPct(currentValue[0]);
    fillEndPct = valueToPct(currentValue[1]);
  } else {
    fillStartPct = 0;
    fillEndPct = valueToPct(currentValue);
  }

  // ── Side labels (auto-derive from icon + min/max) ──────────────────────────

  const computedLeadingLabel =
    leadingLabel !== undefined ? leadingLabel : leadingIcon ? fmt(min) : null;
  const computedTrailingLabel =
    trailingLabel !== undefined ? trailingLabel : trailingIcon ? fmt(max) : null;

  // ── Thumb renderer ─────────────────────────────────────────────────────────

  const renderThumb = (idx: number) => {
    const v = valueAt(idx);
    const pct = valueToPct(v);
    const showTooltip =
      tooltip === 'always' ||
      (tooltip === 'hover' && (activeIdx === idx || hoverIdx === idx));

    return (
      <div
        key={idx}
        className={buildClassName(
          'RangeSlider__thumb',
          activeIdx === idx && 'RangeSlider__thumb--active',
        )}
        style={{ left: `${pct}%` }}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={v}
        aria-valuetext={fmt(v)}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        onPointerDown={(e) => startDrag(e, idx)}
        onKeyDown={(e) => handleKeyDown(e, idx)}
        onMouseEnter={() => setHoverIdx(idx)}
        onMouseLeave={() => setHoverIdx(null)}
        onFocus={() => setHoverIdx(idx)}
        onBlur={() => setHoverIdx(null)}
      >
        {showTooltip && (
          <div className="RangeSlider__tooltip">{fmt(v)}</div>
        )}
      </div>
    );
  };

  return (
    <div
      id={fieldId}
      data-name={name}
      className={buildClassName(
        'RangeSlider',
        Array.isArray(currentValue) && 'RangeSlider--range',
        disabled && 'RangeSlider--disabled',
        className,
      )}
      style={style}
    >
      <div className="RangeSlider__row">
        {leadingIcon && <span className="RangeSlider__icon">{leadingIcon}</span>}
        {computedLeadingLabel != null && (
          <span className="RangeSlider__side-label">{computedLeadingLabel}</span>
        )}

        <div className="RangeSlider__track-wrap">
          <div
            ref={trackRef}
            className="RangeSlider__track"
            onPointerDown={handleTrackPointerDown}
          >
            <div
              className="RangeSlider__fill"
              style={{
                left: `${fillStartPct}%`,
                right: `${100 - fillEndPct}%`,
              }}
            />
            {Array.isArray(currentValue) ? (
              <>
                {renderThumb(0)}
                {renderThumb(1)}
              </>
            ) : (
              renderThumb(0)
            )}
          </div>

          {ticks && ticks.length > 0 && (
            <div className="RangeSlider__ticks">
              {ticks.map((t, i) => (
                <span key={i} className="RangeSlider__tick">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {computedTrailingLabel != null && (
          <span className="RangeSlider__side-label">{computedTrailingLabel}</span>
        )}
        {trailingIcon && <span className="RangeSlider__icon">{trailingIcon}</span>}
      </div>
    </div>
  );
};

export default RangeSlider;
