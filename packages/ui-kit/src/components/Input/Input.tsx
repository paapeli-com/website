import type {
  CSSProperties,
  ChangeEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
  ReactNode,
  RefObject,
} from 'react';
import { useId, useState } from 'react';

import './Input.scss';
import Icon from '../Icon/Icon';
import { buildClassName } from '../../util';

export type InputVariant =
  | 'default'
  | 'addon-icon'
  | 'addon-text'
  | 'inner-button'
  | 'stacked';

export type InputSize    = 'sm' | 'base' | 'lg' | 'xl';
export type InputStatus  = 'default' | 'success' | 'danger';

export type InputProps = {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;

  variant?: InputVariant;
  size?: InputSize;
  status?: InputStatus;

  /** Leading icon — defaults to a generic user glyph. Pass `false` to suppress. */
  icon?: ReactNode | false;
  /** Text prefix for the `addon-text` variant (e.g. `"https://"`). */
  addonText?: ReactNode;
  /** Right-side button content for the `inner-button` variant. */
  action?: ReactNode;
  /** Top label shown inside the field for the `stacked` variant. */
  stackedLabel?: ReactNode;

  id?: string;
  name?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  pattern?: string;
  tabIndex?: number;

  onChange?: ChangeEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onClear?: () => void;

  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
  style?: CSSProperties;
};

// ─── Component ────────────────────────────────────────────────────────────────

const Input: React.FC<InputProps> = ({
  label,
  required,
  hint,
  variant = 'default',
  size = 'base',
  status = 'default',
  icon,
  addonText,
  action,
  stackedLabel,
  id,
  name,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled,
  readOnly,
  autoComplete,
  autoFocus,
  maxLength,
  min,
  max,
  step,
  pattern,
  tabIndex,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onClear,
  inputRef,
  className,
  style,
}) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const hasValue = currentValue !== '' && currentValue !== undefined;

  const showIcon = icon !== false;
  const renderedIcon = icon ?? <Icon name="user" />;

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
  };

  const wrapperClassName = buildClassName(
    'Input',
    `Input--${variant}`,
    `Input--${size}`,
    `Input--${status}`,
    isFocused && 'Input--focused',
    disabled && 'Input--disabled',
    readOnly && 'Input--readonly',
    hasValue && 'Input--filled',
    className,
  );

  const nativeInputProps = {
    ref: inputRef,
    id: fieldId,
    name,
    type,
    value,
    defaultValue: isControlled ? undefined : defaultValue,
    placeholder,
    disabled,
    readOnly,
    autoComplete,
    autoFocus,
    maxLength,
    min,
    max,
    step,
    pattern,
    tabIndex,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown,
    className: 'Input__native',
  };

  const clearBtn = onClear ? (
    <button
      type="button"
      className="Input__clear"
      onClick={onClear}
      disabled={disabled}
      tabIndex={-1}
      aria-label="Clear"
    >
      <Icon name="close" />
    </button>
  ) : null;

  // ── Field rendering ─────────────────────────────────────────────────────────

  let fieldInner: ReactNode;

  if (variant === 'addon-icon') {
    fieldInner = (
      <>
        <span className="Input__addon Input__addon--icon" aria-hidden="true">
          {renderedIcon}
        </span>
        <input {...nativeInputProps} />
        {clearBtn}
      </>
    );
  } else if (variant === 'addon-text') {
    fieldInner = (
      <>
        <span className="Input__addon Input__addon--text">{addonText}</span>
        {showIcon && <span className="Input__icon">{renderedIcon}</span>}
        <input {...nativeInputProps} />
        {clearBtn}
      </>
    );
  } else if (variant === 'inner-button') {
    fieldInner = (
      <>
        {showIcon && <span className="Input__icon">{renderedIcon}</span>}
        <input {...nativeInputProps} />
        {clearBtn}
        {action && <span className="Input__action">{action}</span>}
      </>
    );
  } else if (variant === 'stacked') {
    fieldInner = (
      <div className="Input__stacked">
        {stackedLabel !== undefined && (
          <span className="Input__stacked-label">{stackedLabel}</span>
        )}
        <div className="Input__stacked-row">
          {showIcon && <span className="Input__icon">{renderedIcon}</span>}
          <input {...nativeInputProps} />
        </div>
      </div>
    );
  } else {
    // default
    fieldInner = (
      <>
        {showIcon && <span className="Input__icon">{renderedIcon}</span>}
        <input {...nativeInputProps} />
        {clearBtn}
      </>
    );
  }

  return (
    <div className={wrapperClassName} style={style}>
      {label && (
        <label className="Input__label" htmlFor={fieldId}>
          {label}
          {required && (
            <span className="Input__required" aria-hidden="true"> *</span>
          )}
        </label>
      )}

      <div className="Input__field-wrap">
        {fieldInner}
      </div>

      {hint && <span className="Input__hint">{hint}</span>}
    </div>
  );
};

export default Input;
