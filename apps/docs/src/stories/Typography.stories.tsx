import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FontSizeToken  = { name: string; px: number; usage?: string };
type FontWeightToken = { name: string; value: number; cssClass: string; usage: string };
type TrackingToken  = { name: string; value: string; usage: string };
type FontFamilyToken = { name: string; stack: string };

// ─── Token data ───────────────────────────────────────────────────────────────
// Source: packages/ui-kit/src/styles/settings/_font.scss

const FONT_FAMILIES: FontFamilyToken[] = [
  { name: 'font-base', stack: 'Poppins, sans-serif' },
];

const FONT_WEIGHTS: FontWeightToken[] = [
  { name: 'normal',    value: 400, cssClass: 'font-normal',    usage: 'Paragraphs, helper texts and articles' },
  { name: 'medium',    value: 500, cssClass: 'font-medium',    usage: 'Button texts, labels, CTA texts and some headings' },
  { name: 'semibold',  value: 600, cssClass: 'font-semibold',  usage: 'Main headings' },
  { name: 'bold',      value: 700, cssClass: 'font-bold',      usage: 'H1 headings in hero sections' },
  { name: 'extrabold', value: 800, cssClass: 'font-extrabold', usage: 'H1 headings in hero sections' },
];

const LETTER_SPACINGS: TrackingToken[] = [
  { name: 'tracking-tighter', value: '−0.8px', usage: 'Big H1 headings — improves visual appearance and readability' },
  { name: 'tracking-tight',   value: '−0.4px', usage: 'Section and card headings — improves visual appearance and readability' },
  { name: 'tracking-normal',  value: '0px',    usage: 'Default — no additional tracking applied' },
];

const FONT_SIZES: FontSizeToken[] = [
  { name: 'text-xxs',  px: 10,                                             },
  { name: 'text-xs',   px: 12,                                             },
  { name: 'text-sm',   px: 14,                                             },
  { name: 'text-base', px: 16, usage: 'Paragraphs and larger buttons'      },
  { name: 'text-lg',   px: 18,                                             },
  { name: 'text-xl',   px: 20,                                             },
  { name: 'text-2xl',  px: 24,                                             },
  { name: 'text-3xl',  px: 30,                                             },
  { name: 'text-4xl',  px: 36, usage: 'Block headings'                     },
  { name: 'text-5xl',  px: 48,                                             },
  { name: 'text-6xl',  px: 56, usage: 'Larger headings like H1 (Hero blocks)' },
];

// ─── Shared styles ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND     = '#803c00';
const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';

function ExampleCard({ title, description, classes, children }: {
  title: string;
  description: string;
  classes: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--docs-border)', overflow: 'hidden' }}>
      <div style={{ padding: '24px 20px', background: 'var(--docs-panel-bg)', minHeight: 90, display: 'flex', alignItems: 'center' }}>
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

const ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '200px 1fr 1fr',
  alignItems: 'center',
  borderRadius: 12,
  border: '1px solid var(--docs-border)',
  overflow: 'hidden',
  marginBottom: 6,
};

const CELL: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--docs-panel-bg)',
};

const CELL_LABEL: React.CSSProperties = {
  ...CELL,
  borderRight: '1px solid var(--docs-border)',
};

const CELL_EXAMPLE: React.CSSProperties = {
  ...CELL,
  borderRight: '1px solid var(--docs-border)',
};

const CELL_NOTE: React.CSSProperties = {
  ...CELL,
  fontSize: 12,
  color: 'var(--docs-text-muted)',
  fontFamily: FONT,
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: 14,
        fontWeight: 600,
        fontFamily: FONT,
        color: 'var(--docs-text)',
        margin: '32px 0 10px',
      }}
    >
      {title}
    </h2>
  );
}

// ─── Column headers ────────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 1fr',
        padding: '0 0 4px',
      }}
    >
      {['Class', 'Example', 'Explanation'].map((h) => (
        <span
          key={h}
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: FONT,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--docs-text-muted)',
            padding: '0 14px',
          }}
        >
          {h}
        </span>
      ))}
    </div>
  );
}

// ─── Token label ──────────────────────────────────────────────────────────────

