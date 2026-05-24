import React, { useState } from 'react';
import {
  Toggle,
  type ToggleSize,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

const SIZES: ToggleSize[] = ['base', 'lg'];

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Toggle
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        On/off switch from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Two pixel-exact sizes — <code style={{ fontFamily: MONO, fontSize: 12 }}>base</code> (36×20) and <code style={{ fontFamily: MONO, fontSize: 12 }}>lg</code> (44×24).
      </p>
    </div>
  );
}

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{ margin: '40px 0 16px' }}>
      <h2 style={{
        fontSize: 11, fontWeight: 700, fontFamily: FONT, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--docs-text-muted)', margin: 0,
      }}>
        {title}
      </h2>
      {note && (
        <p style={{ fontSize: 12, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: '6px 0 0' }}>
          {note}
        </p>
      )}
    </div>
  );
}

function Panel({ children, padding = 24 }: { children: React.ReactNode; padding?: number }) {
  return (
    <div style={{
      borderRadius: 10,
      border: '1px solid var(--docs-border)',
      background: 'var(--docs-panel-bg)',
      padding,
    }}>
      {children}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function StateMatrix() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {SIZES.map((size) => (
          <div key={size}>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
            }}>
              size = {size}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, max-content)',
              columnGap: 32, rowGap: 18, alignItems: 'center',
            }}>
              <Cell label="initial">
                <Toggle size={size} ariaLabel={`${size} initial off`} />
              </Cell>
              <Cell label="initial · checked">
                <Toggle size={size} defaultChecked ariaLabel={`${size} initial on`} />
              </Cell>

              <Cell label="disabled">
                <Toggle size={size} disabled ariaLabel={`${size} disabled off`} />
              </Cell>
              <Cell label="disabled · checked">
                <Toggle size={size} disabled defaultChecked ariaLabel={`${size} disabled on`} />
              </Cell>
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)', marginTop: 12,
            }}>
              tab into the switch above to see the focus ring
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function WithLabelAndHint() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Toggle label="Enable notifications" />
        <Toggle
          label="Two-factor authentication"
          hint="Require a security code in addition to your password."
          required
        />
        <Toggle
          label="Public profile"
          error="You must accept the privacy terms before making your profile public."
        />
        <Toggle label="Right-aligned label" labelPosition="left" />
      </div>
    </Panel>
  );
}

function ControlledDemo() {
  const [wifi, setWifi]         = useState(true);
  const [bluetooth, setBt]      = useState(false);
  const [airplane, setAirplane] = useState(false);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 360 }}>
        <Row label="Wi-Fi"       value={wifi}      onChange={setWifi} />
        <Row label="Bluetooth"   value={bluetooth} onChange={setBt} />
        <Row label="Airplane mode" value={airplane} onChange={setAirplane}
             hint={airplane ? 'Wireless radios off.' : undefined} />
      </div>
    </Panel>
  );
}

function Row({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px',
      border: '1px solid var(--docs-border)',
      borderRadius: 8,
    }}>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: 'var(--docs-text)' }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginTop: 2 }}>
            {hint}
          </div>
        )}
      </div>
      <Toggle
        ariaLabel={label}
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

