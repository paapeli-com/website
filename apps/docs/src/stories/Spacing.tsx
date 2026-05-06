import React from 'react';

// ─── Token data ───────────────────────────────────────────────────────────────
// Source: packages/ui-kit/src/styles/settings/_spacing.scss

type SpacingToken = {
  name: string;   // Tailwind token name (e.g. "4", "0.5", "px")
  rem: string;    // rem or px value shown in Figma
  px: number;     // pixel equivalent
};

const SPACING: SpacingToken[] = [
  { name: '0',    rem: '0px',      px: 0   },
  { name: 'px',   rem: '1px',      px: 1   },
  { name: '0.5',  rem: '0.125rem', px: 2   },
  { name: '1',    rem: '0.25rem',  px: 4   },
  { name: '1.5',  rem: '0.375rem', px: 6   },
  { name: '2',    rem: '0.5rem',   px: 8   },
  { name: '2.5',  rem: '0.625rem', px: 10  },
  { name: '3',    rem: '0.75rem',  px: 12  },
  { name: '3.5',  rem: '0.875rem', px: 14  },
  { name: '4',    rem: '1rem',     px: 16  },
  { name: '4.5',  rem: '1.125rem', px: 18  },
  { name: '5',    rem: '1.25rem',  px: 20  },
  { name: '6',    rem: '1.5rem',   px: 24  },
  { name: '7',    rem: '1.75rem',  px: 28  },
  { name: '8',    rem: '2rem',     px: 32  },
  { name: '9',    rem: '2.25rem',  px: 36  },
  { name: '10',   rem: '2.5rem',   px: 40  },
  { name: '11',   rem: '2.75rem',  px: 44  },
  { name: '12',   rem: '3rem',     px: 48  },
  { name: '14',   rem: '3.5rem',   px: 56  },
  { name: '16',   rem: '4rem',     px: 64  },
  { name: '20',   rem: '5rem',     px: 80  },
  { name: '24',   rem: '6rem',     px: 96  },
  { name: '28',   rem: '7rem',     px: 112 },
  { name: '32',   rem: '8rem',     px: 128 },
  { name: '36',   rem: '9rem',     px: 144 },
  { name: '40',   rem: '10rem',    px: 160 },
  { name: '44',   rem: '11rem',    px: 176 },
  { name: '48',   rem: '12rem',    px: 192 },
  { name: '52',   rem: '13rem',    px: 208 },
  { name: '56',   rem: '14rem',    px: 224 },
  { name: '60',   rem: '15rem',    px: 240 },
  { name: '64',   rem: '16rem',    px: 256 },
  { name: '72',   rem: '18rem',    px: 288 },
  { name: '80',   rem: '20rem',    px: 320 },
  { name: '96',   rem: '24rem',    px: 384 },
];

const MAX_PX = 384;

// ─── Class families ───────────────────────────────────────────────────────────

type ClassFamily = {
  prefix: string;
  label: string;
  description: string;
  property: string;
  tokens: string[];   // representative token names to show in the live demo
};

