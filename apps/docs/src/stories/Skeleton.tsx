import React, { useState } from 'react';
import {
  Skeleton,
  SkeletonCardImage,
  SkeletonImageText,
  SkeletonText,
  SkeletonSimpleText,
  SkeletonList,
  SkeletonWidget,
} from '@paapeli/ui-kit';

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
        Skeleton
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Loading placeholder from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Six pre-built layouts mirror the Figma frames pixel-for-pixel; pair with the primitive
        {' '}<code style={{ fontFamily: MONO, fontSize: 12 }}>{'<Skeleton>'}</code> for custom shapes.
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

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, color: BRAND_MID, background: BRAND_BG,
      border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '1px 5px',
    }}>
      {label}
    </span>
  );
}

function Frame({ label, dim, animate, children, full }: {
  label: string; dim: string; animate: boolean; children: React.ReactNode; full?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag label={label} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)' }}>
          {dim}
        </span>
      </div>
      <div style={{
        padding: 24,
        border: '1px dashed var(--docs-border)',
        borderRadius: 10,
        background: '#fff',
        display: 'flex',
        justifyContent: full ? 'stretch' : 'flex-start',
      }}>
        {React.cloneElement(children as React.ReactElement<{ animate?: boolean }>, { animate })}
      </div>
    </div>
  );
}

// ─── Primitive showcase ──────────────────────────────────────────────────────

function PrimitiveSection({ animate }: { animate: boolean }) {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Row label='variant="rect"' code={`<Skeleton width={200} height={12} />`}>
          <Skeleton width={200} height={12} animate={animate} />
        </Row>
        <Row label='variant="circle"' code={`<Skeleton variant="circle" size={40} />`}>
          <Skeleton variant="circle" size={40} animate={animate} />
        </Row>
        <Row label='variant="image"' code={`<Skeleton variant="image" width={200} height={120} />`}>
          <Skeleton variant="image" width={200} height={120} animate={animate} />
        </Row>
        <Row label="custom rounded" code={`<Skeleton width={200} height={48} rounded={8} />`}>
          <Skeleton width={200} height={48} rounded={8} animate={animate} />
        </Row>
      </div>
    </Panel>
  );
}

function Row({ label, code, children }: { label: string; code: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'center' }}>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: BRAND_MID, marginBottom: 4 }}>
          {label}
        </div>
        <code style={{
          fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)',
          display: 'block', whiteSpace: 'nowrap',
        }}>
          {code}
        </code>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 60 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Layouts grid ────────────────────────────────────────────────────────────

function LayoutGrid({ animate }: { animate: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
      gap: 24,
    }}>
      <Frame label="card-image"  dim="384 × 241" animate={animate}>
        <SkeletonCardImage />
      </Frame>
      <Frame label="image-text"  dim="600 × 180" animate={animate} full>
        <SkeletonImageText />
      </Frame>
      <Frame label="text"        dim="640 × 96"  animate={animate} full>
        <SkeletonText />
      </Frame>
      <Frame label="simple-text" dim="640 × 116" animate={animate} full>
        <SkeletonSimpleText />
      </Frame>
      <Frame label="list"        dim="300 × 200" animate={animate}>
        <SkeletonList />
      </Frame>
      <Frame label="widget"      dim="300 × 309" animate={animate}>
        <SkeletonWidget />
      </Frame>
    </div>
  );
}

// ─── Real-use mock — toggling between skeleton and content ───────────────────

