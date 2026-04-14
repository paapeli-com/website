import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModeValue = { palette: string; hex: string };

type ColorToken = {
  /** CSS class suffix — applied as .text-{name} on the sample */
  name: string;
  light: ModeValue;
  dark: ModeValue;
};

type ColorGroup = { label: string; tokens: ColorToken[] };

// ─── Color data ───────────────────────────────────────────────────────────────
// Source: packages/ui-kit/src/styles/settings/_colors.scss
// $semantic-text-light / $semantic-text-dark, values resolved via map.get($palette, …)

const COLOR_GROUPS: ColorGroup[] = [
  {
    label: 'Neutral',
    tokens: [
      { name: 'white',             light: { palette: 'white',    hex: '#ffffff' }, dark: { palette: 'white',    hex: '#ffffff' } },
      { name: 'primary-soft',      light: { palette: 'gray-900', hex: '#101828' }, dark: { palette: 'gray-50',  hex: '#f9fafb' } },
      { name: 'primary',           light: { palette: 'gray-900', hex: '#101828' }, dark: { palette: 'gray-50',  hex: '#f9fafb' } },
      { name: 'primary-medium',    light: { palette: 'gray-800', hex: '#1e2939' }, dark: { palette: 'gray-100', hex: '#f3f4f6' } },
      { name: 'primary-strong',    light: { palette: 'gray-700', hex: '#364153' }, dark: { palette: 'gray-200', hex: '#e5e7eb' } },
      { name: 'secondary-soft',    light: { palette: 'gray-700', hex: '#364153' }, dark: { palette: 'gray-200', hex: '#e5e7eb' } },
      { name: 'secondary',         light: { palette: 'gray-600', hex: '#4a5565' }, dark: { palette: 'gray-300', hex: '#d1d5dc' } },
      { name: 'secondary-medium',  light: { palette: 'gray-500', hex: '#6a7282' }, dark: { palette: 'gray-400', hex: '#99a1af' } },
      { name: 'secondary-strong',  light: { palette: 'gray-400', hex: '#99a1af' }, dark: { palette: 'gray-500', hex: '#6a7282' } },
      { name: 'tertiary-soft',     light: { palette: 'gray-500', hex: '#6a7282' }, dark: { palette: 'gray-400', hex: '#99a1af' } },
      { name: 'tertiary',          light: { palette: 'gray-500', hex: '#6a7282' }, dark: { palette: 'gray-400', hex: '#99a1af' } },
      { name: 'tertiary-medium',   light: { palette: 'gray-400', hex: '#99a1af' }, dark: { palette: 'gray-500', hex: '#6a7282' } },
      { name: 'quaternary',        light: { palette: 'gray-400', hex: '#99a1af' }, dark: { palette: 'gray-500', hex: '#6a7282' } },
      { name: 'quaternary-medium', light: { palette: 'gray-300', hex: '#d1d5dc' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
      { name: 'gray',              light: { palette: 'gray-500', hex: '#6a7282' }, dark: { palette: 'gray-400', hex: '#99a1af' } },
      { name: 'disabled',          light: { palette: 'gray-400', hex: '#99a1af' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
    ],
  },
  {
    label: 'Brand',
    tokens: [
      { name: 'brand-softer', light: { palette: 'brand-300', hex: '#ffae68' }, dark: { palette: 'brand-200', hex: '#ffcda1' } },
      { name: 'brand-soft',   light: { palette: 'brand-400', hex: '#ff8e2a' }, dark: { palette: 'brand-300', hex: '#ffae68' } },
      { name: 'brand-medium', light: { palette: 'brand-500', hex: '#ff7900' }, dark: { palette: 'brand-400', hex: '#ff8e2a' } },
      { name: 'brand',        light: { palette: 'brand-700', hex: '#aa4f00' }, dark: { palette: 'brand-500', hex: '#ff7900' } },
      { name: 'brand-strong', light: { palette: 'brand-800', hex: '#803c00' }, dark: { palette: 'brand-400', hex: '#ff8e2a' } },
    ],
  },
  {
    label: 'Success',
    tokens: [
      { name: 'success-soft',   light: { palette: 'emerald-600', hex: '#009966' }, dark: { palette: 'emerald-400', hex: '#00d492' } },
      { name: 'success-medium', light: { palette: 'emerald-700', hex: '#007a55' }, dark: { palette: 'emerald-500', hex: '#00bc7d' } },
      { name: 'success',        light: { palette: 'emerald-700', hex: '#007a55' }, dark: { palette: 'emerald-500', hex: '#00bc7d' } },
      { name: 'success-strong', light: { palette: 'emerald-800', hex: '#006045' }, dark: { palette: 'emerald-400', hex: '#00d492' } },
    ],
  },
  {
    label: 'Info',
    tokens: [
      { name: 'info-soft',   light: { palette: 'blue-600', hex: '#155dfc' }, dark: { palette: 'blue-400', hex: '#51a2ff' } },
      { name: 'info-medium', light: { palette: 'blue-700', hex: '#1447e6' }, dark: { palette: 'blue-500', hex: '#2b7fff' } },
      { name: 'info',        light: { palette: 'blue-700', hex: '#1447e6' }, dark: { palette: 'blue-500', hex: '#2b7fff' } },
      { name: 'info-strong', light: { palette: 'blue-800', hex: '#193cb8' }, dark: { palette: 'blue-400', hex: '#51a2ff' } },
    ],
  },
  {
    label: 'Danger',
    tokens: [
      { name: 'danger-soft',   light: { palette: 'rose-500', hex: '#ff2056' }, dark: { palette: 'rose-400', hex: '#ff637e' } },
      { name: 'danger-medium', light: { palette: 'rose-600', hex: '#ec003f' }, dark: { palette: 'rose-500', hex: '#ff2056' } },
      { name: 'danger',        light: { palette: 'rose-700', hex: '#c70036' }, dark: { palette: 'rose-500', hex: '#ff2056' } },
      { name: 'danger-strong', light: { palette: 'rose-800', hex: '#a50036' }, dark: { palette: 'rose-400', hex: '#ff637e' } },
    ],
  },
  {
    label: 'Warning',
    tokens: [
      { name: 'warning-soft',   light: { palette: 'orange-500', hex: '#ff5a1f' }, dark: { palette: 'orange-300', hex: '#fdba8c' } },
      { name: 'warning-medium', light: { palette: 'orange-600', hex: '#d03801' }, dark: { palette: 'orange-400', hex: '#ff8a4c' } },
      { name: 'warning',        light: { palette: 'orange-600', hex: '#d03801' }, dark: { palette: 'orange-400', hex: '#ff8a4c' } },
      { name: 'warning-strong', light: { palette: 'orange-700', hex: '#b43403' }, dark: { palette: 'orange-300', hex: '#fdba8c' } },
    ],
  },
  {
    label: 'Dark',
    tokens: [
      { name: 'dark',        light: { palette: 'gray-800', hex: '#1e2939' }, dark: { palette: 'gray-300', hex: '#d1d5dc' } },
      { name: 'dark-strong', light: { palette: 'gray-900', hex: '#101828' }, dark: { palette: 'gray-200', hex: '#e5e7eb' } },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      { name: 'purple',  light: { palette: 'purple-600',  hex: '#9810fa' }, dark: { palette: 'purple-400',  hex: '#c27aff' } },
      { name: 'sky',     light: { palette: 'sky-600',     hex: '#0084d1' }, dark: { palette: 'sky-400',     hex: '#00bcff' } },
      { name: 'teal',    light: { palette: 'teal-600',    hex: '#009689' }, dark: { palette: 'teal-400',    hex: '#00d5be' } },
      { name: 'pink',    light: { palette: 'pink-600',    hex: '#e60076' }, dark: { palette: 'pink-400',    hex: '#fb64b6' } },
      { name: 'cyan',    light: { palette: 'cyan-600',    hex: '#0092b8' }, dark: { palette: 'cyan-400',    hex: '#00d3f2' } },
      { name: 'fuchsia', light: { palette: 'fuchsia-600', hex: '#c800de' }, dark: { palette: 'fuchsia-400', hex: '#ed6aff' } },
      { name: 'indigo',  light: { palette: 'indigo-600',  hex: '#4f39f6' }, dark: { palette: 'indigo-400',  hex: '#7c86ff' } },
      { name: 'orange',  light: { palette: 'orange-500',  hex: '#ff5a1f' }, dark: { palette: 'orange-400',  hex: '#ff8a4c' } },
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
       * The CSS class (.text-{name}) is compiled from the SCSS design system.
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
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.08)',
            flexShrink: 0,
            background: 'currentColor',
          }}
          className={`text-${token.name}`}
        />
        <span
          className={`text-${token.name}`}
          style={{ fontSize: 26, fontWeight: 700, fontFamily: FONT, lineHeight: 1 }}
          aria-label={token.name}
        >
          Aa
        </span>
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
          title={`.text-${token.name}`}
        >
          .text-{token.name}
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

function TextColorPalette() {
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
            Text Colors
          </h1>
          <p style={{ fontSize: 13, color: 'var(--docs-text-muted)', margin: 0 }}>
            Semantic tokens from{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
            Apply as{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>.text-{'<token>'}</code>.
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
      <SectionHeader title="Usage Examples" note="Common patterns using text color tokens." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <ExampleCard title="Article hierarchy" description="text-primary for headings, text-secondary for body copy." classes={['text-primary', 'text-secondary']}>
          <div style={{ width: '100%' }}>
            <div className="text-primary" style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Article heading</div>
            <div className="text-secondary" style={{ fontFamily: FONT, fontSize: 13, lineHeight: 1.6 }}>Body copy sits a step below headings using text-secondary for a natural visual hierarchy.</div>
          </div>
        </ExampleCard>

        <ExampleCard title="Brand emphasis" description="text-brand for CTAs, links and highlighted actions." classes={['text-brand']}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            <span className="text-brand" style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Get started for free →</span>
            <span className="text-brand" style={{ fontFamily: FONT, fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}>Learn more about our plans</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Success confirmation" description="text-success for positive feedback and confirmations." classes={['text-success']}>
          <div className="text-success" style={{ fontFamily: FONT, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Payment confirmed. Your order is on its way.
          </div>
        </ExampleCard>

        <ExampleCard title="Error message" description="text-danger for validation errors and destructive feedback." classes={['text-danger']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <div style={{ height: 36, borderRadius: 6, border: '1px solid #c70036', display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)' }}>
              user@bad
            </div>
            <span className="text-danger" style={{ fontFamily: FONT, fontSize: 12 }}>Please enter a valid email address.</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Muted metadata" description="text-tertiary for timestamps, captions and supporting detail." classes={['text-tertiary']}>
          <div style={{ width: '100%' }}>
            <div className="text-primary" style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Invoice #1042</div>
            <div className="text-tertiary" style={{ fontFamily: FONT, fontSize: 12 }}>Issued 14 Feb 2026 · Due 28 Feb 2026</div>
          </div>
        </ExampleCard>

        <ExampleCard title="Disabled label" description="text-disabled for labels and hints on disabled controls." classes={['text-disabled']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
            <span className="text-disabled" style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500 }}>Company name</span>
            <div style={{ height: 36, borderRadius: 6, border: '1px solid var(--docs-border)', background: 'var(--docs-panel-bg)', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
              <span className="text-disabled" style={{ fontFamily: FONT, fontSize: 13 }}>Paapeli Inc.</span>
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Warning hint" description="text-warning for non-critical caution messages." classes={['text-warning']}>
          <div className="text-warning" style={{ fontFamily: FONT, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 10H2.5l5.5-10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Storage is 85% full. Consider upgrading your plan.
          </div>
        </ExampleCard>

        <ExampleCard title="Accent label" description="Accent tokens like text-purple for tags and category labels." classes={['text-purple', 'text-sky', 'text-teal']}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {(['text-purple', 'text-sky', 'text-teal', 'text-pink'] as const).map((cls) => (
              <span key={cls} className={cls} style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: '1px solid currentColor' }}>
                {cls.replace('text-', '')}
              </span>
            ))}
          </div>
        </ExampleCard>

      </div>
    </div>
  );
}

// ─── Story export ─────────────────────────────────────────────────────────────

const meta: Meta<typeof TextColorPalette> = {
  title: 'Foundations/Text Colors',
  component: TextColorPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TextColorPalette>;

export const Default: Story = {};
