import React, { useState } from 'react';
import {
  RangeSlider,
  type RangeSliderTooltipMode,
  type RangeSliderValue,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Inline icons (volume off / volume on) — mirror the Figma examples ───────

const VolumeOffIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M11 5l-4 4H4v6h3l4 4V5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <path d="M16 9l4 6m0-6l-4 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const VolumeOnIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M11 5l-4 4H4v6h3l4 4V5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <path
      d="M15 8c1.5 1 2.5 2.5 2.5 4s-1 3-2.5 4M18 5.5C20 7 21.5 9.4 21.5 12s-1.5 5-3.5 6.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Range Slider
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Single- or dual-thumb slider from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}8px gray track, brand-500 fill, 20px white thumb with shadow-md, dark tooltip.
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

// ─── Sections ─────────────────────────────────────────────────────────────────

// Frame 1: bare track variants (15424-44099)
function BareVariants() {
  const [single, setSingle] = useState<number>(40);
  const [dual,   setDual]   = useState<[number, number]>([30, 65]);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, maxWidth: 491 }}>
        <Caption tag="default" dim="track 491 × 8 · thumb 20">
          <RangeSlider
            value={single}
            onChange={(v) => setSingle(v as number)}
            tooltip="never"
          />
        </Caption>

        <Caption tag="range" dim="two thumbs">
          <RangeSlider
            value={dual}
            onChange={(v) => setDual(v as [number, number])}
            tooltip="never"
          />
        </Caption>
      </div>
    </Panel>
  );
}

// Frame 2: full examples (3284-22435)
function FullExamples() {
  const [percent, setPercent] = useState<number>(40);
  const [price,   setPrice]   = useState<[number, number]>([300, 2500]);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <RangeSlider
          value={percent}
          onChange={(v) => setPercent(v as number)}
          formatValue={(v) => `${v}%`}
          leadingIcon={<VolumeOffIcon />}
          trailingIcon={<VolumeOnIcon />}
          ticks={['100%', '100%', '100%', '100%', '100%']}
        />

        <RangeSlider
          value={price}
          onChange={(v) => setPrice(v as [number, number])}
          min={0}
          max={5000}
          step={50}
          formatValue={(v) => `$${v}`}
          leadingIcon={<VolumeOffIcon />}
          trailingIcon={<VolumeOnIcon />}
          leadingLabel="0%"
          trailingLabel="100%"
        />
      </div>
    </Panel>
  );
}

function StatesGallery() {
  const [v, setV] = useState<number>(50);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Caption tag="hover tooltip" dim="appears on focus / drag">
          <RangeSlider
            value={v}
            onChange={(x) => setV(x as number)}
            tooltip="hover"
            formatValue={(x) => `${x}%`}
          />
        </Caption>

        <Caption tag="no tooltip" dim="bare slider">
          <RangeSlider value={v} onChange={(x) => setV(x as number)} tooltip="never" />
        </Caption>

        <Caption tag="ticks" dim="evenly distributed">
          <RangeSlider
            value={v}
            onChange={(x) => setV(x as number)}
            tooltip="never"
            ticks={['0', '25', '50', '75', '100']}
          />
        </Caption>

        <Caption tag="disabled" dim="non-interactive">
          <RangeSlider defaultValue={35} disabled tooltip="never" />
        </Caption>
      </div>
    </Panel>
  );
}

function Caption({ tag, dim, children }: { tag: string; dim: string; children: React.ReactNode }) {
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
      <div>{children}</div>
    </div>
  );
}

// ─── Playground ──────────────────────────────────────────────────────────────

const TOOLTIP_OPTIONS: RangeSliderTooltipMode[] = ['always', 'hover', 'never'];

