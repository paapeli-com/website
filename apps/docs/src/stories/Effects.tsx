import React from 'react';

// ─── Token data ───────────────────────────────────────────────────────────────
// Source: packages/ui-kit/src/styles/settings/_effects.scss

const BORDER_RADII = [
  { cls: 'rounded-xxs',  px: 2    },
  { cls: 'rounded-xs',   px: 4    },
  { cls: 'rounded-sm',   px: 6    },
  { cls: 'rounded',      px: 8    },
  { cls: 'rounded-base', px: 12   },
  { cls: 'rounded-lg',   px: 16   },
  { cls: 'rounded-xl',   px: 24   },
  { cls: 'rounded-full', px: 9999 },
];

const BORDER_WIDTHS = [
  { cls: 'border',    px: 1 },
  { cls: 'border-md', px: 2 },
  { cls: 'border-lg', px: 4 },
  { cls: 'border-xl', px: 8 },
];

const BORDER_STYLES = [
  { cls: 'border-solid',  label: 'solid'  },
  { cls: 'border-dashed', label: 'dashed' },
];

type ShadowToken = {
  cls: string;
  shadow: string;   // raw CSS for the story preview (inline fallback)
};

const SHADOWS: ShadowToken[] = [
  { cls: 'shadow-xs',    shadow: '0 1px 0.5px 0.05px rgba(29,41,61,0.02)' },
  { cls: 'shadow-sm',    shadow: '0 1px 2px 0 rgba(29,41,61,0.05)' },
  { cls: 'shadow',       shadow: '0 1px 3px 0 rgba(29,41,61,0.1), 0 1px 2px -1px rgba(29,41,61,0.1)' },
  { cls: 'shadow-md',    shadow: '0 4px 6px -1px rgba(29,41,61,0.1), 0 2px 4px -2px rgba(29,41,61,0.1)' },
  { cls: 'shadow-lg',    shadow: '0 10px 15px -3px rgba(29,41,61,0.1), 0 4px 6px -4px rgba(29,41,61,0.1)' },
  { cls: 'shadow-xl',    shadow: '0 20px 25px -5px rgba(29,41,61,0.1), 0 8px 10px -6px rgba(29,41,61,0.1)' },
  { cls: 'shadow-2xl',   shadow: '0 25px 50px -12px rgba(29,41,61,0.25)' },
  { cls: 'shadow-inner', shadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.05)' },
  { cls: 'shadow-top',   shadow: '0 -1px 14px 0 rgba(19,28,52,0.1)' },
];

// ─── Shared ───────────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';
const BRAND     = '#803c00';
const BRAND_MID = '#aa4f00';
const BRAND_BG  = '#fff3eb';

