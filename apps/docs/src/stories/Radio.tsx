import React, { useState } from 'react';
import {
  Radio,
  RadioGroup,
  type RadioSize,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Reference data ───────────────────────────────────────────────────────────

const SIZES: RadioSize[] = ['sm', 'base', 'lg'];

const PLAN_OPTIONS = [
  { value: 'free',   label: 'Free',     hint: 'For personal use — single workspace.' },
  { value: 'pro',    label: 'Pro',      hint: 'For small teams — unlimited workspaces.' },
  { value: 'enterprise', label: 'Enterprise', hint: 'SSO, audit logs, dedicated support.' },
];

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Radio
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Single-choice input from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Pair with <code style={{ fontFamily: MONO, fontSize: 12 }}>{'<RadioGroup>'}</code> for managed selection state.
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
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, max-content)',
        columnGap: 32, rowGap: 24, alignItems: 'center',
      }}>
        <Cell label="initial">
          <Radio name="state-1" ariaLabel="initial unchecked" />
        </Cell>
        <Cell label="checked">
          <Radio name="state-2" defaultChecked ariaLabel="initial checked" />
        </Cell>
        <Cell label="disabled">
          <Radio name="state-3" disabled ariaLabel="disabled unchecked" />
        </Cell>
        <Cell label="disabled · checked">
          <Radio name="state-4" disabled defaultChecked ariaLabel="disabled checked" />
        </Cell>

        <Cell label="error">
          <Radio name="state-5" error="" ariaLabel="error" />
        </Cell>
        <Cell label="error · checked">
          <Radio name="state-6" error="" defaultChecked ariaLabel="error checked" />
        </Cell>
        <Cell label="">
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
            tab to focus
          </span>
        </Cell>
        <span />
      </div>
    </Panel>
  );
}

function SizeMatrix() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {SIZES.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
              {s}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Radio size={s} name={`size-${s}-a`} label="Unchecked" />
              <Radio size={s} name={`size-${s}-b`} label="Checked" defaultChecked />
              <Radio size={s} name={`size-${s}-c`} label="Disabled" disabled defaultChecked />
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
        <Radio name="label-1" label="Send me product updates" />
        <Radio
          name="label-2"
          label="Email"
          hint="We'll send a verification link to confirm."
        />
        <Radio
          name="label-3"
          label="SMS"
          error="A delivery channel is required."
        />
      </div>
    </Panel>
  );
}

// ─── RadioGroup ──────────────────────────────────────────────────────────────

function VerticalGroup() {
  const [value, setValue] = useState('pro');
  return (
    <Panel>
      <RadioGroup
        name="plan"
        label="Plan"
        hint="You can change this later from billing settings."
        options={PLAN_OPTIONS}
        value={value}
        onChange={setValue}
      />
    </Panel>
  );
}

function HorizontalGroup() {
  const [value, setValue] = useState('pro');
  return (
    <Panel>
      <RadioGroup
        name="plan-h"
        label="Plan"
        orientation="horizontal"
        options={PLAN_OPTIONS.map(({ value, label }) => ({ value, label }))}
        value={value}
        onChange={setValue}
      />
    </Panel>
  );
}

