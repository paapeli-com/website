import type {
  CSSProperties,
  ChangeEvent,
  ChangeEventHandler,
  FocusEventHandler,
  ReactNode,
  RefObject,
} from 'react';
import { useId } from 'react';

import './Radio.scss';
import { buildClassName } from '../../util/buildClassName.js';

export type RadioSize = 'sm' | 'base' | 'lg';

export type RadioProps = {
  size?: RadioSize;

  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;

  checked?: boolean;
  defaultChecked?: boolean;
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

const Radio: React.FC<RadioProps> = ({
  size = 'base',
  label,
  hint,
  error,
  required,
  checked,
  defaultChecked,
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

  const wrapperClassName = buildClassName(
    'Radio',
    `Radio--${size}`,
    disabled && 'Radio--disabled',
    Boolean(error) && 'Radio--error',
    className,
  );

  const message = error ?? hint;

  return (
    <div className={wrapperClassName} style={style}>
      <label className="Radio__row" htmlFor={fieldId}>
        <span className="Radio__control">
          <input
            ref={inputRef}
            id={fieldId}
            type="radio"
            className="Radio__native"
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
          <span className="Radio__circle" aria-hidden="true">
            <span className="Radio__dot" />
          </span>
        </span>

        {label && (
          <span className="Radio__label">
            {label}
            {required && <span className="Radio__required" aria-hidden="true"> *</span>}
          </span>
        )}
      </label>

      {message && (
        <span id={`${fieldId}-msg`} className="Radio__message">
          {message}
        </span>
      )}
    </div>
  );
};

// ─── RadioGroup ──────────────────────────────────────────────────────────────

export type RadioOption = {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
};

export type RadioGroupProps = {
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, e: ChangeEvent<HTMLInputElement>) => void;

  size?: RadioSize;
  orientation?: 'vertical' | 'horizontal';

  /** Group-level label rendered above the options. */
  label?: ReactNode;
  /** Group-level helper text. */
  hint?: ReactNode;
  /** Group-level error — also flags every option. */
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;

  id?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  defaultValue,
  onChange,
  size = 'base',
  orientation = 'vertical',
  label,
  hint,
  error,
  required,
  disabled,
  id,
  ariaLabel,
  className,
  style,
}) => {
  const autoId = useId();
  const groupId = id ?? autoId;
  const message = error ?? hint;

  const wrapperClassName = buildClassName(
    'RadioGroup',
    `RadioGroup--${orientation}`,
    Boolean(error) && 'RadioGroup--error',
    className,
  );

  return (
    <div
      role="radiogroup"
      aria-label={!label ? ariaLabel : undefined}
      aria-labelledby={label ? `${groupId}-label` : undefined}
      aria-describedby={message ? `${groupId}-msg` : undefined}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
      className={wrapperClassName}
      style={style}
    >
      {label && (
        <span id={`${groupId}-label`} className="RadioGroup__label">
          {label}
          {required && <span className="RadioGroup__required" aria-hidden="true"> *</span>}
        </span>
      )}

      <div className="RadioGroup__options">
        {options.map((opt) => (
          <Radio
            key={opt.value}
            name={name}
            value={opt.value}
            label={opt.label}
            hint={opt.hint}
            size={size}
            disabled={disabled || opt.disabled}
            error={error ? '' : undefined}
            checked={value !== undefined ? value === opt.value : undefined}
            defaultChecked={defaultValue !== undefined ? defaultValue === opt.value : undefined}
            onChange={onChange ? (e) => onChange(e.target.value, e) : undefined}
          />
        ))}
      </div>

      {message && (
        <span id={`${groupId}-msg`} className="RadioGroup__message">
          {message}
        </span>
      )}
    </div>
  );
};

export default Radio;
