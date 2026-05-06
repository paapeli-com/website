import React, { useState } from 'react';
import {
  Input,
  Button,
  type InputVariant,
  type InputSize,
  type InputStatus,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT  = '"Poppins", "Inter", system-ui, sans-serif';
const MONO  = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Reference data ───────────────────────────────────────────────────────────

const VARIANTS: InputVariant[] = ['default', 'addon-icon', 'addon-text', 'inner-button', 'stacked'];
const SIZES: InputSize[]       = ['sm', 'base', 'lg', 'xl'];
const STATUSES: InputStatus[]  = ['default', 'success', 'danger'];

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Input
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Form input field from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Four layout variants, four sizes, three semantic statuses, and full form-field wrappers
        (label, helper text).
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

function CodeChip({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, color: BRAND_MID, background: BRAND_BG,
      border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '1px 5px',
    }}>
      {label}
    </span>
  );
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  );
}

// ─── Variant reference ────────────────────────────────────────────────────────

function VariantReference() {
  const rows = [
    { variant: 'default',      shape: '36–52px',        description: 'Standard input: leading icon slot inline, clear button, all states.' },
    { variant: 'addon-icon',   shape: '36–52px + box',  description: 'Leading icon in a left-attached box separated by a vertical divider.' },
    { variant: 'addon-text',   shape: '36–52px + prefix', description: 'Left-attached text prefix (e.g. "https://"), with optional icon.' },
    { variant: 'inner-button', shape: '36–52px + action', description: 'Right-side button slot with a real button look (white bg, border).' },
    { variant: 'stacked',      shape: '36–52px stacked',  description: 'Centered two-row layout: top label + icon/value row below.' },
  ];

  return (
    <Panel padding={0}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr' }}>
        {['variant', 'shape', 'description'].map((h) => (
          <div key={h} style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700, color: 'var(--docs-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '12px 14px', borderBottom: '1px solid var(--docs-border)',
            background: 'var(--docs-page-bg)',
          }}>
            {h}
          </div>
        ))}
        {rows.map((r, i) => (
          <React.Fragment key={r.variant}>
            <div style={{ padding: '10px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--docs-border)', background: 'var(--docs-page-bg)' }}>
              <CodeChip label={r.variant} />
            </div>
            <div style={{ padding: '10px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--docs-border)', fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)', whiteSpace: 'nowrap' }}>
              {r.shape}
            </div>
            <div style={{ padding: '10px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--docs-border)', fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
              {r.description}
            </div>
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

// ─── Sizes showcase ───────────────────────────────────────────────────────────

function SizesShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SIZES.map((s) => (
          <Input key={s} size={s} placeholder={`size="${s}"`} onClear={() => undefined} />
        ))}
      </div>
    </Panel>
  );
}

// ─── States showcase ──────────────────────────────────────────────────────────

function StatesShowcase() {
  return (
    <Panel>
      <Grid>
        <Input placeholder="Initial" onClear={() => undefined} />
        <Input placeholder="Filled" value="name@company.com" onClear={() => undefined} onChange={() => undefined} />
        <Input status="success" placeholder="Success" value="name@company.com" hint="Email address verified." onClear={() => undefined} onChange={() => undefined} />
        <Input status="danger"  placeholder="Danger"  value="name@company.com" hint="Weak password. Must contain 8+ characters." onClear={() => undefined} onChange={() => undefined} />
        <Input disabled placeholder="Disabled" value="name@company.com" onClear={() => undefined} onChange={() => undefined} />
        <Input readOnly placeholder="Read-only" value="name@company.com" onClear={() => undefined} onChange={() => undefined} />
      </Grid>
    </Panel>
  );
}

// ─── Form field (label + hint) ────────────────────────────────────────────────

function FormFieldShowcase() {
  return (
    <Panel>
      <Grid>
        <Input
          label="First name"
          required
          placeholder="Placeholder text"
          hint="Weak password. Must contain:"
          onClear={() => undefined}
        />
        <Input
          label="Email address"
          required
          status="danger"
          placeholder="name@company.com"
          value="invalid-email"
          hint="Please enter a valid email address."
          onClear={() => undefined}
          onChange={() => undefined}
        />
        <Input
          label="Website"
          placeholder="yourwebsite.com"
          hint="Your public profile URL."
          onClear={() => undefined}
        />
        <Input
          label="Username"
          status="success"
          placeholder="johndoe"
          value="amirkian"
          hint="Username is available."
          onClear={() => undefined}
          onChange={() => undefined}
        />
      </Grid>
    </Panel>
  );
}

// ─── Addon text variant ───────────────────────────────────────────────────────

function AddonTextShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input variant="addon-text" addonText="https://" placeholder="yoursite.com" onClear={() => undefined} />
        <Input variant="addon-text" addonText="https://" placeholder="yoursite.com" value="paapeli.io" onClear={() => undefined} onChange={() => undefined} />
        <Input variant="addon-text" addonText="https://" status="danger" placeholder="yoursite.com" value="invalid url" hint="Enter a valid URL." onClear={() => undefined} onChange={() => undefined} />
        <Input variant="addon-text" addonText="https://" disabled placeholder="yoursite.com" onClear={() => undefined} />
      </div>
    </Panel>
  );
}

// ─── Addon icon variant ───────────────────────────────────────────────────────

function AddonIconShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input variant="addon-icon" placeholder="Placeholder text" onClear={() => undefined} />
        <Input variant="addon-icon" placeholder="name@company.com" value="amir@paapeli.io" onClear={() => undefined} onChange={() => undefined} />
        <Input variant="addon-icon" status="success" placeholder="Username" value="amirkian" onClear={() => undefined} onChange={() => undefined} />
        <Input variant="addon-icon" status="danger"  placeholder="Username" value="taken_handle" onClear={() => undefined} onChange={() => undefined} />
      </div>
    </Panel>
  );
}

