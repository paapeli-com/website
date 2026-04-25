import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FontSizeToken    = { name: string; px: number; usage?: string };
type FontWeightToken  = { name: string; value: number; cssClass: string; usage: string };
type TrackingToken    = { name: string; value: string; usage: string };
type LineHeightToken  = { name: string; value: string };
type FontFamilyToken  = { name: string; stack: string };
type TypographyStyle  = {
  style: string;
  weight: string;
  size: string;
  lineHeight: string;
  tracking: string;
  sizePx: number;
};

// ─── Token data ───────────────────────────────────────────────────────────────
// Source: packages/ui-kit/src/styles/settings/_font.scss

const FONT_FAMILIES: FontFamilyToken[] = [
  { name: 'font-base', stack: 'Poppins, sans-serif' },
];

const FONT_WEIGHTS: FontWeightToken[] = [
  { name: 'thin',       value: 100, cssClass: 'font-thin',       usage: 'Decorative, large display text only' },
  { name: 'extralight', value: 200, cssClass: 'font-extralight',  usage: 'Large display headings, subtle text' },
  { name: 'light',      value: 300, cssClass: 'font-light',       usage: 'Introductory text, captions' },
  { name: 'regular',    value: 400, cssClass: 'font-regular',     usage: 'Paragraphs, helper texts and articles' },
  { name: 'medium',     value: 500, cssClass: 'font-medium',      usage: 'Button texts, labels, CTA texts and some headings' },
  { name: 'semibold',   value: 600, cssClass: 'font-semibold',    usage: 'Main headings' },
  { name: 'bold',       value: 700, cssClass: 'font-bold',        usage: 'H1 headings in hero sections' },
  { name: 'extrabold',  value: 800, cssClass: 'font-extrabold',   usage: 'H1 headings in hero sections' },
  { name: 'black',      value: 900, cssClass: 'font-black',       usage: 'Maximum impact display, hero numerics' },
];

const LETTER_SPACINGS: TrackingToken[] = [
  { name: 'tracking-tighter', value: '−0.8px', usage: 'Big H1 headings — improves visual appearance and readability' },
  { name: 'tracking-tight',   value: '−0.4px', usage: 'Section and card headings — improves visual appearance and readability' },
  { name: 'tracking-normal',  value: '0px',    usage: 'Default — no additional tracking applied' },
  { name: 'tracking-wide',    value: '+0.4px', usage: 'Labels, badges, uppercase utility text' },
  { name: 'tracking-wider',   value: '+0.8px', usage: 'All-caps section markers' },
  { name: 'tracking-widest',  value: '+1.6px', usage: 'Overlines, small caps decorative text' },
];

const LINE_HEIGHTS: LineHeightToken[] = [
  { name: 'leading-none', value: 'auto' },
  { name: 'leading-1',    value: '4px'  },
  { name: 'leading-2',    value: '8px'  },
  { name: 'leading-3',    value: '12px' },
  { name: 'leading-4',    value: '16px' },
  { name: 'leading-5',    value: '20px' },
  { name: 'leading-6',    value: '24px' },
  { name: 'leading-7',    value: '28px' },
  { name: 'leading-8',    value: '32px' },
  { name: 'leading-9',    value: '36px' },
  { name: 'leading-10',   value: '40px' },
];

const FONT_SIZES: FontSizeToken[] = [
  { name: 'text-xxxs', px: 10,                                                    },
  { name: 'text-xxs',  px: 10,                                                    },
  { name: 'text-xs',   px: 12,                                                    },
  { name: 'text-sm',   px: 14,                                                    },
  { name: 'text-base', px: 16, usage: 'Paragraphs and larger buttons'             },
  { name: 'text-lg',   px: 18,                                                    },
  { name: 'text-xl',   px: 20,                                                    },
  { name: 'text-2xl',  px: 24,                                                    },
  { name: 'text-3xl',  px: 30,                                                    },
  { name: 'text-4xl',  px: 36, usage: 'Block headings'                            },
  { name: 'text-5xl',  px: 48,                                                    },
  { name: 'text-6xl',  px: 56, usage: 'Larger headings like H1 (Hero blocks)'    },
  { name: 'text-7xl',  px: 64,                                                    },
  { name: 'text-8xl',  px: 72,                                                    },
  { name: 'text-9xl',  px: 84,                                                    },
  { name: 'text-10xl', px: 96, usage: 'Maximum-scale display'                    },
];

