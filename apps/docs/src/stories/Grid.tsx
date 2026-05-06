import React from 'react';

// ─── Token data ───────────────────────────────────────────────────────────────
// Source: packages/ui-kit/src/styles/settings/_grid.scss

const BREAKPOINTS = [
  { name: 'xs',  px: 380  },
  { name: 'sm',  px: 640  },
  { name: 'md',  px: 768  },
  { name: 'lg',  px: 1024 },
  { name: 'xl',  px: 1280 },
  { name: '2xl', px: 1536 },
];

const GRID_COLUMNS = 12;

// ─── Shared ───────────────────────────────────────────────────────────────────

const FONT      = '"Poppins", "Inter", system-ui, sans-serif';
const MONO      = '"Fira Mono", "Consolas", monospace';
const BRAND     = '#803c00';
const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{ margin: '40px 0 16px' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: 0 }}>
        {title}
      </h2>
      {note && (
        <p style={{ fontSize: 12, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: '4px 0 0' }}>
          {note}
        </p>
      )}
    </div>
  );
}

function TokenLabel({ cls }: { cls: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: BRAND_MID }}>
      .{cls}
    </span>
  );
}

function ExampleCard({ title, description, classes, children }: {
  title: string;
  description: string;
  classes: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--docs-border)', overflow: 'hidden' }}>
      <div style={{ padding: '24px 20px', background: 'var(--docs-panel-bg)', minHeight: 100, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
      <div style={{ padding: '10px 14px 12px', background: 'var(--docs-page-bg)', borderTop: '1px solid var(--docs-border)' }}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--docs-text)' }}>{title}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginTop: 2 }}>{description}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {classes.map((cls) => (
            <span key={cls} style={{ fontFamily: MONO, fontSize: 10, color: BRAND_MID, background: BRAND_BG, border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '1px 5px' }}>
              .{cls}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColBox({ span, label }: { span: number; label?: string }) {
  return (
    <div
      className={`col-${span}`}
      style={{
        background: BRAND_BG,
        border: `1px solid ${BRAND}`,
        borderRadius: 6,
        padding: '6px 0',
        textAlign: 'center',
        fontFamily: MONO,
        fontSize: 11,
        color: BRAND,
      }}
    >
      {label ?? `col-${span}`}
    </div>
  );
}

function GridBox({ span, label, start }: { span: number; label?: string; start?: number }) {
  return (
    <div
      style={{
        gridColumn: start ? `${start} / span ${span}` : `span ${span}`,
        background: BRAND_BG,
        border: `1px solid ${BRAND}`,
        borderRadius: 6,
        padding: '6px 0',
        textAlign: 'center',
        fontFamily: MONO,
        fontSize: 11,
        color: BRAND,
      }}
    >
      {label ?? `span ${span}`}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GridPalette() {
  return (
    <div
      style={{
        padding: '36px 40px',
        background: 'var(--docs-page-bg)',
        minHeight: '100vh',
        fontFamily: FONT,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Grid System
      </h1>
      <p style={{ fontSize: 13, color: 'var(--docs-text-muted)', margin: 0 }}>
        Utility classes from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>. 12-column flex grid + CSS Grid.
      </p>

      {/* ── Breakpoints ──────────────────────────────────────────────────── */}
      <SectionHeader
        title="Breakpoints"
        note="Used by .container max-width, .col-{bp}-{n}, .grid-cols-{bp}-{n}, .col-span-{bp}-{n}"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {BREAKPOINTS.map(({ name, px }) => (
          <div
            key={name}
            style={{
              background: BRAND_BG,
              border: `1px solid ${BRAND}`,
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: BRAND }}>
              .col-{name}-*
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: BRAND_MID, marginTop: 4 }}>
              @media (min-width: {px}px)
            </div>
          </div>
        ))}
      </div>

      {/* ── Container ────────────────────────────────────────────────────── */}
      <SectionHeader
        title="Container"
        note=".container — centred, responsive max-width. .container-fluid — full-width, same padding."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...BREAKPOINTS].reverse().map(({ name, px }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: BRAND_MID, width: 60, flexShrink: 0 }}>
              ≥{px}px
            </span>
            <div
              style={{
                height: 28,
                width: `${Math.min(100, Math.round((px / 1536) * 100))}%`,
                background: BRAND_BG,
                border: `1px solid ${BRAND}`,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 11, color: BRAND }}>
                max-width: {px}px
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Flex Grid — .row + .col-{n} ──────────────────────────────────── */}
      <SectionHeader
        title="Flex Columns — .row / .col / .col-{1..12}"
        note="12-column flex grid. .col auto-fills; .col-{n} takes n/12 of the row."
      />

      {/* All 12 individual columns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[12, 6, 4, 3, 2, 1].map((n) => (
          <div key={n} className="row" style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
            {Array.from({ length: GRID_COLUMNS / n }).map((_, i) => (
              <ColBox key={i} span={n} />
            ))}
          </div>
        ))}
        {/* Mixed columns */}
        <div className="row" style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
          <ColBox span={8} label="col-8" />
          <ColBox span={4} label="col-4" />
        </div>
        <div className="row" style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
          <ColBox span={3} label="col-3" />
          <ColBox span={6} label="col-6" />
          <ColBox span={3} label="col-3" />
        </div>
      </div>

      {/* ── CSS Grid — .grid + .grid-cols-{n} ────────────────────────────── */}
      <SectionHeader
        title="CSS Grid — .grid / .grid-cols-{1..12}"
        note="display: grid with repeat(n, 1fr) columns."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3, 4, 6, 12].map((cols) => (
          <div key={cols}>
            <TokenLabel cls={`grid grid-cols-${cols}`} />
            <div
              className={`grid grid-cols-${cols}`}
              style={{ gap: 4, marginTop: 4 }}
            >
              {Array.from({ length: cols }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: BRAND_BG,
                    border: `1px solid ${BRAND}`,
                    borderRadius: 4,
                    padding: '6px 0',
                    textAlign: 'center',
                    fontFamily: MONO,
                    fontSize: 10,
                    color: BRAND,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Col Span ─────────────────────────────────────────────────────── */}
      <SectionHeader
        title="Col Span — .col-span-{1..12} / .col-span-full"
        note="grid-column: span n. Use inside a .grid parent."
      />
      <div
        className="grid grid-cols-12"
        style={{ gap: 4 }}
      >
        <GridBox span={12} label=".col-span-full" />
        <GridBox span={6}  label=".col-span-6" />
        <GridBox span={6}  label=".col-span-6" />
        <GridBox span={4}  label=".col-span-4" />
        <GridBox span={4}  label=".col-span-4" />
        <GridBox span={4}  label=".col-span-4" />
        <GridBox span={3}  label=".col-span-3" />
        <GridBox span={6}  label=".col-span-6" />
        <GridBox span={3}  label=".col-span-3" />
        <GridBox span={2}  label=".col-span-2" start={3} />
        <GridBox span={4}  label=".col-span-4" start={7} />
      </div>

      {/* ── Col Start ────────────────────────────────────────────────────── */}
      <SectionHeader
        title="Col Start — .col-start-{1..13}"
        note="grid-column-start: n. Positions a grid item explicitly."
      />
      <div
        className="grid grid-cols-12"
        style={{ gap: 4 }}
      >
        {[1, 3, 5, 7, 9, 11].map((start) => (
          <div
            key={start}
            style={{
              gridColumnStart: start,
              gridColumn: `${start} / span 2`,
              background: BRAND_BG,
              border: `1px solid ${BRAND}`,
              borderRadius: 4,
              padding: '6px 0',
              textAlign: 'center',
              fontFamily: MONO,
              fontSize: 10,
              color: BRAND,
            }}
          >
            start-{start}
          </div>
        ))}
      </div>

      {/* ── Usage Examples ──────────────────────────────────────── */}
      <SectionHeader title="Usage Examples" note="Real layout patterns using the grid system." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <ExampleCard title="Page wrapper" description=".container centres content with responsive max-width and padding." classes={['container']}>
          <div style={{ width: '100%', background: 'var(--docs-page-bg)', border: '1px dashed var(--docs-border)', borderRadius: 6, position: 'relative' as const }}>
            <div style={{ margin: '0 auto', maxWidth: 240, background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 4, padding: '8px 12px', fontFamily: FONT, fontSize: 12, color: BRAND, textAlign: 'center' as const }}>
              .container content
            </div>
            <span style={{ position: 'absolute' as const, top: 4, left: 6, fontFamily: MONO, fontSize: 9, color: 'var(--docs-text-muted)' }}>page</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Sidebar + main" description="Classic two-column layout: sidebar (col-3) and main (col-9)." classes={['row', 'col-3', 'col-9']}>
          <div style={{ width: '100%', display: 'flex', gap: 6 }}>
            <div style={{ flex: '0 0 25%', background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 4, padding: '10px 8px', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>
              col-3<br/>Sidebar
            </div>
            <div style={{ flex: '0 0 75%', background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 4, padding: '10px 8px', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>
              col-9<br/>Main content
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Three-column card grid" description=".grid .grid-cols-3 evenly distributes cards across the row." classes={['grid', 'grid-cols-3']}>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {['Card A', 'Card B', 'Card C'].map((c) => (
              <div key={c} style={{ background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 6, padding: '10px 6px', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>{c}</div>
            ))}
          </div>
        </ExampleCard>

        <ExampleCard title="Feature trio" description="Three equal-width feature blocks using col-span-4 inside grid-cols-12." classes={['grid', 'grid-cols-12', 'col-span-4']}>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
            {['Fast', 'Flexible', 'Scalable'].map((f) => (
              <div key={f} style={{ gridColumn: 'span 4', background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 6, padding: '10px 0', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>{f}</div>
            ))}
          </div>
        </ExampleCard>

        <ExampleCard title="Centred content block" description="col-span-8 col-start-3 centres a block in a 12-col grid." classes={['grid-cols-12', 'col-span-8', 'col-start-3']}>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
            <div style={{ gridColumn: '3 / span 8', background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 6, padding: '10px 0', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>
              col-span-8 col-start-3
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Auto flex columns" description=".row + .col divides space equally between any number of children." classes={['row', 'col']}>
          <div style={{ width: '100%', display: 'flex', gap: 6 }}>
            {['col', 'col', 'col', 'col'].map((_, i) => (
              <div key={i} style={{ flex: '1 1 0', background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 4, padding: '8px 0', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>
                .col
              </div>
            ))}
          </div>
        </ExampleCard>

        <ExampleCard title="Responsive grid" description="grid-cols-1 stacked on mobile, grid-cols-md-3 at ≥768px." classes={['grid', 'grid-cols-1', 'grid-cols-md-3']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            <div style={{ fontFamily: FONT, fontSize: 11, color: 'var(--docs-text-muted)', marginBottom: 2 }}>Mobile (stacked)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
              {['A', 'B', 'C'].map((n) => <div key={n} style={{ background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 4, padding: '4px 0', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>{n}</div>)}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: 'var(--docs-text-muted)', marginTop: 4, marginBottom: 2 }}>Desktop (3 cols at md)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {['A', 'B', 'C'].map((n) => <div key={n} style={{ background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 4, padding: '4px 0', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>{n}</div>)}
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Asymmetric layout" description="col-8 + col-4 for a wide content area with a narrow aside." classes={['row', 'col-8', 'col-4']}>
          <div style={{ width: '100%', display: 'flex', gap: 6 }}>
            <div style={{ flex: '0 0 66.667%', background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 4, padding: '14px 10px', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>
              col-8<br/>Article
            </div>
            <div style={{ flex: '0 0 33.333%', background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 4, padding: '14px 6px', fontFamily: MONO, fontSize: 10, color: BRAND, textAlign: 'center' as const }}>
              col-4<br/>Aside
            </div>
          </div>
        </ExampleCard>

      </div>
    </div>
  );
}

// ─── Story export ─────────────────────────────────────────────────────────────