function Playground() {
  const [isRange, setIsRange]     = useState(false);
  const [single, setSingle]       = useState<number>(40);
  const [dual, setDual]           = useState<[number, number]>([20, 70]);
  const [tooltip, setTooltip]     = useState<RangeSliderTooltipMode>('always');
  const [withIcons, setWithIcons] = useState(true);
  const [withTicks, setWithTicks] = useState(false);
  const [disabled, setDisabled]   = useState(false);

  const value: RangeSliderValue = isRange ? dual : single;
  const onChange = (v: RangeSliderValue) => {
    if (Array.isArray(v)) setDual(v);
    else setSingle(v);
  };

  const codeProps = [
    `value={${isRange ? '[20, 70]' : '40'}}`,
    `tooltip="${tooltip}"`,
    withIcons && 'leadingIcon trailingIcon',
    withTicks && 'ticks={[...]}',
    disabled && 'disabled',
  ].filter(Boolean).join(' ');

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="mode">
            <Segmented
              value={isRange ? 'range' : 'single'}
              options={['single', 'range'] as const}
              onChange={(v) => setIsRange(v === 'range')}
            />
          </ControlGroup>
          <ControlGroup label="tooltip">
            <Segmented value={tooltip} options={TOOLTIP_OPTIONS} onChange={setTooltip} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="icons"    value={withIcons} onChange={setWithIcons} />
              <Toggle label="ticks"    value={withTicks} onChange={setWithTicks} />
              <Toggle label="disabled" value={disabled}  onChange={setDisabled} />
            </div>
          </ControlGroup>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8,
            padding: '40px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: 180,
            background: '#fff',
          }}>
            <RangeSlider
              value={value}
              onChange={onChange}
              tooltip={tooltip}
              disabled={disabled}
              formatValue={(v) => `${v}%`}
              leadingIcon={withIcons ? <VolumeOffIcon /> : undefined}
              trailingIcon={withIcons ? <VolumeOnIcon /> : undefined}
              ticks={withTicks ? ['0%', '25%', '50%', '75%', '100%'] : undefined}
            />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<RangeSlider ${codeProps} />`}
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
  { name: 'value',         type: 'number · [number, number]',   default: '—',       description: 'Controlled value. Pass a tuple to enable range mode.' },
  { name: 'defaultValue',  type: 'number · [number, number]',   default: '—',       description: 'Initial value in uncontrolled mode.' },
  { name: 'onChange',      type: '(v) => void',                 default: '—',       description: 'Fires on every drag tick or arrow-key step.' },
  { name: 'min',           type: 'number',                      default: '0',       description: 'Minimum value.' },
  { name: 'max',           type: 'number',                      default: '100',     description: 'Maximum value.' },
  { name: 'step',          type: 'number',                      default: '1',       description: 'Step size for both pointer and keyboard.' },
  { name: 'formatValue',   type: '(v) => string',               default: 'String',  description: 'Format the tooltip + auto-derived side labels.' },
  { name: 'tooltip',       type: 'always · hover · never',      default: 'always',  description: 'Tooltip visibility.' },
  { name: 'leadingIcon',   type: 'ReactNode',                   default: '—',       description: 'Icon rendered before everything else.' },
  { name: 'trailingIcon',  type: 'ReactNode',                   default: '—',       description: 'Icon rendered after everything else.' },
  { name: 'leadingLabel',  type: 'ReactNode',                   default: 'auto',    description: 'Defaults to formatValue(min) when an icon is set.' },
  { name: 'trailingLabel', type: 'ReactNode',                   default: 'auto',    description: 'Defaults to formatValue(max) when an icon is set.' },
  { name: 'ticks',         type: 'ReactNode[]',                 default: '—',       description: 'Tick labels rendered below the track, evenly spaced.' },
  { name: 'disabled',      type: 'boolean',                     default: 'false',   description: 'Disables interaction and dims the slider.' },
  { name: 'ariaLabel',     type: 'string',                      default: '—',       description: 'Accessible name forwarded to each thumb.' },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function RangeSliderGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Track variants" note="Bare slider — single thumb (default) and dual thumb (range)." />
      <BareVariants />

      <SectionHeader title="Decorated examples" note="With icons, side labels, value tooltip, and (top) tick labels — matches the Figma example frame." />
      <FullExamples />

      <SectionHeader title="States" note="Tooltip mode, ticks, disabled." />
      <StatesGallery />

      <SectionHeader title="Playground" note="Live preview with editable props." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
