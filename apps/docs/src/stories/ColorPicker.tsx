import React, { useState } from 'react';
import { ColorPicker, type ColorPickerMode } from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Color Picker
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Color selector from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Two modes — <code style={{ fontFamily: MONO, fontSize: 12 }}>swatches</code> (preset grid) and{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>advanced</code> (SV canvas + hue + hex/RGB inputs + eyedropper).
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

function Panel({ children, padding = 32 }: { children: React.ReactNode; padding?: number }) {
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

function ValueChip({ value }: { value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 28, height: 28, borderRadius: 6, background: value,
        border: '1px solid rgba(0,0,0,0.06)',
      }} />
      <code style={{
        fontFamily: MONO, fontSize: 13, color: 'var(--docs-text)',
        background: 'var(--docs-page-bg)', padding: '4px 8px', borderRadius: 4,
        border: '1px solid var(--docs-border)',
      }}>
        {value}
      </code>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Variants() {
  const [a, setA] = useState('#ff7900');
  const [b, setB] = useState('#7c86ff');

  return (
    <Panel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, max-content))',
        gap: 32, alignItems: 'flex-start',
      }}>
        <Variant tag="swatches" dim="192 × 265">
          <ColorPicker
            mode="swatches"
            value={a}
            onChange={setA}
            resetColor="#ffffff"
          />
          <ValueChip value={a} />
        </Variant>

        <Variant tag="advanced" dim="240 × 256">
          <ColorPicker
            mode="advanced"
            value={b}
            onChange={setB}
          />
          <ValueChip value={b} />
        </Variant>
      </div>
    </Panel>
  );
}

function Variant({ tag, dim, children }: { tag: string; dim: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: MONO, fontSize: 10, color: BRAND_MID, background: BRAND_BG,
          border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '1px 5px',
        }}>
          {tag}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)' }}>
          {dim}
        </span>
      </div>
      {children}
    </div>
  );
}

function CustomSwatches() {
  const [color, setColor] = useState('#155dfc');

  const palette = [
    '#fb2c36', '#ff7900', '#ffdf20', '#00c950', '#00bba7', '#155dfc',
    '#7c86ff', '#9810fa', '#e60076', '#101828', '#62748e', '#f1f5f9',
  ];

  return (
    <Panel>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <ColorPicker
          mode="swatches"
          value={color}
          onChange={setColor}
          swatches={palette}
          label="Brand colors"
        />
        <pre style={{
          fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
          background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
          borderRadius: 8, padding: '12px 14px', margin: 0, whiteSpace: 'pre',
        }}>
{`<ColorPicker
  mode="swatches"
  swatches={brandColors}
  label="Brand colors"
  value={color}
  onChange={setColor}
/>`}
        </pre>
      </div>
    </Panel>
  );
}

// ─── Live "as a popover" demo — opens an advanced picker on click ────────────

function PopoverDemo() {
  const [color, setColor] = useState('#ff7900');
  const [open, setOpen]   = useState(false);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative', width: 240 }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%',
              padding: '10px 14px',
              background: '#ffffff',
              border: '1px solid var(--docs-border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: FONT, fontSize: 14, color: 'var(--docs-text)',
            }}
          >
            <span style={{
              width: 24, height: 24, borderRadius: 6, background: color,
              border: '1px solid rgba(0,0,0,0.06)', flexShrink: 0,
            }} />
            <span style={{ flex: 1, textAlign: 'left' }}>Selected color</span>
            <code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text-muted)' }}>
              {color}
            </code>
          </button>

          {open && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 10 }}>
              <ColorPicker
                mode="advanced"
                value={color}
                onChange={setColor}
              />
            </div>
          )}
        </div>

        <span style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)' }}>
          Click the trigger to toggle the picker. The picker is just an inline component —
          drop it into your own popover/dialog as you like.
        </span>
      </div>
    </Panel>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

function Playground() {
  const [mode, setMode]       = useState<ColorPickerMode>('swatches');
  const [color, setColor]     = useState('#ff7900');
  const [withReset, setReset] = useState(true);

  const code = mode === 'swatches'
    ? `<ColorPicker\n  mode="swatches"\n  value={color}\n  onChange={setColor}${withReset ? '\n  resetColor="#ffffff"' : ''}\n/>`
    : `<ColorPicker\n  mode="advanced"\n  value={color}\n  onChange={setColor}\n/>`;

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="mode">
            <Segmented value={mode} options={['swatches', 'advanced'] as const} onChange={setMode} />
          </ControlGroup>
          {mode === 'swatches' && (
            <ControlGroup label="reset">
              <Toggle label="Show 'Reset color'" value={withReset} onChange={setReset} />
            </ControlGroup>
          )}
          <ControlGroup label="value">
            <ValueChip value={color} />
          </ControlGroup>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8,
            padding: 24, minHeight: 200,
            display: 'flex', alignItems: 'flex-start',
            background: '#ffffff',
          }}>
            <ColorPicker
              mode={mode}
              value={color}
              onChange={setColor}
              resetColor={mode === 'swatches' && withReset ? '#ffffff' : undefined}
            />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre',
          }}>
            {code}
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
    <div style={{
      display: 'inline-flex', flexWrap: 'wrap',
      border: '1px solid var(--docs-border)', borderRadius: 6, overflow: 'hidden',
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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        padding: '6px 10px',
        fontFamily: MONO, fontSize: 11,
        border: `1px solid ${value ? BRAND_MID : 'var(--docs-border)'}`,
        background: value ? BRAND_BG : 'var(--docs-panel-bg)',
        color: value ? BRAND_MID : 'var(--docs-text)',
        borderRadius: 6, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

const PROPS_TABLE = [
  { name: 'value',        type: 'string (#hex)',          default: '—',         description: 'Controlled hex value.' },
  { name: 'defaultValue', type: 'string (#hex)',          default: '#ff7900',   description: 'Initial hex (uncontrolled).' },
  { name: 'onChange',     type: '(hex) => void',          default: '—',         description: 'Fires whenever the picked color changes.' },
  { name: 'mode',         type: 'swatches · advanced',    default: 'swatches',  description: 'Picker variant.' },
  { name: 'swatches',     type: 'string[]',               default: 'DEFAULT_SWATCHES', description: 'Custom palette (swatches mode).' },
  { name: 'resetColor',   type: 'string',                 default: '—',         description: 'When set, shows a "Reset color" button that selects this hex.' },
  { name: 'label',        type: 'ReactNode',              default: 'Pick a color', description: 'Top-of-card title (swatches mode).' },
];

function PropsTable() {
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

// ─── Page ────────────────────────────────────────────────────────────────────

export function ColorPickerGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Variants" note="Side-by-side — both Figma frames at their exact dimensions." />
      <Variants />

      <SectionHeader title="Custom palette" note="Pass any list of hex strings via the `swatches` prop." />
      <CustomSwatches />

      <SectionHeader title="As a popover" note="The picker is just an inline component — drop it into your own dialog/popover." />
      <PopoverDemo />

      <SectionHeader title="Playground" />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