// ─── Typography-style factory data ───────────────────────────────────────────
// Mirrors $typography-styles in _font.scss — each entry becomes .{style}-{weight}

const STYLE_SIZES: Record<string, { px: number; size: string }> = {
  'caption-small':   { px: 10, size: 'xxxs' },
  'caption':         { px: 10, size: 'xxs'  },
  'caption-big':     { px: 12, size: 'xs'   },
  'body-small':      { px: 14, size: 'sm'   },
  'body':            { px: 16, size: 'base' },
  'body-big':        { px: 18, size: 'lg'   },
  'headline-small':  { px: 20, size: 'xl'   },
  'headline':        { px: 24, size: '2xl'  },
  'headline-big':    { px: 30, size: '3xl'  },
  'title-small':     { px: 36, size: '4xl'  },
  'title':           { px: 48, size: '5xl'  },
  'title-big':       { px: 56, size: '6xl'  },
  'display-small':   { px: 64, size: '7xl'  },
  'display':         { px: 72, size: '8xl'  },
  'display-big':     { px: 84, size: '9xl'  },
  'display-very-big':{ px: 96, size: '10xl' },
};

const WEIGHTS = ['extralight','light','regular','medium','semibold','bold','extrabold','black'] as const;
const WEIGHT_VALUES: Record<string, number> = {
  extralight: 200, light: 300, regular: 400,
  medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900,
};

// ─── Shared constants ─────────────────────────────────────────────────────────

const FONT = '"Poppins", sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND     = '#803c00';
const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';

// ─── Shared components ────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ margin: '40px 0 12px' }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 3px' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 12, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  const gridTemplateColumns = cols.map(() => 'auto').join(' ');
  return (
    <div style={{ display: 'grid', gridTemplateColumns, padding: '0 0 4px', gap: 0 }}>
      {cols.map((h) => (
        <span key={h} style={{
          fontSize: 11, fontWeight: 700, fontFamily: FONT,
          letterSpacing: '0.06em', textTransform: 'uppercase' as const,
          color: 'var(--docs-text-muted)', padding: '0 14px',
        }}>
          {h}
        </span>
      ))}
    </div>
  );
}

const ROW: React.CSSProperties = {
  display: 'grid',
  alignItems: 'center',
  borderRadius: 10,
  border: '1px solid var(--docs-border)',
  overflow: 'hidden',
  marginBottom: 6,
};

const CELL: React.CSSProperties    = { padding: '10px 14px', background: 'var(--docs-panel-bg)' };
const CELL_LABEL: React.CSSProperties = { ...CELL, borderRight: '1px solid var(--docs-border)' };
const CELL_MID: React.CSSProperties   = { ...CELL, borderRight: '1px solid var(--docs-border)' };
const CELL_NOTE: React.CSSProperties  = { ...CELL, fontSize: 12, color: 'var(--docs-text-muted)', fontFamily: FONT };

function TokenLabel({ name }: { name: string }) {
  return (
    <div style={CELL_LABEL}>
      <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 500, color: BRAND_MID }}>.{name}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, color: BRAND_MID,
      background: BRAND_BG, border: `1px solid ${BRAND_MID}`,
      borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' as const,
    }}>
      {children}
    </span>
  );
}