const CLASS_FAMILIES: ClassFamily[] = [
  {
    prefix: 'p',
    label: 'Padding (all sides)',
    description: 'Sets padding on all four sides.',
    property: 'padding',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'px',
    label: 'Padding X (left + right)',
    description: 'Sets left and right padding.',
    property: 'padding-left / padding-right',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'py',
    label: 'Padding Y (top + bottom)',
    description: 'Sets top and bottom padding.',
    property: 'padding-top / padding-bottom',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'pt',
    label: 'Padding Top',
    description: 'Sets top padding only.',
    property: 'padding-top',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'pr',
    label: 'Padding Right',
    description: 'Sets right padding only.',
    property: 'padding-right',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'pb',
    label: 'Padding Bottom',
    description: 'Sets bottom padding only.',
    property: 'padding-bottom',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'pl',
    label: 'Padding Left',
    description: 'Sets left padding only.',
    property: 'padding-left',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'm',
    label: 'Margin (all sides)',
    description: 'Sets margin on all four sides.',
    property: 'margin',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'mx',
    label: 'Margin X (left + right)',
    description: 'Sets left and right margin. Use .mx-auto for centering.',
    property: 'margin-left / margin-right',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'my',
    label: 'Margin Y (top + bottom)',
    description: 'Sets top and bottom margin.',
    property: 'margin-top / margin-bottom',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'mt',
    label: 'Margin Top',
    description: 'Sets top margin only.',
    property: 'margin-top',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'mr',
    label: 'Margin Right',
    description: 'Sets right margin only.',
    property: 'margin-right',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'mb',
    label: 'Margin Bottom',
    description: 'Sets bottom margin only.',
    property: 'margin-bottom',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'ml',
    label: 'Margin Left',
    description: 'Sets left margin only.',
    property: 'margin-left',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'gap',
    label: 'Gap (row + column)',
    description: 'Sets gap between flex/grid children.',
    property: 'gap',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'gap-x',
    label: 'Gap X (column gap)',
    description: 'Sets column gap between flex/grid children.',
    property: 'column-gap',
    tokens: ['2', '4', '6', '8'],
  },
  {
    prefix: 'gap-y',
    label: 'Gap Y (row gap)',
    description: 'Sets row gap between flex/grid children.',
    property: 'row-gap',
    tokens: ['2', '4', '6', '8'],
  },
];

// ─── Usage examples ───────────────────────────────────────────────────────────