// ─── Inner button variant ─────────────────────────────────────────────────────

function InnerButtonShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          variant="inner-button"
          placeholder="Placeholder text"
          action={<Button size="xs" color="secondary" outline>← Button text →</Button>}
          onClear={() => undefined}
        />
        <Input
          variant="inner-button"
          placeholder="Search currencies…"
          action={<Button size="xs" color="secondary" outline>USD $</Button>}
          onClear={() => undefined}
        />
        <Input
          size="lg"
          variant="inner-button"
          placeholder="Enter amount"
          action={<Button size="sm" color="brand">Subscribe</Button>}
        />
      </div>
    </Panel>
  );
}

// ─── Stacked variant (centered label + value row) ────────────────────────────

function StackedShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          variant="stacked"
          stackedLabel="99"
          placeholder="Placeholder text"
        />
        <Input
          variant="stacked"
          stackedLabel="Quantity"
          placeholder="0"
          value="42"
          onChange={() => undefined}
        />
        <Input
          variant="stacked"
          size="lg"
          stackedLabel="Email"
          placeholder="name@company.com"
          value="amir@paapeli.io"
          onChange={() => undefined}
        />
      </div>
    </Panel>
  );
}

// ─── Dismissible / controlled demo ────────────────────────────────────────────

function ControlledDemo() {
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState<InputStatus>('default');
  const [hint, setHint]     = useState<string | undefined>();

  const validate = () => {
    if (!email.includes('@')) {
      setStatus('danger');
      setHint('Please enter a valid email address.');
    } else {
      setStatus('success');
      setHint('Looks good!');
    }
  };

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <Input
          label="Email address"
          required
          type="email"
          placeholder="name@company.com"
          value={email}
          status={status}
          hint={hint}
          onChange={(e) => { setEmail(e.target.value); setStatus('default'); setHint(undefined); }}
          onClear={() => { setEmail(''); setStatus('default'); setHint(undefined); }}
          onBlur={validate}
        />
        <Button size="sm" color="brand" onClick={validate}>Validate</Button>
      </div>
    </Panel>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

function Playground() {
  const [variant, setVariant]   = useState<InputVariant>('default');
  const [size, setSize]         = useState<InputSize>('base');
  const [status, setStatus]     = useState<InputStatus>('default');
  const [withLabel, setWithLabel]   = useState(true);
  const [withHint, setWithHint]     = useState(false);
  const [withClear, setWithClear]   = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) 2fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="variant">
            <Segmented value={variant} options={VARIANTS} onChange={setVariant} />
          </ControlGroup>
          <ControlGroup label="size">
            <Segmented value={size} options={SIZES} onChange={setSize} />
          </ControlGroup>
          <ControlGroup label="status">
            <Segmented value={status} options={STATUSES} onChange={setStatus} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="label"    value={withLabel}   onChange={setWithLabel} />
              <Toggle label="hint"     value={withHint}    onChange={setWithHint} />
              <Toggle label="onClear"  value={withClear}   onChange={setWithClear} />
              <Toggle label="disabled" value={isDisabled}  onChange={setIsDisabled} />
            </div>
          </ControlGroup>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 16 }}>
            <Input
              variant={variant}
              size={size}
              status={status}
              label={withLabel ? 'First name' : undefined}
              required={withLabel}
              hint={withHint ? (status === 'danger' ? 'Something went wrong.' : status === 'success' ? 'Looks good!' : 'Helper text goes here.') : undefined}
              placeholder="Placeholder text"
              disabled={isDisabled}
              addonText={variant === 'addon-text' ? 'https://' : undefined}
              stackedLabel={variant === 'stacked' ? '99' : undefined}
              action={variant === 'inner-button' ? (<Button size="xs" color="secondary" outline>← Button text →</Button>) : undefined}
              onClear={withClear ? () => undefined : undefined}
            />
          </div>
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

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'inline-flex', flexWrap: 'wrap', border: '1px solid var(--docs-border)', borderRadius: 6, overflow: 'hidden' }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 10px', fontFamily: MONO, fontSize: 11,
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
        padding: '6px 10px', fontFamily: MONO, fontSize: 11,
        border: `1px solid ${value && !disabled ? BRAND_MID : 'var(--docs-border)'}`,
        background: value && !disabled ? BRAND_BG : 'var(--docs-panel-bg)',
        color: value && !disabled ? BRAND_MID : 'var(--docs-text)',
        borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  );
}