function GroupWithError() {
  return (
    <Panel>
      <RadioGroup
        name="plan-error"
        label="Plan"
        required
        error="Please pick a plan to continue."
        options={PLAN_OPTIONS.map(({ value, label }) => ({ value, label }))}
      />
    </Panel>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

function Playground() {
  const [size, setSize]                   = useState<RadioSize>('base');
  const [orientation, setOrientation]     = useState<'vertical' | 'horizontal'>('vertical');
  const [hasHint, setHasHint]             = useState(true);
  const [hasError, setHasError]           = useState(false);
  const [disabled, setDisabled]           = useState(false);
  const [value, setValue]                 = useState('pro');

  const codeProps = [
    `name="plan"`,
    `size="${size}"`,
    `orientation="${orientation}"`,
    disabled && 'disabled',
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
          <ControlGroup label="orientation">
            <Segmented value={orientation} options={['vertical', 'horizontal'] as const} onChange={setOrientation} />
          </ControlGroup>
          <ControlGroup label="state">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="disabled" value={disabled} onChange={setDisabled} />
              <Toggle label="hint"     value={hasHint}  onChange={setHasHint} />
              <Toggle label="error"    value={hasError} onChange={setHasError} />
            </div>
          </ControlGroup>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 24,
            display: 'flex', alignItems: 'flex-start', minHeight: 120,
          }}>
            <RadioGroup
              name="playground"
              label="Plan"
              size={size}
              orientation={orientation}
              disabled={disabled}
              hint={hasHint ? 'You can change this later from billing settings.' : undefined}
              error={hasError ? 'Please pick a plan to continue.' : undefined}
              options={PLAN_OPTIONS.map(({ value, label, hint }) => ({
                value, label, hint: orientation === 'vertical' ? hint : undefined,
              }))}
              value={value}
              onChange={setValue}
            />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<RadioGroup ${codeProps} options={...} value={value} onChange={setValue} />`}
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

function Toggle({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
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

// ─── Props tables ─────────────────────────────────────────────────────────────

const RADIO_PROPS = [
  { name: 'size',           type: 'sm · base · lg', default: 'base',  description: '14 / 16 / 18 px circle.' },
  { name: 'label',          type: 'ReactNode',      default: '—',     description: 'Visible label rendered next to the circle.' },
  { name: 'hint',           type: 'ReactNode',      default: '—',     description: 'Helper text shown under the row.' },
  { name: 'error',          type: 'ReactNode',      default: '—',     description: 'Error message — replaces hint and applies the danger style.' },
  { name: 'required',       type: 'boolean',        default: 'false', description: 'Marks the field required.' },
  { name: 'checked',        type: 'boolean',        default: '—',     description: 'Controlled checked state.' },
  { name: 'defaultChecked', type: 'boolean',        default: '—',     description: 'Initial checked state in uncontrolled mode.' },
  { name: 'disabled',       type: 'boolean',        default: 'false', description: 'Disables the input.' },
  { name: 'name',           type: 'string',         default: '—',     description: 'Form group name — radios in the same group must share this.' },
  { name: 'value',          type: 'string',         default: '—',     description: 'Native form value.' },
  { name: 'onChange',       type: '(e) => void',    default: '—',     description: 'Native change handler.' },
];

const GROUP_PROPS = [
  { name: 'name',         type: 'string',                  default: '—',          description: 'Form group name applied to every option.' },
  { name: 'options',      type: 'RadioOption[]',           default: '—',          description: 'Items to render — { value, label, hint?, disabled? }.' },
  { name: 'value',        type: 'string',                  default: '—',          description: 'Controlled selected value.' },
  { name: 'defaultValue', type: 'string',                  default: '—',          description: 'Uncontrolled initial value.' },
  { name: 'onChange',     type: '(value, e) => void',      default: '—',          description: 'Fires with the new value when selection changes.' },
  { name: 'orientation',  type: 'vertical · horizontal',   default: 'vertical',   description: 'Layout direction.' },
  { name: 'size',         type: 'sm · base · lg',          default: 'base',       description: 'Forwarded to every Radio.' },
  { name: 'label',        type: 'ReactNode',               default: '—',          description: 'Group label.' },
  { name: 'hint',         type: 'ReactNode',               default: '—',          description: 'Group helper text.' },
  { name: 'error',        type: 'ReactNode',               default: '—',          description: 'Group error — flags every option.' },
  { name: 'required',     type: 'boolean',                 default: 'false',      description: 'Marks the group required.' },
  { name: 'disabled',     type: 'boolean',                 default: 'false',      description: 'Disables every option.' },
];

function PropsTable({ rows }: { rows: typeof RADIO_PROPS }) {
  return (
    <Panel padding={0}>
      <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr 130px 2fr' }}>
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

        {rows.map((row, i) => (
          <React.Fragment key={row.name}>
            <RowCell first last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code></RowCell>
            <RowCell last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code></RowCell>
            <RowCell last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code></RowCell>
            <RowCell last={i === rows.length - 1}>
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

export function RadioGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="States" note="Initial · checked · disabled · error." />
      <StateMatrix />

      <SectionHeader title="Sizes" note="14px (sm), 16px (base, default), 18px (lg)." />
      <SizeMatrix />

      <SectionHeader title="With label · hint · error" />
      <WithLabelAndHint />

      <SectionHeader title="RadioGroup — vertical" note="Manages selection across an array of options. Hints render under each row." />
      <VerticalGroup />

      <SectionHeader title="RadioGroup — horizontal" />
      <HorizontalGroup />

      <SectionHeader title="RadioGroup — error" note="Applies the danger style to every option." />
      <GroupWithError />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Radio props" />
      <PropsTable rows={RADIO_PROPS} />

      <SectionHeader title="RadioGroup props" />
      <PropsTable rows={GROUP_PROPS} />
    </div>
  );
}
