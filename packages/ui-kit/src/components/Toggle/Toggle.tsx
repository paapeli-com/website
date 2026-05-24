import type {
  CSSProperties,
  ChangeEventHandler,
  FocusEventHandler,
  ReactNode,
  RefObject,
} from 'react';
import { useId } from 'react';

import './Toggle.scss';
import { buildClassName } from '../../util/buildClassName.js';

export type ToggleSize = 'base' | 'lg';

export type ToggleProps = {
  size?: ToggleSize;

  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;

  /** Place the label before the switch instead of after. */
  labelPosition?: 'left' | 'right';

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

const Toggle: React.FC<ToggleProps> = ({
  size = 'base',
  label,
  hint,
  error,
  required,
  labelPosition = 'right',
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
    'Toggle',
    `Toggle--${size}`,
    `Toggle--label-${labelPosition}`,
    disabled && 'Toggle--disabled',
    Boolean(error) && 'Toggle--error',
    className,
  );

  const message = error ?? hint;

  const labelNode = label && (
    <span className="Toggle__label">
      {label}
      {required && <span className="Toggle__required" aria-hidden="true"> *</span>}
    </span>
  );

  return (
    <div className={wrapperClassName} style={style}>
      <label className="Toggle__row" htmlFor={fieldId}>
        {labelPosition === 'left' && labelNode}

        <span className="Toggle__control">
          <input
            ref={inputRef}
            id={fieldId}
            type="checkbox"
            role="switch"
            className="Toggle__native"
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
          <span className="Toggle__track" aria-hidden="true">
            <span className="Toggle__knob" />
          </span>
        </span>

        {labelPosition === 'right' && labelNode}
      </label>

      {message && (
        <span id={`${fieldId}-msg`} className="Toggle__message">
          {message}
        </span>
      )}
    </div>
  );
};

export default Toggle;