function TokenLabel({ name }: { name: string }) {
  return (
    <div style={CELL_LABEL}>
      <span
        style={{
          fontSize: 12,
          fontFamily: MONO,
          fontWeight: 500,
          color: '#aa4f00', // text-fg-brand
        }}
      >
        .{name}
      </span>
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function TypographyPalette() {
  const [dark, setDark] = useState(false);

  return (
    <div
      className={dark ? 'dark' : ''}
      style={{
        padding: '36px 40px',
        background: 'var(--docs-page-bg)',
        minHeight: '100vh',
        fontFamily: FONT,
        transition: 'background 0.15s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--docs-text)', margin: '0 0 6px' }}>
            Typography
          </h1>
          <p style={{ fontSize: 13, color: 'var(--docs-text-muted)', margin: 0 }}>
            Semantic tokens from{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
            Font family uses <code style={{ fontFamily: MONO, fontSize: 12 }}>.font-base</code>,
            sizes use <code style={{ fontFamily: MONO, fontSize: 12 }}>.text-{'{size}'}</code>,
            weights use <code style={{ fontFamily: MONO, fontSize: 12 }}>.font-{'{weight}'}</code>,
            and tracking uses <code style={{ fontFamily: MONO, fontSize: 12 }}>.tracking-{'{value}'}</code>.
          </p>
        </div>

        <button
          onClick={() => setDark((d) => !d)}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 8,
            border: '1px solid var(--docs-border)',
            background: 'var(--docs-panel-bg)',
            color: 'var(--docs-text)', fontSize: 12,
            fontFamily: FONT, fontWeight: 500,
            cursor: 'pointer', flexShrink: 0, marginTop: 4,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* ── Font Family ────────────────────────────────────────── */}
      <SectionHeader title="Font Family" />
      <TableHeader />
      {FONT_FAMILIES.map((token) => (
        <div key={token.name} style={ROW}>
          <TokenLabel name={token.name} />
          <div style={CELL_EXAMPLE}>
            <span
              className={token.name}
              style={{ fontSize: 14, color: 'var(--docs-text)' }}
            >
              Poppins
            </span>
          </div>
          <div style={CELL_NOTE}>
            We use Poppins as our base font family
          </div>
        </div>
      ))}

      {/* ── Font Weight ────────────────────────────────────────── */}
      <SectionHeader title="Font weight" />
      <TableHeader />
      {FONT_WEIGHTS.map((token) => (
        <div key={token.name} style={ROW}>
          <TokenLabel name={token.cssClass} />
          <div style={CELL_EXAMPLE}>
            <span
              className={`font-base ${token.cssClass}`}
              style={{ fontSize: 14, color: 'var(--docs-text)' }}
            >
              Paapeli UI
            </span>
          </div>
          <div style={CELL_NOTE}>
            {token.usage}
          </div>
        </div>
      ))}

      {/* ── Letter Spacing ─────────────────────────────────────── */}
      <SectionHeader title="Letter spacing" />
      <TableHeader />
      {LETTER_SPACINGS.map((token) => (
        <div key={token.name} style={ROW}>
          <TokenLabel name={token.name} />
          <div style={CELL_EXAMPLE}>
            <span
              className={`font-base ${token.name}`}
              style={{ fontSize: 14, color: 'var(--docs-text)' }}
            >
              Paapeli UI
            </span>
          </div>
          <div style={CELL_NOTE}>
            {token.usage}
          </div>
        </div>
      ))}

      {/* ── Font Size ──────────────────────────────────────────── */}
      <SectionHeader title="Font size" />
      <TableHeader />
      {FONT_SIZES.map((token) => (
        <div key={token.name} style={{ ...ROW, alignItems: 'stretch' }}>
          <TokenLabel name={token.name} />
          <div
            style={{
              ...CELL_EXAMPLE,
              display: 'flex',
              alignItems: 'center',
              minHeight: token.px > 30 ? token.px + 24 : 44,
            }}
          >
            <span
              className={`font-base ${token.name}`}
              style={{ color: 'var(--docs-text)', lineHeight: 1.2 }}
            >
              Paapeli UI
            </span>
          </div>
          <div
            style={{
              ...CELL_NOTE,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
              {token.px}px
            </span>
            {token.usage && (
              <span style={{ fontSize: 12 }}>{token.usage}</span>
            )}
          </div>
        </div>
      ))}

      {/* ── Usage Examples ──────────────────────────────────────── */}
      <h2 style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT, color: 'var(--docs-text)', margin: '40px 0 16px' }}>
        Usage Examples
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <ExampleCard title="Hero heading" description="Large H1 for hero sections. Use text-6xl + font-extrabold + tracking-tighter." classes={['text-6xl', 'font-extrabold', 'tracking-tighter']}>
          <span className="font-base text-6xl font-extrabold tracking-tighter" style={{ color: 'var(--docs-text)', lineHeight: 1.1 }}>
            Hello, World.
          </span>
        </ExampleCard>

        <ExampleCard title="Section heading" description="H2 / block titles. Use text-3xl + font-semibold + tracking-tight." classes={['text-3xl', 'font-semibold', 'tracking-tight']}>
          <span className="font-base text-3xl font-semibold tracking-tight" style={{ color: 'var(--docs-text)' }}>
            Our features
          </span>
        </ExampleCard>

        <ExampleCard title="Card heading" description="H3 / card titles. Use text-xl + font-medium." classes={['text-xl', 'font-medium']}>
          <div style={{ width: '100%' }}>
            <div className="font-base text-xl font-medium" style={{ color: 'var(--docs-text)', marginBottom: 6 }}>Analytics dashboard</div>
            <div className="font-base text-sm font-normal" style={{ color: 'var(--docs-text-muted)' }}>Track your key metrics in real time.</div>
          </div>
        </ExampleCard>

        <ExampleCard title="Body paragraph" description="Default reading text. Use text-base + font-normal." classes={['text-base', 'font-normal']}>
          <p className="font-base text-base font-normal" style={{ color: 'var(--docs-text)', margin: 0, lineHeight: 1.65 }}>
            Paapeli helps teams move faster with a consistent, accessible design system built for scale.
          </p>
        </ExampleCard>

        <ExampleCard title="Button label" description="Interactive labels. Use text-sm + font-medium." classes={['text-sm', 'font-medium']}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: BRAND, padding: '8px 20px', borderRadius: 8 }}>
              <span className="font-base text-sm font-medium" style={{ color: '#fff' }}>Get started</span>
            </div>
            <div style={{ border: `1px solid ${BRAND}`, padding: '8px 20px', borderRadius: 8 }}>
              <span className="font-base text-sm font-medium" style={{ color: BRAND }}>Learn more</span>
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Caption / helper text" description="Supporting detail under inputs or images. Use text-xs + font-normal." classes={['text-xs', 'font-normal']}>
          <div style={{ width: '100%' }}>
            <div style={{ height: 36, borderRadius: 6, border: '1px solid var(--docs-border)', display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)', marginBottom: 4 }}>
              your@email.com
            </div>
            <span className="font-base text-xs font-normal" style={{ color: 'var(--docs-text-muted)' }}>
              We'll only use this to send you product updates.
            </span>
          </div>
        </ExampleCard>

        <ExampleCard title="Price display" description="Large price figures. Use text-5xl + font-bold + tracking-tighter." classes={['text-5xl', 'font-bold', 'tracking-tighter']}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="font-base text-sm font-medium" style={{ color: 'var(--docs-text-muted)' }}>€</span>
            <span className="font-base text-5xl font-bold tracking-tighter" style={{ color: 'var(--docs-text)', lineHeight: 1 }}>29</span>
            <span className="font-base text-sm font-medium" style={{ color: 'var(--docs-text-muted)' }}>/mo</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Badge label" description="Compact status chips. Use text-xxs + font-semibold." classes={['text-xxs', 'font-semibold']}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {[['New', '#1447e6', '#eff6ff'], ['Pro', BRAND, BRAND_BG], ['Beta', '#009966', '#ecfdf5']].map(([label, color, bg]) => (
              <span key={label} className="font-base text-xxs font-semibold" style={{ color, background: bg, padding: '3px 8px', borderRadius: 20 }}>
                {label}
              </span>
            ))}
          </div>
        </ExampleCard>

      </div>
    </div>
  );
}

// ─── Story export ─────────────────────────────────────────────────────────────

const meta: Meta<typeof TypographyPalette> = {
  title: 'Foundations/Typography',
  component: TypographyPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TypographyPalette>;

export const Default: Story = {};
