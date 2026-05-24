import React, { useState } from 'react';
import { Button, type ButtonColor, type ButtonSize } from '@paapeli/ui-kit';

// ─── Theme tokens (mirror BgColors.tsx for visual consistency) ───────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND     = '#803c00';
const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';

// ─── Reference data ───────────────────────────────────────────────────────────

const COLORS: ButtonColor[] = [
  'brand',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'dark',
];

const SIZES: ButtonSize[] = ['xs', 'sm', 'base', 'l', 'xl'];

const SIZE_DETAILS: Record<ButtonSize, { height: number; padX: number; font: number }> = {
  xs:   { height: 32, padX: 12, font: 12 },
  sm:   { height: 36, padX: 14, font: 14 },
  base: { height: 40, padX: 16, font: 14 },
  l:    { height: 48, padX: 20, font: 16 },
  xl:   { height: 52, padX: 24, font: 16 },
};

// Inline icon used to demo `withIcon` / `iconOnly`. Avoids pulling an icon font.
const Sparkle = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Button
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Action trigger from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Available in seven semantic colors, five sizes, and solid or outline modes.
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

// ─── Sections ─────────────────────────────────────────────────────────────────

function VariantMatrix({ outline }: { outline?: boolean }) {
  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, minmax(0, 1fr))', gap: 16, alignItems: 'center' }}>
        {/* Header row */}
        <div />
        {SIZES.map((s) => (
          <div key={s} style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)', textAlign: 'center' }}>
            {s}
          </div>
        ))}

        {/* Body rows */}
        {COLORS.map((c) => (
          <React.Fragment key={c}>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--docs-text)', paddingRight: 8 }}>
              {c}
            </div>
            {SIZES.map((s) => (
              <div key={s} style={{ display: 'flex', justifyContent: 'center' }}>
                <Button color={c} size={s} outline={outline} fluid>
                  Button
                </Button>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

function SizeReference() {
  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto 1fr', columnGap: 24, rowGap: 12, alignItems: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>size</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>height</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>padding x</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>font</div>
        <div />

        {SIZES.map((s) => (
          <React.Fragment key={s}>
            <div><CodeChip label={s} /></div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{SIZE_DETAILS[s].height}px</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{SIZE_DETAILS[s].padX}px</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{SIZE_DETAILS[s].font}px</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button color="brand" size={s} fluid>Get started</Button>
            </div>
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

function StateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 96, fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)' }}>{label}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

function StatesSection() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <StateRow label="Default">
          <Button color="brand" fluid>Save changes</Button>
          <Button color="secondary" fluid>Cancel</Button>
          <Button color="brand" outline fluid>Outline</Button>
        </StateRow>
        <StateRow label="Disabled">
          <Button color="brand" fluid disabled>Save changes</Button>
          <Button color="secondary" fluid disabled>Cancel</Button>
          <Button color="brand" outline fluid disabled>Outline</Button>
        </StateRow>
        <StateRow label="Loading">
          <Button color="brand" fluid isLoading>Save changes</Button>
          <Button color="success" fluid isLoading>Confirm</Button>
          <Button color="brand" outline fluid isLoading>Outline</Button>
        </StateRow>
        <StateRow label="Active (focus)">
          <Button color="brand" fluid isActive>Save changes</Button>
          <Button color="danger" fluid isActive>Delete</Button>
          <Button color="info" outline fluid isActive>Outline</Button>
        </StateRow>
      </div>
    </Panel>
  );
}

function IconSection() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <StateRow label="With icon">
          {SIZES.map((s) => (
            <Button key={s} color="brand" size={s} withIcon fluid>
              <Sparkle size={SIZE_DETAILS[s].font + 2} />
              <span style={{ marginLeft: 6 }}>Generate</span>
            </Button>
          ))}
        </StateRow>
        <StateRow label="Icon only">
          {SIZES.map((s) => (
            <Button key={s} color="brand" size={s} iconOnly ariaLabel="Generate">
              <Sparkle size={SIZE_DETAILS[s].font + 2} />
            </Button>
          ))}
        </StateRow>
        <StateRow label="Outline + icon">
          {SIZES.map((s) => (
            <Button key={s} color="dark" size={s} outline iconOnly ariaLabel="Generate">
              <Sparkle size={SIZE_DETAILS[s].font + 2} />
            </Button>
          ))}
        </StateRow>
      </div>
    </Panel>
  );
}

// ─── Interactive playground ──────────────────────────────────────────────────

function Playground() {
  const [color, setColor] = useState<ButtonColor>('brand');
  const [size, setSize] = useState<ButtonSize>('base');
  const [outline, setOutline] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [iconOnly, setIconOnly] = useState(false);

  const codeProps = [
    `color="${color}"`,
    `size="${size}"`,
    outline && 'outline',
    disabled && 'disabled',
    loading && 'isLoading',
    iconOnly && 'iconOnly',
  ].filter(Boolean).join(' ');

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="color">
            <Segmented value={color} options={COLORS} onChange={setColor} />
          </ControlGroup>
          <ControlGroup label="size">
            <Segmented value={size} options={SIZES} onChange={setSize} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="outline" value={outline} onChange={setOutline} />
              <Toggle label="disabled" value={disabled} onChange={setDisabled} />
              <Toggle label="isLoading" value={loading} onChange={setLoading} />
              <Toggle label="iconOnly" value={iconOnly} onChange={setIconOnly} />
            </div>
          </ControlGroup>
        </div>

        {/* Preview + code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: '32px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120,
          }}>
            <Button
              color={color}
              size={size}
              outline={outline}
              disabled={disabled}
              isLoading={loading}
              iconOnly={iconOnly}
              fluid
              ariaLabel="Generate"
            >
              {iconOnly ? <Sparkle size={SIZE_DETAILS[size].font + 2} /> : 'Click me'}
            </Button>
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<Button ${codeProps}>${iconOnly ? '<Icon />' : 'Click me'}</Button>`}
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
              padding: '6px 10px',
              fontFamily: MONO,
              fontSize: 11,
              border: 'none',
              borderRight: '1px solid var(--docs-border)',
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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        padding: '6px 10px',
        fontFamily: MONO,
        fontSize: 11,
        border: `1px solid ${value ? BRAND_MID : 'var(--docs-border)'}`,
        background: value ? BRAND_BG : 'var(--docs-panel-bg)',
        color: value ? BRAND_MID : 'var(--docs-text)',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// ─── Prop reference ──────────────────────────────────────────────────────────

const PROPS_TABLE: { name: string; type: string; default: string; description: string }[] = [
  { name: 'color',      type: 'brand · secondary · success · danger · warning · info · dark', default: 'brand',  description: 'Semantic color variant.' },
  { name: 'size',       type: 'xs · sm · base · l · xl',                                       default: 'base',   description: 'Height + padding + font scale.' },
  { name: 'outline',    type: 'boolean',                                                       default: 'false',  description: 'Renders the variant in outline mode.' },
  { name: 'fluid',      type: 'boolean',                                                       default: 'false',  description: 'Width is determined by content rather than parent.' },
  { name: 'iconOnly',   type: 'boolean',                                                       default: 'false',  description: 'Square icon-only button (sets a fixed width).' },
  { name: 'withIcon',   type: 'boolean',                                                       default: 'false',  description: 'Sizes nested .icon / .isax glyphs to match the label.' },
  { name: 'isLoading',  type: 'boolean',                                                       default: 'false',  description: 'Shows a Spinner overlay and blocks pointer events.' },
  { name: 'disabled',   type: 'boolean',                                                       default: 'false',  description: 'Visually + interactively disables the button.' },
  { name: 'isActive',   type: 'boolean',                                                       default: 'false',  description: 'Forces the focus / pressed appearance.' },
  { name: 'ripple',     type: 'boolean',                                                       default: 'false',  description: 'Adds Material-style ripple feedback on press.' },
  { name: 'href',       type: 'string',                                                        default: '—',      description: 'Renders an <a target="_blank"> in place of <button>.' },
  { name: 'onClick',    type: '(e) => void',                                                   default: '—',      description: 'Click handler — debounced via the internal click guard.' },
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
            <Cell first last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code></Cell>
            <Cell last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code></Cell>
            <Cell last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code></Cell>
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

// ─── Page ────────────────────────────────────────────────────────────────────

export function ButtonGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Solid variants" note="Default rendering — combine any color with any size." />
      <VariantMatrix />

      <SectionHeader title="Outline variants" note="Pass outline to invert the surface and keep the border." />
      <VariantMatrix outline />

      <SectionHeader title="Sizes" note="Heights and padding pulled from the Figma button component." />
      <SizeReference />

      <SectionHeader title="States" note="Default, disabled, loading and active rendering." />
      <StatesSection />

      <SectionHeader title="With icon · icon only" note="Use withIcon for label + icon; iconOnly fixes the width to the height." />
      <IconSection />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