function ExampleCard({ title, description, classes, children }: {
  title: string;
  description: string;
  classes: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--docs-border)', overflow: 'hidden' }}>
      <div style={{ padding: '24px 20px', background: 'var(--docs-panel-bg)', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function EffectsPalette() {
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
        Border Radius &amp; Shadow
      </h1>
      <p style={{ fontSize: 13, color: 'var(--docs-text-muted)', margin: 0 }}>
        Utility classes from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
      </p>

      {/* ── Border Radius ──────────────────────────────────────── */}
      <SectionHeader
        title="Border Radius"
        note=".rounded-base (12px) is the default radius applied across most components."
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {BORDER_RADII.map(({ cls, px }) => (
          <div key={cls} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              className={cls}
              style={{
                width: 80,
                height: 80,
                background: BRAND,
                flexShrink: 0,
              }}
            />
            <TokenLabel cls={cls} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)' }}>
              {px >= 9999 ? '9999px' : `${px}px`}
            </span>
          </div>
        ))}
      </div>

      {/* ── Border Width ───────────────────────────────────────── */}
      <SectionHeader title="Border Width" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {BORDER_WIDTHS.map(({ cls, px }) => (
          <div key={cls} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              className={`${cls} rounded-base border-solid`}
              style={{
                width: 80,
                height: 80,
                borderColor: BRAND_MID,
                background: 'var(--docs-panel-bg)',
                flexShrink: 0,
              }}
            />
            <TokenLabel cls={cls} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)' }}>
              {px}px
            </span>
          </div>
        ))}
      </div>

      {/* ── Border Style ───────────────────────────────────────── */}
      <SectionHeader title="Border Style" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {BORDER_STYLES.map(({ cls, label }) => (
          <div key={cls} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              className={`border ${cls} rounded-base`}
              style={{
                width: 80,
                height: 80,
                borderColor: BRAND_MID,
                background: 'var(--docs-panel-bg)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 11, fontFamily: FONT, color: 'var(--docs-text-muted)' }}>
                {label}
              </span>
            </div>
            <TokenLabel cls={cls} />
          </div>
        ))}
      </div>

      {/* ── Box Shadow ─────────────────────────────────────────── */}
      <SectionHeader title="Box Shadow" />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          padding: '16px',
          background: '#f9fafb', // light bg so all shadow depths are visible
          borderRadius: 12,
          border: '1px solid var(--docs-border)',
        }}
      >
        {SHADOWS.map(({ cls }) => (
          <div key={cls} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div
              className={cls}
              style={{
                width: 80,
                height: 80,
                background: '#ffffff',
                borderRadius: 12,
                flexShrink: 0,
              }}
            />
            <TokenLabel cls={cls} />
          </div>
        ))}
      </div>
      {/* ── Usage Examples ──────────────────────────────────────── */}
      <SectionHeader title="Usage Examples" note="Common component patterns combining radius, border and shadow tokens." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <ExampleCard title="Content card" description="The standard card pattern: rounded-base + shadow." classes={['rounded-base', 'shadow']}>
          <div className="rounded-base shadow" style={{ background: 'var(--docs-page-bg)', padding: '16px 20px', width: 200 }}>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--docs-text)', marginBottom: 4 }}>Card title</div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)' }}>Supporting description text.</div>
          </div>
        </ExampleCard>

        <ExampleCard title="Pill button" description="Fully rounded pill button using rounded-full." classes={['rounded-full']}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="rounded-full" style={{ background: BRAND, padding: '9px 22px', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#fff' }}>
              Get started
            </div>
            <div className="rounded-full border border-solid" style={{ borderColor: BRAND, padding: '9px 22px', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: BRAND }}>
              Learn more
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Form input" description="rounded-sm + border + border-solid for text inputs." classes={['rounded-sm', 'border', 'border-solid']}>
          <div className="border border-solid rounded-sm" style={{ borderColor: '#d1d5dc', width: 220, height: 38, display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)' }}>
            Enter your email
          </div>
        </ExampleCard>

        <ExampleCard title="Modal dialog" description="rounded-xl + shadow-2xl for overlaid dialogs." classes={['rounded-xl', 'shadow-2xl']}>
          <div className="rounded-xl shadow-2xl" style={{ background: 'var(--docs-page-bg)', padding: '20px 24px', width: 220 }}>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: 'var(--docs-text)', marginBottom: 6 }}>Confirm action</div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginBottom: 14 }}>This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="rounded-base" style={{ flex: 1, background: BRAND, padding: '6px 0', textAlign: 'center' as const, fontFamily: FONT, fontSize: 12, fontWeight: 600, color: '#fff' }}>Confirm</div>
              <div className="rounded-base border border-solid" style={{ flex: 1, borderColor: '#d1d5dc', padding: '6px 0', textAlign: 'center' as const, fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>Cancel</div>
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Dashed dropzone" description="rounded-lg + border-md + border-dashed for file drop areas." classes={['rounded-lg', 'border-md', 'border-dashed']}>
          <div className="rounded-lg border-md border-dashed" style={{ borderColor: BRAND_MID, width: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke={BRAND_MID} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="18" height="18" rx="4" stroke={BRAND_MID} strokeWidth="1.5"/></svg>
            <span style={{ fontFamily: FONT, fontSize: 12, color: BRAND_MID }}>Drop files here</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Avatar" description="rounded-full + shadow-sm for circular user avatars." classes={['rounded-full', 'shadow-sm']}>
          <div style={{ display: 'flex', gap: 12 }}>
            {['AB', 'CD', 'EF'].map((initials, i) => (
              <div key={initials} className="rounded-full shadow-sm" style={{ width: 44, height: 44, background: [BRAND, '#1447e6', '#007a55'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
            ))}
          </div>
        </ExampleCard>

        <ExampleCard title="Notification toast" description="rounded-base + shadow-lg for floating toast notifications." classes={['rounded-base', 'shadow-lg']}>
          <div className="rounded-base shadow-lg" style={{ background: 'var(--docs-page-bg)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 240 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#007a55"/><path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--docs-text)' }}>Upload complete</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: 'var(--docs-text-muted)' }}>report.pdf was saved.</div>
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Sticky header shadow" description="shadow-top on a bottom sheet or sticky footer floating above content." classes={['shadow-top']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
            <div style={{ background: 'var(--docs-panel-bg)', padding: '12px 16px', fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)', borderRadius: '8px 8px 0 0', border: '1px solid var(--docs-border)', borderBottom: 'none' }}>
              Page content
            </div>
            <div className="shadow-top" style={{ background: 'var(--docs-page-bg)', padding: '12px 16px', borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <div className="rounded-base" style={{ background: BRAND, padding: '7px 18px', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#fff' }}>Save</div>
            </div>
          </div>
        </ExampleCard>

      </div>
    </div>
  );
}

// ─── Story export ─────────────────────────────────────────────────────────────

