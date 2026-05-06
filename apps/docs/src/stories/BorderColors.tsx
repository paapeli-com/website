import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModeValue = { palette: string; hex: string };

type ColorToken = {
  /** CSS class suffix — applied as .border-{name} on the swatch */
  name: string;
  light: ModeValue;
  dark: ModeValue;
};

type ColorGroup = { label: string; tokens: ColorToken[] };

// ─── Color data ───────────────────────────────────────────────────────────────
// Source: packages/ui-kit/src/styles/settings/_colors.scss
// $semantic-border-light / $semantic-border-dark, values resolved via map.get($palette, …)

const COLOR_GROUPS: ColorGroup[] = [
  {
    label: 'Neutral',
    tokens: [
      { name: 'white',             light: { palette: 'white',    hex: '#ffffff' }, dark: { palette: 'white',    hex: '#ffffff' } },
      { name: 'primary-soft',      light: { palette: 'gray-100', hex: '#f3f4f6' }, dark: { palette: 'gray-800', hex: '#1e2939' } },
      { name: 'primary',           light: { palette: 'gray-200', hex: '#e5e7eb' }, dark: { palette: 'gray-700', hex: '#364153' } },
      { name: 'primary-medium',    light: { palette: 'gray-300', hex: '#d1d5dc' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
      { name: 'primary-strong',    light: { palette: 'gray-400', hex: '#99a1af' }, dark: { palette: 'gray-500', hex: '#6a7282' } },
      { name: 'secondary-soft',    light: { palette: 'gray-200', hex: '#e5e7eb' }, dark: { palette: 'gray-800', hex: '#1e2939' } },
      { name: 'secondary',         light: { palette: 'gray-300', hex: '#d1d5dc' }, dark: { palette: 'gray-700', hex: '#364153' } },
      { name: 'secondary-medium',  light: { palette: 'gray-400', hex: '#99a1af' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
      { name: 'secondary-strong',  light: { palette: 'gray-500', hex: '#6a7282' }, dark: { palette: 'gray-500', hex: '#6a7282' } },
      { name: 'tertiary-soft',     light: { palette: 'gray-300', hex: '#d1d5dc' }, dark: { palette: 'gray-700', hex: '#364153' } },
      { name: 'tertiary',          light: { palette: 'gray-400', hex: '#99a1af' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
      { name: 'tertiary-medium',   light: { palette: 'gray-500', hex: '#6a7282' }, dark: { palette: 'gray-500', hex: '#6a7282' } },
      { name: 'quaternary',        light: { palette: 'gray-500', hex: '#6a7282' }, dark: { palette: 'gray-500', hex: '#6a7282' } },
      { name: 'quaternary-medium', light: { palette: 'gray-600', hex: '#4a5565' }, dark: { palette: 'gray-400', hex: '#99a1af' } },
      { name: 'gray',              light: { palette: 'gray-300', hex: '#d1d5dc' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
      { name: 'disabled',          light: { palette: 'gray-200', hex: '#e5e7eb' }, dark: { palette: 'gray-700', hex: '#364153' } },
    ],
  },
  {
    label: 'Brand',
    tokens: [
      { name: 'brand-softer', light: { palette: 'brand-100', hex: '#ffe7d1' }, dark: { palette: 'brand-900', hex: '#552800' } },
      { name: 'brand-soft',   light: { palette: 'brand-200', hex: '#ffcda1' }, dark: { palette: 'brand-800', hex: '#803c00' } },
      { name: 'brand-medium', light: { palette: 'brand-300', hex: '#ffae68' }, dark: { palette: 'brand-700', hex: '#aa4f00' } },
      { name: 'brand',        light: { palette: 'brand-500', hex: '#ff7900' }, dark: { palette: 'brand-500', hex: '#ff7900' } },
      { name: 'brand-strong', light: { palette: 'brand-700', hex: '#aa4f00' }, dark: { palette: 'brand-400', hex: '#ff8e2a' } },
    ],
  },
  {
    label: 'Success',
    tokens: [
      { name: 'success-soft',   light: { palette: 'emerald-200', hex: '#a4f4cf' }, dark: { palette: 'emerald-900', hex: '#004f3b' } },
      { name: 'success-medium', light: { palette: 'emerald-300', hex: '#5ee9b5' }, dark: { palette: 'emerald-800', hex: '#006045' } },
      { name: 'success',        light: { palette: 'emerald-500', hex: '#00bc7d' }, dark: { palette: 'emerald-600', hex: '#009966' } },
      { name: 'success-strong', light: { palette: 'emerald-700', hex: '#007a55' }, dark: { palette: 'emerald-500', hex: '#00bc7d' } },
    ],
  },
  {
    label: 'Info',
    tokens: [
      { name: 'info-soft',   light: { palette: 'blue-200', hex: '#bedbff' }, dark: { palette: 'blue-900', hex: '#1c398e' } },
      { name: 'info-medium', light: { palette: 'blue-300', hex: '#8ec5ff' }, dark: { palette: 'blue-800', hex: '#193cb8' } },
      { name: 'info',        light: { palette: 'blue-500', hex: '#2b7fff' }, dark: { palette: 'blue-600', hex: '#155dfc' } },
      { name: 'info-strong', light: { palette: 'blue-700', hex: '#1447e6' }, dark: { palette: 'blue-500', hex: '#2b7fff' } },
    ],
  },
  {
    label: 'Danger',
    tokens: [
      { name: 'danger-soft',   light: { palette: 'rose-200', hex: '#ffccd3' }, dark: { palette: 'rose-900', hex: '#8b0836' } },
      { name: 'danger-medium', light: { palette: 'rose-300', hex: '#ffa1ad' }, dark: { palette: 'rose-800', hex: '#a50036' } },
      { name: 'danger',        light: { palette: 'rose-500', hex: '#ff2056' }, dark: { palette: 'rose-600', hex: '#ec003f' } },
      { name: 'danger-strong', light: { palette: 'rose-700', hex: '#c70036' }, dark: { palette: 'rose-500', hex: '#ff2056' } },
    ],
  },
  {
    label: 'Warning',
    tokens: [
      { name: 'warning-soft',   light: { palette: 'orange-200', hex: '#fcd9bd' }, dark: { palette: 'orange-900', hex: '#771d1d' } },
      { name: 'warning-medium', light: { palette: 'orange-300', hex: '#fdba8c' }, dark: { palette: 'orange-800', hex: '#8a2c0d' } },
      { name: 'warning',        light: { palette: 'orange-400', hex: '#ff8a4c' }, dark: { palette: 'orange-600', hex: '#d03801' } },
      { name: 'warning-strong', light: { palette: 'orange-600', hex: '#d03801' }, dark: { palette: 'orange-500', hex: '#ff5a1f' } },
    ],
  },
  {
    label: 'Dark',
    tokens: [
      { name: 'dark',        light: { palette: 'gray-700', hex: '#364153' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
      { name: 'dark-strong', light: { palette: 'gray-900', hex: '#101828' }, dark: { palette: 'gray-500', hex: '#6a7282' } },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      { name: 'purple',  light: { palette: 'purple-400',  hex: '#c27aff' }, dark: { palette: 'purple-600',  hex: '#9810fa' } },
      { name: 'sky',     light: { palette: 'sky-400',     hex: '#00bcff' }, dark: { palette: 'sky-600',     hex: '#0084d1' } },
      { name: 'teal',    light: { palette: 'teal-400',    hex: '#00d5be' }, dark: { palette: 'teal-600',    hex: '#009689' } },
      { name: 'pink',    light: { palette: 'pink-400',    hex: '#fb64b6' }, dark: { palette: 'pink-600',    hex: '#e60076' } },
      { name: 'cyan',    light: { palette: 'cyan-400',    hex: '#00d3f2' }, dark: { palette: 'cyan-600',    hex: '#0092b8' } },
      { name: 'fuchsia', light: { palette: 'fuchsia-400', hex: '#ed6aff' }, dark: { palette: 'fuchsia-600', hex: '#c800de' } },
      { name: 'indigo',  light: { palette: 'indigo-400',  hex: '#7c86ff' }, dark: { palette: 'indigo-600',  hex: '#4f39f6' } },
      { name: 'orange',  light: { palette: 'orange-300',  hex: '#fdba8c' }, dark: { palette: 'orange-600',  hex: '#d03801' } },
    ],
  },
];

// ─── Swatch component ─────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

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

function Swatch({ token }: { token: ColorToken }) {
  return (
    <div
      style={{
        width: 160,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--docs-border)',
        flexShrink: 0,
      }}
    >
      {/*
       * The CSS class (.border-{name}) is compiled from the SCSS design system.
       * Under .dark on <html>, Storybook's theme toggle switches it to the
       * dark semantic value automatically.
       */}
      <div
        style={{
          height: 72,
          background: 'var(--docs-panel-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className={`border-${token.name}`}
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            borderWidth: 2,
            borderStyle: 'solid',
            background: 'transparent',
          }}
          aria-label={token.name}
        />
      </div>

      {/* Metadata panel */}
      <div
        style={{
          padding: '9px 12px 11px',
          background: 'var(--docs-panel-bg)',
          borderTop: '1px solid var(--docs-border)',
        }}
      >
        {/* Token name */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            fontFamily: FONT,
            color: 'var(--docs-text)',
            marginBottom: 5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={`.border-${token.name}`}
        >
          .border-{token.name}
        </div>

        {/* Light row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              fontFamily: FONT,
              letterSpacing: '0.06em',
              color: '#ffffff',
              background: '#6a7282',
              borderRadius: 3,
              padding: '1px 4px',
              lineHeight: '14px',
              flexShrink: 0,
            }}
          >
            L
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: MONO,
              color: 'var(--docs-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={`(${token.light.palette}) ${token.light.hex}`}
          >
            ({token.light.palette}) {token.light.hex}
          </span>
        </div>

        {/* Dark row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              fontFamily: FONT,
              letterSpacing: '0.06em',
              color: '#ffffff',
              background: '#314158',
              borderRadius: 3,
              padding: '1px 4px',
              lineHeight: '14px',
              flexShrink: 0,
            }}
          >
            D
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: MONO,
              color: 'var(--docs-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={`(${token.dark.palette}) ${token.dark.hex}`}
          >
            ({token.dark.palette}) {token.dark.hex}
          </span>
        </div>
      </div>
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

export function BorderColorPalette() {
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--docs-text)',
              margin: '0 0 6px',
            }}
          >
            Border Colors
          </h1>
          <p style={{ fontSize: 13, color: 'var(--docs-text-muted)', margin: 0 }}>
            Semantic tokens from{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
            Apply as{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>.border-{'<token>'}</code>.
            {' '}Dark variants activate under a parent with{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>.dark</code>.
          </p>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark((d) => !d)}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid var(--docs-border)',
            background: 'var(--docs-panel-bg)',
            color: 'var(--docs-text)',
            fontSize: 12,
            fontFamily: FONT,
            fontWeight: 500,
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: 4,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Groups */}
      {COLOR_GROUPS.map((group) => (
        <section key={group.label} style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: FONT,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--docs-text-muted)',
              marginBottom: 14,
            }}
          >
            {group.label}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {group.tokens.map((token) => (
              <Swatch key={token.name} token={token} />
            ))}
          </div>
        </section>
      ))}

      {/* ── Usage Examples ──────────────────────────────────────── */}
      <SectionHeader title="Usage Examples" note="Common patterns using border color tokens." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <ExampleCard title="Default card border" description="border-primary is the standard card and container border." classes={['border-primary', 'border', 'border-solid']}>
          <div className="border border-solid border-primary" style={{ width: '100%', borderRadius: 8, padding: '14px 16px', fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)' }}>
            Card with border-primary
          </div>
        </ExampleCard>

        <ExampleCard title="Input — default" description="border-secondary for resting state of form inputs." classes={['border-secondary', 'border', 'border-solid']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--docs-text)' }}>Email</span>
            <div className="border border-solid border-secondary" style={{ height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)' }}>
              you@example.com
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Input — focused" description="border-brand for the active/focused state of form inputs." classes={['border-brand', 'border', 'border-solid']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--docs-text)' }}>Email</span>
            <div className="border border-solid border-brand" style={{ height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)' }}>
              you@example.com
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Input — validated" description="border-success for fields that have passed validation." classes={['border-success', 'border', 'border-solid']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--docs-text)' }}>Username</span>
            <div className="border border-solid border-success" style={{ height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, justifyContent: 'space-between', fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)' }}>
              <span>paapeli_user</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5 8l2 2 4-4" stroke="#007a55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Input — error" description="border-danger for fields that have failed validation." classes={['border-danger', 'border', 'border-solid']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--docs-text)' }}>Password</span>
            <div className="border border-solid border-danger" style={{ height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)' }}>
              ••••••
            </div>
            <span style={{ fontFamily: FONT, fontSize: 12, color: '#c70036' }}>Must be at least 8 characters.</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Warning border" description="border-warning for inputs or elements requiring attention." classes={['border-warning', 'border', 'border-solid']}>
          <div className="border border-solid border-warning" style={{ width: '100%', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 10H2.5l5.5-10z" stroke="#b43403" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: FONT, fontSize: 13, color: '#b43403' }}>Deprecated API key in use.</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Section divider" description="border-primary as an inset horizontal rule between sections." classes={['border-primary']}>
          <div style={{ width: '100%' }}>
            <div style={{ fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)', marginBottom: 10 }}>Section above</div>
            <div className="border-primary" style={{ height: 1, borderTopWidth: 1, borderTopStyle: 'solid' as const }} />
            <div style={{ fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)', marginTop: 10 }}>Section below</div>
          </div>
        </ExampleCard>

        <ExampleCard title="Brand badge" description="border-brand-medium for outlined brand tags and pills." classes={['border-brand-medium', 'border', 'border-solid']}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {['New', 'Featured', 'Pro plan'].map((label) => (
              <span key={label} className="border border-solid border-brand-medium" style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: BRAND_MID, borderRadius: 20, padding: '3px 12px' }}>
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