function ExampleCard({ title, description, classes, children }: {
  title: string; description: string; classes: string[]; children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--docs-border)', overflow: 'hidden' }}>
      <div style={{ padding: '24px 20px', background: 'var(--docs-panel-bg)', minHeight: 90, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
      <div style={{ padding: '10px 14px 12px', background: 'var(--docs-page-bg)', borderTop: '1px solid var(--docs-border)' }}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--docs-text)' }}>{title}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginTop: 2 }}>{description}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginTop: 8 }}>
          {classes.map((cls) => <Badge key={cls}>.{cls}</Badge>)}
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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

// ─── Tab navigation ───────────────────────────────────────────────────────────

type Tab = 'tokens' | 'factory' | 'examples';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'tokens',  label: 'Primitive Tokens' },
    { id: 'factory', label: 'Typography Styles' },
    { id: 'examples', label: 'Usage Examples'  },
  ];
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--docs-border)', marginBottom: 4 }}>
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            fontFamily: FONT, fontSize: 13, fontWeight: active === id ? 600 : 400,
            color: active === id ? BRAND_MID : 'var(--docs-text-muted)',
            background: 'transparent', border: 'none',
            borderBottom: active === id ? `2px solid ${BRAND_MID}` : '2px solid transparent',
            padding: '8px 16px', cursor: 'pointer',
            marginBottom: -1, transition: 'color 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Tokens tab ───────────────────────────────────────────────────────────────

function TokensTab() {
  return (
    <>
      {/* Font Family */}
      <SectionHeader title="Font Family" />
      <TableHeader cols={['Class', 'Example', 'Stack']} />
      {FONT_FAMILIES.map((t) => (
        <div key={t.name} style={{ ...ROW, gridTemplateColumns: '180px 1fr 1fr' }}>
          <TokenLabel name={t.name} />
          <div style={CELL_MID}>
            <span style={{ fontSize: 14, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text)' }}>Paapeli UI</span>
          </div>
          <div style={CELL_NOTE}>{t.stack}</div>
        </div>
      ))}

      {/* Font Weight */}
      <SectionHeader title="Font Weight" subtitle="9 steps from thin (100) to black (900)" />
      <TableHeader cols={['Class', 'Value', 'Example', 'Usage']} />
      {FONT_WEIGHTS.map((t) => (
        <div key={t.name} style={{ ...ROW, gridTemplateColumns: '160px 60px 1fr 1fr' }}>
          <TokenLabel name={t.cssClass} />
          <div style={{ ...CELL_MID, fontFamily: MONO, fontSize: 12, color: 'var(--docs-text-muted)' }}>{t.value}</div>
          <div style={CELL_MID}>
            <span style={{ fontSize: 14, fontFamily: 'Poppins, sans-serif', fontWeight: t.value, color: 'var(--docs-text)' }}>
              Paapeli UI
            </span>
          </div>
          <div style={CELL_NOTE}>{t.usage}</div>
        </div>
      ))}

      {/* Letter Spacing */}
      <SectionHeader title="Letter Spacing" subtitle="6 steps from tighter (−0.8px) to widest (+1.6px)" />
      <TableHeader cols={['Class', 'Value', 'Example', 'Usage']} />
      {LETTER_SPACINGS.map((t) => (
        <div key={t.name} style={{ ...ROW, gridTemplateColumns: '190px 80px 1fr 1fr' }}>
          <TokenLabel name={t.name} />
          <div style={{ ...CELL_MID, fontFamily: MONO, fontSize: 12, color: 'var(--docs-text-muted)' }}>{t.value}</div>
          <div style={CELL_MID}>
            <span style={{ fontSize: 14, fontFamily: 'Poppins, sans-serif', letterSpacing: t.value.replace('−', '-'), color: 'var(--docs-text)' }}>
              Paapeli UI
            </span>
          </div>
          <div style={CELL_NOTE}>{t.usage}</div>
        </div>
      ))}

      {/* Line Height */}
      <SectionHeader title="Line Height" subtitle="11 steps from leading-none (auto) to leading-10 (40px)" />
      <TableHeader cols={['Class', 'Value', 'Preview']} />
      {LINE_HEIGHTS.map((t) => (
        <div key={t.name} style={{ ...ROW, gridTemplateColumns: '160px 80px 1fr' }}>
          <TokenLabel name={t.name} />
          <div style={{ ...CELL_MID, fontFamily: MONO, fontSize: 12, color: 'var(--docs-text-muted)' }}>{t.value}</div>
          <div style={CELL_NOTE}>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, lineHeight: t.value, color: 'var(--docs-text)' }}>
              Line one{t.name !== 'leading-none' && t.name !== 'leading-1' ? '\nLine two' : ''}
            </span>
          </div>
        </div>
      ))}

      {/* Font Size */}
      <SectionHeader title="Font Size" subtitle="16 steps from text-xxxs (10px) to text-10xl (96px)" />
      <TableHeader cols={['Class', 'px', 'Example', 'Usage']} />
      {FONT_SIZES.map((t) => (
        <div key={t.name} style={{ ...ROW, gridTemplateColumns: '140px 60px 1fr 1fr', alignItems: 'stretch' }}>
          <TokenLabel name={t.name} />
          <div style={{ ...CELL_MID, fontFamily: MONO, fontSize: 12, color: 'var(--docs-text-muted)', display: 'flex', alignItems: 'center' }}>{t.px}</div>
          <div style={{ ...CELL_MID, display: 'flex', alignItems: 'center', minHeight: t.px > 30 ? t.px + 24 : 44 }}>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: t.px, color: 'var(--docs-text)', lineHeight: 1.2 }}>
              Paapeli
            </span>
          </div>
          <div style={{ ...CELL_NOTE, display: 'flex', alignItems: 'center' }}>{t.usage ?? '—'}</div>
        </div>
      ))}
    </>
  );
}