type UsageExample = {
  title: string;
  description: string;
  classes: string;
  render: () => React.ReactNode;
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const FONT      = '"Poppins", "Inter", system-ui, sans-serif';
const MONO      = '"Fira Mono", "Consolas", monospace';
const BRAND     = '#803c00';
const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';

const box = (label: string, extra?: React.CSSProperties): React.ReactNode => (
  <div
    style={{
      background: BRAND_BG,
      border: `1px solid ${BRAND}`,
      borderRadius: 6,
      fontFamily: MONO,
      fontSize: 11,
      color: BRAND,
      textAlign: 'center' as const,
      whiteSpace: 'nowrap' as const,
      ...extra,
    }}
  >
    {label}
  </div>
);

const USAGE_EXAMPLES: UsageExample[] = [
  {
    title: 'Card with .p-6',
    description: 'Uniform padding inside a card component.',
    classes: 'p-6 rounded-base shadow',
    render: () => (
      <div
        className="p-6 rounded-base shadow"
        style={{ background: 'var(--docs-panel-bg)', border: '1px solid var(--docs-border)', display: 'inline-block' }}
      >
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: 'var(--docs-text)', marginBottom: 4 }}>
          Card title
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)' }}>
          Card body with p-6 (1.5rem) padding.
        </div>
      </div>
    ),
  },
  {
    title: 'Horizontal padding with .px-8 .py-3',
    description: 'Button-style padding: wider on the sides than top/bottom.',
    classes: 'px-8 py-3 rounded-base',
    render: () => (
      <div
        className="px-8 py-3 rounded-base"
        style={{ background: BRAND, display: 'inline-block', fontFamily: FONT, fontSize: 14, fontWeight: 600, color: '#fff' }}
      >
        Button label
      </div>
    ),
  },
  {
    title: 'Stack with .mb-4 between items',
    description: 'Vertical rhythm using margin-bottom on each child.',
    classes: 'mb-4',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {['First item', 'Second item', 'Third item'].map((t, i) => (
          <div
            key={i}
            className={i < 2 ? 'mb-4' : ''}
            style={{ background: 'var(--docs-panel-bg)', border: '1px solid var(--docs-border)', borderRadius: 6, padding: '8px 14px', fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)' }}
          >
            {t}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Flex row with .gap-3',
    description: 'Gap between flex children — no margin hacks needed.',
    classes: 'gap-3',
    render: () => (
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {['Tag A', 'Tag B', 'Tag C', 'Tag D'].map((t) => (
          <div
            key={t}
            style={{ background: BRAND_BG, border: `1px solid ${BRAND}`, borderRadius: 20, padding: '4px 12px', fontFamily: MONO, fontSize: 11, color: BRAND }}
          >
            {t}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Grid with .gap-x-6 .gap-y-4',
    description: 'Independent column and row gaps in a CSS grid.',
    classes: 'gap-x-6 gap-y-4',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '1.5rem', rowGap: '1rem' }}>
        {Array.from({ length: 6 }).map((_, i) => box(`item ${i + 1}`, { padding: '10px 0' }))}
      </div>
    ),
  },
  {
    title: 'Section with .mt-12',
    description: 'Large top margin to separate page sections.',
    classes: 'mt-12',
    render: () => (
      <div>
        {box('Previous section', { padding: '12px 16px', marginBottom: 0 })}
        <div style={{ marginTop: '3rem' }}>
          {box('Next section (mt-12 = 3rem above)', { padding: '12px 16px' })}
        </div>
      </div>
    ),
  },
  {
    title: 'Inset divider with .mx-6',
    description: 'Horizontal margin to inset a full-width divider from the edges.',
    classes: 'mx-6',
    render: () => (
      <div style={{ background: 'var(--docs-panel-bg)', border: '1px solid var(--docs-border)', borderRadius: 8, padding: '12px 0' }}>
        <div style={{ padding: '0 16px', fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)', marginBottom: 12 }}>Content above</div>
        <div style={{ marginLeft: '1.5rem', marginRight: '1.5rem', height: 1, background: 'var(--docs-border)' }} />
        <div style={{ padding: '0 16px', fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)', marginTop: 12 }}>Content below</div>
      </div>
    ),
  },
  {
    title: 'Icon + label with .gap-2',
    description: 'Tight gap between an icon and its text label.',
    classes: 'gap-2',
    render: () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: FONT, fontSize: 14, color: 'var(--docs-text)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke={BRAND} strokeWidth="1.5" />
          <path d="M5 8l2 2 4-4" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Action completed</span>
      </div>
    ),
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

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

function SpacingRow({ token }: { token: SpacingToken }) {
  const barPct = token.px === 0 ? 0 : Math.max((token.px / MAX_PX) * 100, 0.3);
  const classes = [`p-${token.name}`, `px-${token.name}`, `py-${token.name}`, `m-${token.name}`, `gap-${token.name}`];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 80px 60px 200px 1fr',
        alignItems: 'center',
        borderBottom: '1px solid var(--docs-border)',
        minHeight: 38,
      }}
    >
      {/* Name */}
      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: BRAND_MID, padding: '0 12px' }}>
        {token.name}
      </span>

      {/* Rem */}
      <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)', padding: '0 12px' }}>
        {token.rem}
      </span>

      {/* Pixels */}
      <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text-muted)', padding: '0 12px' }}>
        {token.px}px
      </span>

      {/* Class examples */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '4px 12px' }}>
        {classes.map((cls) => (
          <span
            key={cls}
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: BRAND,
              background: BRAND_BG,
              border: `1px solid ${BRAND}`,
              borderRadius: 4,
              padding: '1px 5px',
            }}
          >
            .{cls}
          </span>
        ))}
      </div>

      {/* Visual bar */}
      <div style={{ padding: '0 16px 0 0' }}>
        {token.px > 0 && (
          <div
            style={{
              height: 10,
              width: `${barPct}%`,
              minWidth: 2,
              borderRadius: 3,
              background: BRAND_MID,
            }}
          />
        )}
      </div>
    </div>
  );
}

