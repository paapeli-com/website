import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModeValue = { palette: string; hex: string };

type ColorToken = {
  /** CSS class suffix — applied as .bg-{name} on the swatch */
  name: string;
  light: ModeValue;
  dark: ModeValue;
};

type ColorGroup = { label: string; tokens: ColorToken[] };

// ─── Color data ───────────────────────────────────────────────────────────────
// Source: packages/ui-kit/src/styles/settings/_colors.scss
// $semantic-bg-light / $semantic-bg-dark, values resolved via map.get($palette, …)

const COLOR_GROUPS: ColorGroup[] = [
  {
    label: 'Neutral',
    tokens: [
      { name: 'white',             light: { palette: 'white',    hex: '#ffffff' }, dark: { palette: 'white',    hex: '#ffffff' } },
      { name: 'primary-soft',      light: { palette: 'white',    hex: '#ffffff' }, dark: { palette: 'gray-900', hex: '#101828' } },
      { name: 'primary',           light: { palette: 'white',    hex: '#ffffff' }, dark: { palette: 'gray-950', hex: '#030712' } },
      { name: 'primary-medium',    light: { palette: 'white',    hex: '#ffffff' }, dark: { palette: 'gray-800', hex: '#1e2939' } },
      { name: 'primary-strong',    light: { palette: 'white',    hex: '#ffffff' }, dark: { palette: 'gray-700', hex: '#333e4f' } },
      { name: 'secondary-soft',    light: { palette: 'gray-50',  hex: '#f9fafb' }, dark: { palette: 'gray-900', hex: '#101828' } },
      { name: 'secondary',         light: { palette: 'gray-50',  hex: '#f9fafb' }, dark: { palette: 'gray-950', hex: '#030712' } },
      { name: 'secondary-medium',  light: { palette: 'gray-50',  hex: '#f9fafb' }, dark: { palette: 'gray-800', hex: '#1e2939' } },
      { name: 'secondary-strong',  light: { palette: 'gray-50',  hex: '#f9fafb' }, dark: { palette: 'gray-700', hex: '#333e4f' } },
      { name: 'tertiary-soft',     light: { palette: 'gray-100', hex: '#f3f4f6' }, dark: { palette: 'gray-900', hex: '#101828' } },
      { name: 'tertiary',          light: { palette: 'gray-100', hex: '#f3f4f6' }, dark: { palette: 'gray-800', hex: '#1e2939' } },
      { name: 'tertiary-medium',   light: { palette: 'gray-100', hex: '#f3f4f6' }, dark: { palette: 'gray-700', hex: '#333e4f' } },
      { name: 'quaternary',        light: { palette: 'gray-200', hex: '#e5e7eb' }, dark: { palette: 'gray-700', hex: '#333e4f' } },
      { name: 'quaternary-medium', light: { palette: 'gray-200', hex: '#e5e7eb' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
      { name: 'gray',              light: { palette: 'gray-300', hex: '#d1d5dc' }, dark: { palette: 'gray-600', hex: '#4a5565' } },
      { name: 'disabled',          light: { palette: 'gray-100', hex: '#f3f4f6' }, dark: { palette: 'gray-800', hex: '#1e2939' } },
    ],
  },
  {
    label: 'Brand',
    tokens: [
      { name: 'brand-softer', light: { palette: 'brand-50',  hex: '#fff6ef' }, dark: { palette: 'brand-950', hex: '#2b1400' } },
      { name: 'brand-soft',   light: { palette: 'brand-100', hex: '#ffe7d1' }, dark: { palette: 'brand-950', hex: '#2b1400' } },
      { name: 'brand-medium', light: { palette: 'brand-200', hex: '#ffcda1' }, dark: { palette: 'brand-900', hex: '#552800' } },
      { name: 'brand',        light: { palette: 'brand-700', hex: '#aa4f00' }, dark: { palette: 'brand-600', hex: '#d56300' } },
      { name: 'brand-strong', light: { palette: 'brand-800', hex: '#803c00' }, dark: { palette: 'brand-700', hex: '#aa4f00' } },
    ],
  },
  {
    label: 'Success',
    tokens: [
      { name: 'success-soft',   light: { palette: 'emerald-50',  hex: '#ecfdf5' }, dark: { palette: 'emerald-950', hex: '#002c22' } },
      { name: 'success-medium', light: { palette: 'emerald-100', hex: '#d0fae5' }, dark: { palette: 'emerald-900', hex: '#004f3b' } },
      { name: 'success',        light: { palette: 'emerald-700', hex: '#007a55' }, dark: { palette: 'emerald-600', hex: '#009966' } },
      { name: 'success-strong', light: { palette: 'emerald-800', hex: '#006045' }, dark: { palette: 'emerald-700', hex: '#007a55' } },
    ],
  },
  {
    label: 'Info',
    tokens: [
      { name: 'info-soft',   light: { palette: 'blue-50',  hex: '#eff6ff' }, dark: { palette: 'blue-950', hex: '#162455' } },
      { name: 'info-medium', light: { palette: 'blue-100', hex: '#dbeafe' }, dark: { palette: 'blue-900', hex: '#1c398e' } },
      { name: 'info',        light: { palette: 'blue-700', hex: '#1447e6' }, dark: { palette: 'blue-600', hex: '#155dfc' } },
      { name: 'info-strong', light: { palette: 'blue-800', hex: '#193cb8' }, dark: { palette: 'blue-700', hex: '#1447e6' } },
    ],
  },
  {
    label: 'Danger',
    tokens: [
      { name: 'danger-soft',   light: { palette: 'rose-50',  hex: '#fff1f2' }, dark: { palette: 'rose-950', hex: '#4d0218' } },
      { name: 'danger-medium', light: { palette: 'rose-100', hex: '#ffe4e6' }, dark: { palette: 'rose-900', hex: '#8b0836' } },
      { name: 'danger',        light: { palette: 'rose-700', hex: '#c70036' }, dark: { palette: 'rose-700', hex: '#c70036' } },
      { name: 'danger-strong', light: { palette: 'rose-800', hex: '#a50036' }, dark: { palette: 'rose-700', hex: '#c70036' } },
    ],
  },
  {
    label: 'Warning',
    tokens: [
      { name: 'warning-soft',   light: { palette: 'orange-50',  hex: '#fff8f1' }, dark: { palette: 'orange-950', hex: '#441306' } },
      { name: 'warning-medium', light: { palette: 'orange-100', hex: '#feecdc' }, dark: { palette: 'orange-900', hex: '#771d1d' } },
      { name: 'warning',        light: { palette: 'orange-500', hex: '#ff5a1f' }, dark: { palette: 'orange-600', hex: '#d03801' } },
      { name: 'warning-strong', light: { palette: 'orange-700', hex: '#b43403' }, dark: { palette: 'orange-700', hex: '#b43403' } },
    ],
  },
  {
    label: 'Dark',
    tokens: [
      { name: 'dark',        light: { palette: 'gray-800', hex: '#1e2939' }, dark: { palette: 'gray-800', hex: '#1e2939' } },
      { name: 'dark-strong', light: { palette: 'gray-900', hex: '#101828' }, dark: { palette: 'gray-800', hex: '#1e2939' } },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      { name: 'purple',  light: { palette: 'purple-500',  hex: '#ad46ff' }, dark: { palette: 'purple-500',  hex: '#ad46ff' } },
      { name: 'sky',     light: { palette: 'sky-500',     hex: '#00a6f4' }, dark: { palette: 'sky-500',     hex: '#00a6f4' } },
      { name: 'teal',    light: { palette: 'teal-600',    hex: '#009689' }, dark: { palette: 'teal-500',    hex: '#00bba7' } },
      { name: 'pink',    light: { palette: 'pink-600',    hex: '#e60076' }, dark: { palette: 'pink-500',    hex: '#f6339a' } },
      { name: 'cyan',    light: { palette: 'cyan-500',    hex: '#00b8db' }, dark: { palette: 'cyan-500',    hex: '#00b8db' } },
      { name: 'fuchsia', light: { palette: 'fuchsia-600', hex: '#c800de' }, dark: { palette: 'fuchsia-500', hex: '#e12afb' } },
      { name: 'indigo',  light: { palette: 'indigo-600',  hex: '#4f39f6' }, dark: { palette: 'indigo-500',  hex: '#615fff' } },
      { name: 'orange',  light: { palette: 'orange-400',  hex: '#ff8a4c' }, dark: { palette: 'orange-400',  hex: '#ff8a4c' } },
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
       * The CSS class (.bg-{name}) is compiled from the SCSS design system.
       * Under .dark on <html>, Storybook's theme toggle switches it to the
       * dark semantic value automatically.
       */}
      <div
        className={`bg-${token.name} swatch-box`}
        style={{ height: 72 }}
        aria-label={token.name}
      />

      {/* Metadata panel */}
      <div
        style={{
          padding: '9px 12px 11px',
          background: 'var(--docs-panel-bg)',
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
          title={`.bg-${token.name}`}
        >
          .bg-{token.name}
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

function BgColorPalette() {
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
            Background Colors
          </h1>
          <p style={{ fontSize: 13, color: 'var(--docs-text-muted)', margin: 0 }}>
            Semantic tokens from{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
            Apply as{' '}
            <code style={{ fontFamily: MONO, fontSize: 12 }}>.bg-{'<token>'}</code>.
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
      <SectionHeader title="Usage Examples" note="Common patterns using background color tokens." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <ExampleCard title="Page canvas" description="bg-primary is the default page/section background." classes={['bg-primary']}>
          <div className="bg-primary" style={{ width: '100%', height: 60, borderRadius: 8, border: '1px solid var(--docs-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)' }}>
            Page canvas
          </div>
        </ExampleCard>

        <ExampleCard title="Card surface" description="bg-secondary raises a card above the primary page bg." classes={['bg-primary', 'bg-secondary']}>
          <div className="bg-primary" style={{ width: '100%', padding: 10, borderRadius: 8 }}>
            <div className="bg-secondary" style={{ padding: '10px 14px', borderRadius: 6, fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
              Card on bg-secondary
            </div>
          </div>
        </ExampleCard>

        <ExampleCard title="Brand callout" description="bg-brand-soft for highlighted brand sections or promotions." classes={['bg-brand-soft']}>
          <div className="bg-brand-soft" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, fontFamily: FONT, fontSize: 13, color: BRAND, fontWeight: 500 }}>
            Sign up today and get 30% off your first order.
          </div>
        </ExampleCard>

        <ExampleCard title="Success banner" description="bg-success-soft for confirmation messages and success states." classes={['bg-success-soft']}>
          <div className="bg-success-soft" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#007a55" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#007a55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: FONT, fontSize: 13, color: '#007a55' }}>Changes saved successfully.</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Danger alert" description="bg-danger-soft for error messages and destructive action warnings." classes={['bg-danger-soft']}>
          <div className="bg-danger-soft" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#c70036" strokeWidth="1.5"/><path d="M8 5v3M8 10v.5" stroke="#c70036" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span style={{ fontFamily: FONT, fontSize: 13, color: '#c70036' }}>Something went wrong. Please try again.</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Warning notice" description="bg-warning-soft for caution messages and non-critical alerts." classes={['bg-warning-soft']}>
          <div className="bg-warning-soft" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 10H2.5l5.5-10z" stroke="#b43403" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6.5v3M8 11v.5" stroke="#b43403" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span style={{ fontFamily: FONT, fontSize: 13, color: '#b43403' }}>Your session expires in 5 minutes.</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Info notice" description="bg-info-soft for tips, hints and informational messages." classes={['bg-info-soft']}>
          <div className="bg-info-soft" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1447e6" strokeWidth="1.5"/><path d="M8 7.5v3M8 5v.5" stroke="#1447e6" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span style={{ fontFamily: FONT, fontSize: 13, color: '#1447e6' }}>You can update your settings at any time.</span>
          </div>
        </ExampleCard>

        <ExampleCard title="Disabled state" description="bg-disabled for inputs and buttons in a disabled state." classes={['bg-disabled']}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            <div className="bg-disabled" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--docs-border)', display: 'flex', alignItems: 'center', paddingLeft: 12, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)' }}>
              Disabled input field
            </div>
            <div className="bg-disabled" style={{ padding: '8px 0', borderRadius: 6, textAlign: 'center' as const, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)' }}>
              Disabled button
            </div>
          </div>
        </ExampleCard>

      </div>
    </div>
  );
}

// ─── Story export ─────────────────────────────────────────────────────────────

const meta: Meta<typeof BgColorPalette> = {
  title: 'Foundations/Background Colors',
  component: BgColorPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof BgColorPalette>;

export const Default: Story = {};
