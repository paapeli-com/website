import React, { useState } from 'react';
import {
  Spinner,
  type SpinnerSize,
  type SpinnerColor,
} from '@paapeli/ui-kit';

// ─── Theme tokens (mirror BgColors.tsx for visual consistency) ───────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Reference data ──────────────────────────────────────────────────────────

const SIZES: SpinnerSize[] = ['xs', 'small', 'medium', 'base', 'large'];
const COLORS: SpinnerColor[] = ['brand', 'success', 'danger', 'warning', 'info'];

const SIZE_PX: Record<SpinnerSize, number> = {
  xs: 12, small: 24, medium: 50, base: 75, large: 100,
};

// ─── Layout primitives ───────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Spinner
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Indeterminate progress indicator from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Five sizes from 12&nbsp;px to 100&nbsp;px, with or without a track ring.
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

// ─── Sections ────────────────────────────────────────────────────────────────

function SizeRow({ track }: { track: boolean }) {
  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
        {SIZES.map((s) => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Spinner size={s} track={track} />
            <div style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
              {s} · {SIZE_PX[s]}px
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ColorRow() {
  return (
    <Panel>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        {COLORS.map((c) => (
          <div key={String(c)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Spinner size="medium" color={c} />
            <div style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{String(c)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#1e2939', padding: 12, borderRadius: 8 }}>
            <Spinner size="medium" color="white" />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>white (on dark)</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Spinner size="medium" color="#7c3aed" />
          <div style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>custom hex</div>
        </div>
      </div>
    </Panel>
  );
}

function TrackComparison() {
  return (
    <Panel>
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 32, rowGap: 24,
        alignItems: 'center',
      }}>
        <div><CodeChip label="track" /></div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {SIZES.map((s) => <Spinner key={s} size={s} track />)}
        </div>

        <div><CodeChip label="no track" /></div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {SIZES.map((s) => <Spinner key={s} size={s} track={false} />)}
        </div>
      </div>
    </Panel>
  );
}

function InlineUsage() {
  return (
    <Panel padding={24}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row label="Inline with text">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontSize: 14, color: 'var(--docs-text)' }}>
            <Spinner size="xs" track={false} />
            Saving changes…
          </span>
        </Row>

        <Row label="On a dark surface">
          <div style={{
            background: '#1e2939', color: '#fff', padding: '10px 14px', borderRadius: 8,
            display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: FONT, fontSize: 14,
          }}>
            <Spinner size="small" color="white" />
            Uploading 3 files…
          </div>
        </Row>

        <Row label="Inside a brand button">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#ff7900', color: '#fff', padding: '8px 16px', borderRadius: 12,
            fontFamily: FONT, fontWeight: 500, fontSize: 14,
          }}>
            <Spinner size="small" color="white" track={false} />
            Continue
          </span>
        </Row>

        <Row label="Inside an outline button">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: '#ff7900', border: '1px solid #ff7900', padding: '8px 16px', borderRadius: 12,
            fontFamily: FONT, fontWeight: 500, fontSize: 14,
          }}>
            <Spinner size="small" color="current" track={false} />
            Submitting
          </span>
        </Row>
      </div>
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 180, fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)' }}>
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Interactive playground ──────────────────────────────────────────────────

function Playground() {
  const [size, setSize] = useState<SpinnerSize>('medium');
  const [color, setColor] = useState<string>('brand');
  const [track, setTrack] = useState(true);

  const codeProps = [
    `size="${size}"`,
    color !== 'brand' && `color="${color}"`,
    !track && 'track={false}',
  ].filter(Boolean).join(' ');

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="size">
            <Segmented value={size} options={SIZES} onChange={setSize} />
          </ControlGroup>
          <ControlGroup label="color">
            <Segmented
              value={color}
              options={['brand', 'success', 'danger', 'warning', 'info', 'current']}
              onChange={setColor}
            />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <Toggle label="track" value={track} onChange={setTrack} />
          </ControlGroup>
        </div>

        {/* Preview + code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140,
            color: color === 'current' ? '#ff7900' : 'inherit',
          }}>
            <Spinner size={size} color={color as SpinnerColor} track={track} />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<Spinner ${codeProps} />`}
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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        padding: '6px 10px', fontFamily: MONO, fontSize: 11,
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

// ─── Prop reference ──────────────────────────────────────────────────────────

const PROPS_TABLE: { name: string; type: string; default: string; description: string }[] = [
  { name: 'size',        type: 'xs · small · medium · base · large',                       default: 'medium',  description: '12 · 24 · 50 · 75 · 100 px diameter.' },
  { name: 'color',       type: "'brand' | 'white' | 'current' | 'success' | … | string",   default: 'brand',   description: 'Preset name or any CSS color. Use "current" to inherit.' },
  { name: 'track',       type: 'boolean',                                                  default: 'true',    description: 'Render the muted background ring behind the arc.' },
  { name: 'strokeWidth', type: 'number',                                                   default: 'auto',    description: 'Override the size-derived stroke width (px).' },
  { name: 'ariaLabel',   type: 'string',                                                   default: 'Loading', description: 'Accessible label announced by screen readers.' },
];

function PropsTable() {
  return (
    <div style={{
      borderRadius: 10, border: '1px solid var(--docs-border)',
      background: 'var(--docs-panel-bg)', overflow: 'hidden',
    }}>
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
    </div>
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

export function SpinnerGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Sizes (with track)" note="Default rendering — gray track ring with a brand arc." />
      <SizeRow track />

      <SectionHeader title="Sizes (no track)" note="Pass track={false} to render only the spinning arc." />
      <SizeRow track={false} />

      <SectionHeader title="Track comparison" note="Side-by-side at every size." />
      <TrackComparison />

      <SectionHeader title="Color presets" note="Named tokens cover the standard semantic palette. Pass any CSS color for custom hues." />
      <ColorRow />

      <SectionHeader title="Inline usage" note="Common patterns — alongside text, inside buttons, on dark surfaces." />
      <InlineUsage />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