function FamilyRow({ family }: { family: ClassFamily }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '130px 1fr 200px',
        alignItems: 'start',
        borderBottom: '1px solid var(--docs-border)',
        padding: '10px 0',
        gap: 12,
      }}
    >
      {/* Prefix + token chips */}
      <div style={{ padding: '0 0 0 12px' }}>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: BRAND_MID }}>
          .{family.prefix}-{'{n}'}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {family.tokens.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: BRAND,
                background: BRAND_BG,
                border: `1px solid ${BRAND}`,
                borderRadius: 4,
                padding: '1px 5px',
              }}
            >
              .{family.prefix}-{t}
            </span>
          ))}
        </div>
      </div>

      {/* Label + description */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--docs-text)' }}>
          {family.label}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginTop: 2 }}>
          {family.description}
        </div>
      </div>

      {/* CSS property */}
      <div style={{ padding: '0 12px 0 0' }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: 'var(--docs-text-muted)',
            background: 'var(--docs-page-bg)',
            border: '1px solid var(--docs-border)',
            borderRadius: 4,
            padding: '2px 6px',
            display: 'inline-block',
          }}
        >
          {family.property}
        </span>
      </div>
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

export function SpacingPalette() {
  return (
    <div
      style={{
        padding: '36px 40px',
        background: 'var(--docs-page-bg)',
        minHeight: '100vh',
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Spacing
      </h1>
      <p style={{ fontSize: 13, color: 'var(--docs-text-muted)', margin: '0 0 8px' }}>
        36-step scale from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        Each token generates 17 utility classes across padding, margin, and gap.
      </p>

      {/* ── Scale table ──────────────────────────────────────────────────── */}
      <SectionHeader
        title="Scale"
        note="Token name → size value → pixel equivalent → generated class names."
      />
      <div
        style={{
          borderRadius: 12,
          border: '1px solid var(--docs-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '64px 80px 60px 200px 1fr',
            background: 'var(--docs-panel-bg)',
            borderBottom: '1px solid var(--docs-border)',
          }}
        >
          {['Name', 'Size', 'Pixels', 'Classes', ''].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: FONT,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--docs-text-muted)',
                padding: '8px 12px',
              }}
            >
              {h}
            </span>
          ))}
        </div>
        <div style={{ background: 'var(--docs-panel-bg)' }}>
          {SPACING.map((token) => (
            <SpacingRow key={token.name} token={token} />
          ))}
        </div>
      </div>

      {/* ── Class families ───────────────────────────────────────────────── */}
      <SectionHeader
        title="Class Families"
        note="Every prefix works with any of the 36 scale tokens."
      />
      <div
        style={{
          borderRadius: 12,
          border: '1px solid var(--docs-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '130px 1fr 200px',
            background: 'var(--docs-panel-bg)',
            borderBottom: '1px solid var(--docs-border)',
            gap: 12,
          }}
        >
          {['Class prefix', 'Description', 'CSS property'].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: FONT,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--docs-text-muted)',
                padding: '8px 12px',
              }}
            >
              {h}
            </span>
          ))}
        </div>
        <div style={{ background: 'var(--docs-panel-bg)' }}>
          {CLASS_FAMILIES.map((f) => (
            <FamilyRow key={f.prefix} family={f} />
          ))}
        </div>
      </div>

      {/* ── Usage examples ───────────────────────────────────────────────── */}
      <SectionHeader
        title="Usage Examples"
        note="Common patterns showing spacing classes in context."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
      >
        {USAGE_EXAMPLES.map(({ title, description, classes, render }) => (
          <div
            key={title}
            style={{
              borderRadius: 10,
              border: '1px solid var(--docs-border)',
              overflow: 'hidden',
            }}
          >
            {/* Preview */}
            <div
              style={{
                padding: '24px 20px',
                background: 'var(--docs-panel-bg)',
                minHeight: 90,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {render()}
            </div>

            {/* Meta */}
            <div
              style={{
                padding: '10px 14px 12px',
                background: 'var(--docs-page-bg)',
                borderTop: '1px solid var(--docs-border)',
              }}
            >
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--docs-text)' }}>
                {title}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginTop: 2 }}>
                {description}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {classes.split(' ').map((cls) => (
                  <span
                    key={cls}
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      color: BRAND,
                      background: BRAND_BG,
                      border: `1px solid ${BRAND}`,
                      borderRadius: 4,
                      padding: '1px 5px',
                    }}
                  >
                    .{cls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Story export ─────────────────────────────────────────────────────────────