// ─── Factory tab ──────────────────────────────────────────────────────────────

function FactoryTab() {
  const [activeStyle, setActiveStyle] = useState<string>(Object.keys(STYLE_SIZES)[0]);
  const { px, size } = STYLE_SIZES[activeStyle];

  return (
    <>
      <SectionHeader
        title="Typography Style Classes"
        subtitle="Generated by the $typography-styles factory in _font.scss. Each .{style}-{weight} class bundles font-size, font-weight, line-height and letter-spacing into one utility."
      />

      {/* Style picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 20 }}>
        {Object.keys(STYLE_SIZES).map((s) => (
          <button
            key={s}
            onClick={() => setActiveStyle(s)}
            style={{
              fontFamily: MONO, fontSize: 11,
              color: activeStyle === s ? '#fff' : BRAND_MID,
              background: activeStyle === s ? BRAND_MID : BRAND_BG,
              border: `1px solid ${BRAND_MID}`,
              borderRadius: 6, padding: '4px 10px',
              cursor: 'pointer', transition: 'all 0.1s',
            }}
          >
            .{s}
          </button>
        ))}
      </div>

      {/* Weight variants for chosen style */}
      <div style={{ marginBottom: 8, fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)' }}>
        Showing all weight variants for <strong style={{ color: 'var(--docs-text)' }}>.{activeStyle}</strong> → font-size: <code style={{ fontFamily: MONO }}>{px}px</code> (text-{size})
      </div>

      <TableHeader cols={['Class', 'Weight', 'Size', 'Tracking', 'Leading', 'Preview']} />
      {WEIGHTS.map((w) => (
        <div key={w} style={{ ...ROW, gridTemplateColumns: '220px 100px 90px 130px 120px 1fr' }}>
          <TokenLabel name={`${activeStyle}-${w}`} />
          <div style={{ ...CELL_MID, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
            {w} ({WEIGHT_VALUES[w]})
          </div>
          <div style={{ ...CELL_MID, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
            text-{size}
          </div>
          <div style={{ ...CELL_MID, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
            tracking-normal
          </div>
          <div style={{ ...CELL_MID, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
            leading-none
          </div>
          <div style={{ ...CELL, display: 'flex', alignItems: 'center', minHeight: px > 40 ? px + 16 : 44, overflow: 'hidden' }}>
            <span style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: Math.min(px, 56),   // cap preview at 56px so table stays readable
              fontWeight: WEIGHT_VALUES[w],
              letterSpacing: 0,
              lineHeight: 'auto',
              color: 'var(--docs-text)',
              whiteSpace: 'nowrap' as const,
            }}>
              Paapeli
            </span>
          </div>
        </div>
      ))}

      {/* Quick reference grid — all styles × all weights */}
      <SectionHeader title="Full class matrix" subtitle="Every generated class at a glance" />
      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ borderCollapse: 'collapse' as const, fontFamily: MONO, fontSize: 11, width: '100%', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' as const }}>Style</th>
              <th style={{ ...thStyle }}>px</th>
              {WEIGHTS.map((w) => (
                <th key={w} style={{ ...thStyle }}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(STYLE_SIZES).map(([style, { px: spx }], i) => (
              <tr key={style} style={{ background: i % 2 === 0 ? 'var(--docs-panel-bg)' : 'transparent' }}>
                <td style={{ ...tdStyle, color: BRAND_MID, fontWeight: 600 }}>.{style}</td>
                <td style={{ ...tdStyle, color: 'var(--docs-text-muted)', textAlign: 'center' as const }}>{spx}px</td>
                {WEIGHTS.map((w) => (
                  <td key={w} style={{ ...tdStyle, color: 'var(--docs-text-muted)', textAlign: 'center' as const }}>
                    <span style={{
                      fontSize: 10, color: BRAND_MID, background: BRAND_BG,
                      border: `1px solid ${BRAND_MID}`, borderRadius: 3,
                      padding: '1px 4px', whiteSpace: 'nowrap' as const,
                    }}>
                      .{style}-{w}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px', borderBottom: '1px solid var(--docs-border)',
  fontFamily: FONT, fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  color: 'var(--docs-text-muted)', textAlign: 'center' as const,
};
const tdStyle: React.CSSProperties = {
  padding: '6px 10px', borderBottom: '1px solid var(--docs-border)',
};

// ─── Examples tab ─────────────────────────────────────────────────────────────

function ExamplesTab() {
  return (
    <>
      <SectionHeader title="Usage Examples" subtitle="Recommended combinations from the design system" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <ExampleCard title="Hero heading" description="Maximum-scale display. Uses the display-big factory class with extrabold weight." classes={['display-big-extrabold']}>
          <span style={{ fontSize: 56, fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text)', lineHeight: 1.05, letterSpacing: '-0.8px' }}>
            Hello, World.
          </span>
        </ExampleCard>

        <ExampleCard title="Section heading" description="H2 / block titles. Uses the headline-big factory class with semibold weight." classes={['headline-big-semibold']}>
          <span style={{ fontSize: 30, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text)', letterSpacing: '-0.4px' }}>
            Our features
          </span>
        </ExampleCard>

        <ExampleCard title="Card heading" description="H3 / card titles. Uses the headline-small factory class with medium weight." classes={['headline-small-medium']}>
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: 20, fontWeight: 500, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text)', marginBottom: 6 }}>Analytics dashboard</div>
            <div style={{ fontSize: 14, fontWeight: 400, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text-muted)' }}>Track your key metrics in real time.</div>
          </div>
        </ExampleCard>

        <ExampleCard title="Body paragraph" description="Default reading text. Uses body-regular." classes={['body-regular']}>
          <p style={{ fontSize: 16, fontWeight: 400, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text)', margin: 0, lineHeight: 1.65 }}>
            Paapeli helps teams move faster with a consistent, accessible design system built for scale.
          </p>
        </ExampleCard>

        <ExampleCard title="Button label" description="Interactive labels. Uses body-small-medium." classes={['body-small-medium']}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: BRAND, padding: '8px 20px', borderRadius: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Poppins, sans-serif', color: '#fff' }}>Get started</span>
            </div>
            <div style={{ border: `1px solid ${BRAND}`, padding: '8px 20px', borderRadius: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Poppins, sans-serif', color: BRAND }}>Learn more</span>
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Caption / helper text" description="Supporting detail under inputs or images. Uses caption-regular." classes={['caption-regular']}>
          <div style={{ width: '100%' }}>
            <div style={{ height: 36, borderRadius: 6, border: '1px solid var(--docs-border)', display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)', marginBottom: 4 }}>
              your@email.com
            </div>
            <span style={{ fontSize: 10, fontWeight: 400, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text-muted)' }}>
              We'll only use this to send you product updates.
            </span>
          </div>
        </ExampleCard>

        <ExampleCard title="Price display" description="Large price figures. Combines title-black with tracking-tighter." classes={['title-black', 'tracking-tighter']}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text-muted)' }}>€</span>
            <span style={{ fontSize: 48, fontWeight: 900, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.8px', color: 'var(--docs-text)', lineHeight: 1 }}>29</span>
            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text-muted)' }}>/mo</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Badge label" description="Compact status chips. Uses caption-small-semibold with tracking-wide." classes={['caption-small-semibold', 'tracking-wide']}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {[['New', '#1447e6', '#eff6ff'], ['Pro', BRAND, BRAND_BG], ['Beta', '#009966', '#ecfdf5']].map(([label, color, bg]) => (
              <span key={label} style={{ fontSize: 10, fontWeight: 600, fontFamily: 'Poppins, sans-serif', letterSpacing: '0.4px', color, background: bg, padding: '3px 8px', borderRadius: 20 }}>
                {label}
              </span>
            ))}
          </div>
        </ExampleCard>

        <ExampleCard title="Overline / eyebrow" description="Section label above headings. Uses caption-big-semibold + tracking-widest." classes={['caption-big-semibold', 'tracking-widest']}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'Poppins, sans-serif', letterSpacing: '1.6px', textTransform: 'uppercase' as const, color: BRAND_MID, marginBottom: 6 }}>
              Case Study
            </div>
            <div style={{ fontSize: 30, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text)' }}>
              How Acme scaled 10×
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Thin display" description="Delicate large type for editorial layouts. Uses display-thin." classes={['display-thin']}>
          <span style={{ fontSize: 72, fontWeight: 100, fontFamily: 'Poppins, sans-serif', color: 'var(--docs-text)', lineHeight: 1, letterSpacing: '-0.8px' }}>
            Minimal.
          </span>
        </ExampleCard>

      </div>
    </>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

function TypographyPalette() {
  const [dark, setDark]   = useState(false);
  const [tab, setTab]     = useState<Tab>('tokens');

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
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--docs-text)', margin: '0 0 6px' }}>
            Typography
          </h1>
          <p style={{ fontSize: 13, color: 'var(--docs-text-muted)', margin: 0, maxWidth: 560 }}>
            Semantic tokens from{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code> — primitive tokens
            (size, weight, tracking, leading) plus the <strong>typography-style factory</strong> that
            combines them into single-class utilities like{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>.caption-medium</code> or{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>.display-bold</code>.
          </p>
        </div>

        <button
          onClick={() => setDark((d) => !d)}
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

      {/* Tab navigation */}
      <TabBar active={tab} onChange={setTab} />

      {/* Tab content */}
      {tab === 'tokens'   && <TokensTab />}
      {tab === 'factory'  && <FactoryTab />}
      {tab === 'examples' && <ExamplesTab />}
    </div>
  );
}

// ─── Story export ─────────────────────────────────────────────────────────────

const meta: Meta<typeof TypographyPalette> = {
  title: 'Foundations/Typography',
  component: TypographyPalette,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof TypographyPalette>;

export const Default: Story = {};