// ─── Props table ──────────────────────────────────────────────────────────────

const PROPS_TABLE: { name: string; type: string; default: string; description: string }[] = [
  { name: 'variant',       type: 'default · addon-icon · addon-text · inner-button · stacked',  default: 'default',  description: 'Layout variant of the input field.' },
  { name: 'size',          type: 'sm · base · lg · xl',                            default: 'base',     description: 'Height and font size of the field.' },
  { name: 'status',        type: 'default · success · danger',                     default: 'default',  description: 'Semantic validation state (colors border, icon, hint).' },
  { name: 'label',         type: 'ReactNode',                                       default: '—',        description: 'Field label rendered above the input.' },
  { name: 'required',      type: 'boolean',                                         default: 'false',    description: 'Appends a red * to the label.' },
  { name: 'hint',          type: 'ReactNode',                                       default: '—',        description: 'Helper or error text shown below the field.' },
  { name: 'icon',          type: 'ReactNode | false',                               default: 'user icon','description': 'Leading icon. Pass false to suppress.' },
  { name: 'addonText',     type: 'ReactNode',                                       default: '—',        description: 'Text prefix for the addon-text variant (e.g. "https://").' },
  { name: 'action',        type: 'ReactNode',                                       default: '—',        description: 'Content in the inner-button slot. Plain children get a default button look.' },
  { name: 'stackedLabel',  type: 'ReactNode',                                       default: '—',        description: 'Top-row label inside the field for the stacked variant.' },
  { name: 'onClear',       type: '() => void',                                      default: '—',        description: 'When provided, renders a clear (×) button.' },
  { name: 'placeholder',   type: 'string',                                          default: '—',        description: 'Standard HTML placeholder.' },
  { name: 'value',         type: 'string',                                          default: '—',        description: 'Controlled value.' },
  { name: 'defaultValue',  type: 'string',                                          default: '—',        description: 'Uncontrolled initial value.' },
  { name: 'disabled',      type: 'boolean',                                         default: 'false',    description: 'Disables the input and dims the field.' },
  { name: 'readOnly',      type: 'boolean',                                         default: 'false',    description: 'Makes the input read-only.' },
  { name: 'type',          type: 'string',                                          default: 'text',     description: 'HTML input type (text, email, password, number, …).' },
  { name: 'inputRef',      type: 'RefObject<HTMLInputElement>',                     default: '—',        description: 'Ref forwarded to the underlying <input> element.' },
];

function PropsTable() {
  return (
    <Panel padding={0}>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px 2fr' }}>
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
            <Cell first last={i === PROPS_TABLE.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code>
            </Cell>
            <Cell last={i === PROPS_TABLE.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code>
            </Cell>
            <Cell last={i === PROPS_TABLE.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code>
            </Cell>
            <Cell last={i === PROPS_TABLE.length - 1}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>{row.description}</span>
            </Cell>
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

function Cell({ children, first, last }: { children: React.ReactNode; first?: boolean; last?: boolean }) {
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

export function InputGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Variants" note="The four layout variants supported by Input." />
      <VariantReference />

      <SectionHeader title="Sizes" note="Four heights driven by the size prop." />
      <SizesShowcase />

      <SectionHeader title="States" note="Initial, filled, success, danger, disabled, and read-only." />
      <StatesShowcase />

      <SectionHeader title="Form field" note="Label + input + hint compose a full form row." />
      <FormFieldShowcase />

      <SectionHeader title="Addon icon" note="Leading icon in a left-attached box separated from the input." />
      <AddonIconShowcase />

      <SectionHeader title="Addon text" note='Left-attached text prefix (e.g. "https://") with icon and clear button.' />
      <AddonTextShowcase />

      <SectionHeader title="Inner button" note="Embedded action slot separated by a thin divider." />
      <InnerButtonShowcase />

      <SectionHeader title="Stacked" note="Centered two-row layout: stackedLabel above the icon + value row." />
      <StackedShowcase />

      <SectionHeader title="Controlled + validation" note="Live demo: blur validates the email and updates status/hint." />
      <ControlledDemo />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
