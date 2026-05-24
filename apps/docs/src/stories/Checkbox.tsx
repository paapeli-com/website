import React, { useState } from 'react';
import {
  Checkbox,
  type CheckboxSize,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Reference data ───────────────────────────────────────────────────────────

const SIZES: CheckboxSize[] = ['sm', 'base', 'lg'];

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Checkbox
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Boolean input from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Three sizes, supports indeterminate and error states.
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
          <Checkbox ariaLabel="initial unchecked" />
        </Cell>
        <Cell label="checked">
          <Checkbox defaultChecked ariaLabel="initial checked" />
        </Cell>
        <Cell label="indeterminate">
          <Checkbox indeterminate ariaLabel="indeterminate" />
        </Cell>
        <Cell label="disabled">
          <Checkbox disabled ariaLabel="disabled unchecked" />
        </Cell>

        <Cell label="disabled · checked">
          <Checkbox disabled defaultChecked ariaLabel="disabled checked" />
        </Cell>
        <Cell label="error">
          <Checkbox error="" ariaLabel="error" />
        </Cell>
        <Cell label="error · checked">
          <Checkbox error="" defaultChecked ariaLabel="error checked" />
        </Cell>
        <Cell label="">
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
            tab to focus
          </span>
        </Cell>
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
              <Checkbox size={s} label="Unchecked" />
              <Checkbox size={s} label="Checked" defaultChecked />
              <Checkbox size={s} label="Indeterminate" indeterminate />
              <Checkbox size={s} label="Disabled" disabled defaultChecked />
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
        <Checkbox label="Subscribe to product updates" />
        <Checkbox
          label="I agree to the terms and conditions"
          hint="You can review the terms at any time in account settings."
          required
        />
        <Checkbox
          label="Receive marketing emails"
          error="Please confirm a marketing preference."
        />
      </div>
    </Panel>
  );
}

// ─── Indeterminate "Select all" demo ──────────────────────────────────────────

function SelectAllDemo() {
  const items = ['Account', 'Billing', 'Notifications', 'Privacy'];
  const [selected, setSelected] = useState<string[]>(['Billing']);

  const allChecked  = selected.length === items.length;
  const someChecked = selected.length > 0 && !allChecked;

  const toggleAll = () => setSelected(allChecked ? [] : items);
  const toggle = (label: string) =>
    setSelected((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Checkbox
          label={<strong>Select all</strong>}
          checked={allChecked}
          indeterminate={someChecked}
          onChange={toggleAll}
        />
        <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => (
            <Checkbox
              key={item}
              label={item}
              checked={selected.includes(item)}
              onChange={() => toggle(item)}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

function Playground() {
  const [size, setSize]                 = useState<CheckboxSize>('base');
  const [checked, setChecked]           = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [disabled, setDisabled]         = useState(false);
  const [hasLabel, setHasLabel]         = useState(true);
  const [hasHint, setHasHint]           = useState(false);
  const [hasError, setHasError]         = useState(false);

  const codeProps = [
    `size="${size}"`,
    checked && 'checked',
    indeterminate && 'indeterminate',
    disabled && 'disabled',
    hasLabel && `label="..."`,
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
              <Toggle label="checked"       value={checked}       onChange={setChecked} />
              <Toggle label="indeterminate" value={indeterminate} onChange={setIndeterminate} />
              <Toggle label="disabled"      value={disabled}      onChange={setDisabled} />
            </div>
          </ControlGroup>
          <ControlGroup label="content">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="label"  value={hasLabel} onChange={setHasLabel} />
              <Toggle label="hint"   value={hasHint}  onChange={setHasHint} />
              <Toggle label="error"  value={hasError} onChange={setHasError} />
            </div>
          </ControlGroup>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: 120,
          }}>
            <Checkbox
              size={size}
              checked={checked}
              indeterminate={indeterminate}
              disabled={disabled}
              label={hasLabel ? 'Accept terms and conditions' : undefined}
              hint={hasHint ? 'Help text appears below.' : undefined}
              error={hasError ? 'This field is required.' : undefined}
              onChange={(e) => setChecked(e.target.checked)}
            />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<Checkbox ${codeProps} />`}
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

// ─── Props table ──────────────────────────────────────────────────────────────

const PROPS_TABLE = [
  { name: 'size',           type: 'sm · base · lg',    default: 'base',  description: '14 / 16 / 18 px box.' },
  { name: 'label',          type: 'ReactNode',         default: '—',     description: 'Visible label rendered next to the box.' },
  { name: 'hint',           type: 'ReactNode',         default: '—',     description: 'Helper text shown under the row.' },
  { name: 'error',          type: 'ReactNode',         default: '—',     description: 'Error message — replaces hint and applies the danger style.' },
  { name: 'required',       type: 'boolean',           default: 'false', description: 'Marks the field required (visual asterisk + native).' },
  { name: 'checked',        type: 'boolean',           default: '—',     description: 'Controlled checked state.' },
  { name: 'defaultChecked', type: 'boolean',           default: '—',     description: 'Initial checked state in uncontrolled mode.' },
  { name: 'indeterminate',  type: 'boolean',           default: 'false', description: 'Mixed state — useful for "select all" controls.' },
  { name: 'disabled',       type: 'boolean',           default: 'false', description: 'Disables the input.' },
  { name: 'name',           type: 'string',            default: '—',     description: 'Native form name.' },
  { name: 'value',          type: 'string',            default: '—',     description: 'Native form value.' },
  { name: 'id',             type: 'string',            default: 'auto',  description: 'Element id (auto-generated when omitted).' },
  { name: 'ariaLabel',      type: 'string',            default: '—',     description: 'Accessible name when no visual label is rendered.' },
  { name: 'onChange',       type: '(e) => void',       default: '—',     description: 'Native change handler.' },
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

export function CheckboxGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="States" note="Initial · checked · indeterminate · disabled · error." />
      <StateMatrix />

      <SectionHeader title="Sizes" note="14px (sm), 16px (base, default), 18px (lg)." />
      <SizeMatrix />

      <SectionHeader title="With label · hint · error" />
      <WithLabelAndHint />

      <SectionHeader title="Indeterminate group" note="Live example — the parent reflects partial selection." />
      <SelectAllDemo />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
