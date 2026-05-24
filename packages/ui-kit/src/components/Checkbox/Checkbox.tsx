import type {
  CSSProperties,
  ChangeEventHandler,
  FocusEventHandler,
  ReactNode,
  RefObject,
} from 'react';
import { useEffect, useId, useRef } from 'react';

import './Checkbox.scss';
import { buildClassName } from '../../util/buildClassName.js';

export type CheckboxSize = 'sm' | 'base' | 'lg';

export type CheckboxProps = {
  size?: CheckboxSize;

  /** Visible label rendered next to the box. */
  label?: ReactNode;
  /** Helper text shown under the row. */
  hint?: ReactNode;
  /** Error message — replaces the hint and applies the danger style. */
  error?: ReactNode;
  required?: boolean;

  checked?: boolean;
  defaultChecked?: boolean;
  /** Renders the indeterminate (mixed) state — typical for "select all" controls. */
  indeterminate?: boolean;
  disabled?: boolean;

  id?: string;
  name?: string;
  value?: string;
  tabIndex?: number;
  ariaLabel?: string;

  onChange?: ChangeEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;

  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
  style?: CSSProperties;
};

// ─── Inline icons ────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="Checkbox__check">
    <path
      d="M3.5 8.25l3 3 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IndeterminateIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="Checkbox__check">
    <path
      d="M4 8h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

const Checkbox: React.FC<CheckboxProps> = ({
  size = 'base',
  label,
  hint,
  error,
  required,
  checked,
  defaultChecked,
  indeterminate,
  disabled,
  id,
  name,
  value,
  tabIndex,
  ariaLabel,
  onChange,
  onFocus,
  onBlur,
  inputRef,
  className,
  style,
}) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  const internalRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? internalRef;

  // The HTML `indeterminate` attribute can only be set via JS.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate, ref]);

  const wrapperClassName = buildClassName(
    'Checkbox',
    `Checkbox--${size}`,
    disabled && 'Checkbox--disabled',
    Boolean(error) && 'Checkbox--error',
    indeterminate && 'Checkbox--indeterminate',
    className,
  );

  const message = error ?? hint;

  return (
    <div className={wrapperClassName} style={style}>
      <label className="Checkbox__row" htmlFor={fieldId}>
        <span className="Checkbox__control">
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            className="Checkbox__native"
            name={name}
            value={value}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            required={required}
            tabIndex={tabIndex}
            aria-label={!label ? ariaLabel : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? `${fieldId}-msg` : undefined}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <span className="Checkbox__box" aria-hidden="true">
            {indeterminate ? <IndeterminateIcon /> : <CheckIcon />}
          </span>
        </span>

        {label && (
          <span className="Checkbox__label">
            {label}
            {required && <span className="Checkbox__required" aria-hidden="true"> *</span>}
          </span>
        )}
      </label>

      {message && (
        <span id={`${fieldId}-msg`} className="Checkbox__message">
          {message}
        </span>
      )}
    </div>
  );
};

export default Checkbox;