function Playground() {
  const [size, setSize]             = useState<ToggleSize>('base');
  const [checked, setChecked]       = useState(false);
  const [disabled, setDisabled]     = useState(false);
  const [hasLabel, setHasLabel]     = useState(true);
  const [hasHint, setHasHint]       = useState(false);
  const [hasError, setHasError]     = useState(false);
  const [labelLeft, setLabelLeft]   = useState(false);

  const codeProps = [
    `size="${size}"`,
    checked && 'checked',
    disabled && 'disabled',
    hasLabel && `label="..."`,
    labelLeft && `labelPosition="left"`,
    hasHint && `hint="..."`,
    hasError && `error="..."`,
  ].filter(Boolean).join(' ');

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="size">
            <Segmented value={size} options={SIZES} onChange={setSize} />
          </ControlGroup>
          <ControlGroup label="state">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle2 label="checked"  value={checked}  onChange={setChecked} />
              <Toggle2 label="disabled" value={disabled} onChange={setDisabled} />
            </div>
          </ControlGroup>
          <ControlGroup label="content">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle2 label="label"      value={hasLabel}  onChange={setHasLabel} />
              <Toggle2 label="label left" value={labelLeft} onChange={setLabelLeft} />
              <Toggle2 label="hint"       value={hasHint}   onChange={setHasHint} />
              <Toggle2 label="error"      value={hasError}  onChange={setHasError} />
            </div>
          </ControlGroup>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: 120,
          }}>
            <Toggle
              size={size}
              checked={checked}
              disabled={disabled}
              labelPosition={labelLeft ? 'left' : 'right'}
              label={hasLabel ? 'Enable notifications' : undefined}
              hint={hasHint ? 'You can change this later in settings.' : undefined}
              error={hasError ? 'This field is required.' : undefined}
              onChange={(e) => setChecked(e.target.checked)}
            />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<Toggle ${codeProps} />`}
          </pre>
        </div>
      </div>
    </Panel>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, disabled }: { value: T; options: readonly T[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', flexWrap: 'wrap',
      border: '1px solid var(--docs-border)', borderRadius: 6, overflow: 'hidden',
      opacity: disabled ? 0.45 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 10px',
              fontFamily: MONO, fontSize: 11,
              border: 'none', borderRight: '1px solid var(--docs-border)',
              background: active ? BRAND : 'var(--docs-panel-bg)',
              color: active ? '#ffffff' : 'var(--docs-text)',
              cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Toggle2({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        padding: '6px 10px',
        fontFamily: MONO, fontSize: 11,
        border: `1px solid ${value && !disabled ? BRAND_MID : 'var(--docs-border)'}`,
        background: value && !disabled ? BRAND_BG : 'var(--docs-panel-bg)',
        color: value && !disabled ? BRAND_MID : 'var(--docs-text)',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

const PROPS_TABLE = [
  { name: 'size',           type: 'base · lg',     default: 'base',  description: '36×20 (base) or 44×24 (lg) track.' },
  { name: 'label',          type: 'ReactNode',     default: '—',     description: 'Visible label rendered next to the switch.' },
  { name: 'labelPosition',  type: 'left · right',  default: 'right', description: 'Place the label before or after the switch.' },
  { name: 'hint',           type: 'ReactNode',     default: '—',     description: 'Helper text shown under the row.' },
  { name: 'error',          type: 'ReactNode',     default: '—',     description: 'Error message — replaces hint and applies the danger style.' },
  { name: 'required',       type: 'boolean',       default: 'false', description: 'Marks the field required.' },
  { name: 'checked',        type: 'boolean',       default: '—',     description: 'Controlled checked state.' },
  { name: 'defaultChecked', type: 'boolean',       default: '—',     description: 'Initial state in uncontrolled mode.' },
  { name: 'disabled',       type: 'boolean',       default: 'false', description: 'Disables the input.' },
  { name: 'name',           type: 'string',        default: '—',     description: 'Native form name.' },
  { name: 'value',          type: 'string',        default: '—',     description: 'Native form value.' },
  { name: 'ariaLabel',      type: 'string',        default: '—',     description: 'Accessible name when no visual label is rendered.' },
  { name: 'onChange',       type: '(e) => void',   default: '—',     description: 'Native change handler.' },
];

function PropsTable() {
  return (
    <Panel padding={0}>
      <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr 110px 2fr' }}>
        {['Prop', 'Type', 'Default', 'Description'].map((h) => (
          <div key={h} style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700, color: 'var(--docs-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '12px 14px', borderBottom: '1px solid var(--docs-border)',
            background: 'var(--docs-page-bg)',
          }}>
            {h}
          </div>
        ))}
        {PROPS_TABLE.map((row, i) => (
          <React.Fragment key={row.name}>
            <RowCell first last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code></RowCell>
            <RowCell last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code></RowCell>
            <RowCell last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code></RowCell>
            <RowCell last={i === PROPS_TABLE.length - 1}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>{row.description}</span>
            </RowCell>
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

function RowCell({ children, first, last }: { children: React.ReactNode; first?: boolean; last?: boolean }) {
  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: last ? 'none' : '1px solid var(--docs-border)',
      background: first ? 'var(--docs-page-bg)' : 'transparent',
    }}>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ToggleGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="States" note="Initial · checked · disabled · focus, at both sizes." />
      <StateMatrix />

      <SectionHeader title="With label · hint · error" />
      <WithLabelAndHint />

      <SectionHeader title="Settings rows" note="Live example — toggles control React state." />
      <ControlledDemo />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