function LoadingDemo() {
  const [loading, setLoading] = useState(true);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          onClick={() => setLoading((v) => !v)}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 14px',
            fontFamily: MONO, fontSize: 11,
            border: `1px solid ${BRAND_MID}`,
            background: BRAND_BG, color: BRAND_MID,
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          {loading ? 'Show content' : 'Show skeleton'}
        </button>

        <div style={{
          padding: 24,
          border: '1px solid var(--docs-border)',
          borderRadius: 10,
          background: '#fff',
          maxWidth: 600,
        }}>
          {loading ? (
            <SkeletonImageText />
          ) : (
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{
                width: 216, height: 180, flexShrink: 0,
                borderRadius: 12, background: '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT, fontSize: 11, color: 'var(--docs-text-muted)',
              }}>
                cover.jpg
              </div>
              <div style={{ flex: 1, fontFamily: FONT, color: 'var(--docs-text)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
                  Designing with Paapeli
                </h3>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--docs-text-muted)' }}>
                  Skeleton screens give your users a sense of progress while real
                  content is fetched. Use the pre-built layouts as drop-in
                  replacements while assets stream in, then swap them with the
                  loaded UI for a smooth transition.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

// ─── Playground ──────────────────────────────────────────────────────────────

const LAYOUTS = ['card-image', 'image-text', 'text', 'simple-text', 'list', 'widget'] as const;
type LayoutKind = (typeof LAYOUTS)[number];

function renderLayout(kind: LayoutKind, animate: boolean) {
  switch (kind) {
    case 'card-image':  return <SkeletonCardImage  animate={animate} />;
    case 'image-text':  return <SkeletonImageText  animate={animate} />;
    case 'text':        return <SkeletonText       animate={animate} />;
    case 'simple-text': return <SkeletonSimpleText animate={animate} />;
    case 'list':        return <SkeletonList       animate={animate} />;
    case 'widget':      return <SkeletonWidget     animate={animate} />;
  }
}

function Playground() {
  const [layout, setLayout]   = useState<LayoutKind>('card-image');
  const [animate, setAnimate] = useState(true);

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="layout">
            <Segmented value={layout} options={LAYOUTS} onChange={setLayout} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <Toggle label="animate" value={animate} onChange={setAnimate} />
          </ControlGroup>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: 200,
            background: '#fff',
          }}>
            {renderLayout(layout, animate)}
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<Skeleton${pascal(layout)} ${animate ? '' : 'animate={false} '}/>`}
          </pre>
        </div>
      </div>
    </Panel>
  );
}

function pascal(s: string): string {
  return s.split('-').map((p) => p[0]?.toUpperCase() + p.slice(1)).join('');
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

// ─── Props tables ────────────────────────────────────────────────────────────

const PRIMITIVE_PROPS = [
  { name: 'variant', type: 'rect · circle · image', default: 'rect',  description: 'Shape preset.' },
  { name: 'width',   type: 'number · string',       default: '—',     description: 'Width — numbers become px.' },
  { name: 'height',  type: 'number · string',       default: '—',     description: 'Height — numbers become px.' },
  { name: 'size',    type: 'number · string',       default: '—',     description: 'Shorthand for circle (sets both width and height).' },
  { name: 'rounded', type: 'number · string',       default: '—',     description: 'Override border-radius.' },
  { name: 'animate', type: 'boolean',               default: 'true',  description: 'Pulse animation. Disable for static placeholders.' },
];

const LAYOUT_PROPS = [
  { name: 'animate', type: 'boolean',   default: 'true',    description: 'Forwarded to every primitive in the layout.' },
  { name: 'rows',    type: 'number',    default: '5',       description: 'List only — number of rows to render.' },
  { name: 'bars',    type: 'number',    default: '7',       description: 'Widget only — number of chart bars.' },
  { name: 'ariaLabel', type: 'string',  default: 'Loading', description: 'Accessible name for the live region.' },
  { name: 'className', type: 'string',  default: '—',       description: 'Style override.' },
  { name: 'style',     type: 'CSSProperties', default: '—', description: 'Style override.' },
];

function PropsTable({ rows }: { rows: typeof PRIMITIVE_PROPS }) {
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

// ─── Page ────────────────────────────────────────────────────────────────────

export function SkeletonGallery() {
  const animate = true;

  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Layouts" note="The six Figma frames — sizes shown next to each tag." />
      <LayoutGrid animate={animate} />

      <SectionHeader title="Primitive" note="Use the base Skeleton for custom shapes." />
      <PrimitiveSection animate={animate} />

      <SectionHeader title="Loading mock" note="Toggle between the skeleton and the loaded content." />
      <LoadingDemo />

      <SectionHeader title="Playground" />
      <Playground />

      <SectionHeader title="Skeleton props" />
      <PropsTable rows={PRIMITIVE_PROPS} />

      <SectionHeader title="Layout props" note="Shared across the six pre-built layouts." />
      <PropsTable rows={LAYOUT_PROPS} />
    </div>
  );
}
