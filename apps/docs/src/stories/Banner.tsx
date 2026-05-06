import React, { useState } from 'react';
import {
  Banner,
  Button,
  type BannerType,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT  = '"Poppins", "Inter", system-ui, sans-serif';
const MONO  = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Reference data ───────────────────────────────────────────────────────────

const TYPES: BannerType[] = [
  'default',
  'logo-button',
  'newsletter',
  'icon-link',
  'heading-description',
];

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Banner
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Full-width notification bar from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Five layout types — announcement, CTA, newsletter, affiliate link, and rich heading.
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

function CodeChip({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, color: BRAND_MID, background: BRAND_BG,
      border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '1px 5px',
    }}>
      {label}
    </span>
  );
}

// ─── Paapeli logo mark (SVG) ─────────────────────────────────────────────────

function PaapeliLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#ff7900" />
      <path d="M10 22V10h6a5 5 0 0 1 0 10h-3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Fake newsletter form ─────────────────────────────────────────────────────

function NewsletterForm() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 13, color: 'var(--docs-text)', whiteSpace: 'nowrap' }}>
        First name
        <span style={{ color: '#ef4444' }}>*</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: '#6a7282' }}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
          <path d="M8 7.25v3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="8" cy="5.25" r="0.7" fill="currentColor" />
        </svg>
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px',
        background: '#fff', minWidth: 180,
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: '#6a7282', flexShrink: 0 }}>
          <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
          <path d="M2 6l6 4 6-4" stroke="currentColor" strokeWidth="1.25" />
        </svg>
        <span style={{ fontFamily: FONT, fontSize: 13, color: '#99a1af' }}>Enter your email</span>
      </div>
      <Button size="sm" color="brand">Subscribe</Button>
    </div>
  );
}

// ─── Type reference table ─────────────────────────────────────────────────────

function TypeReference() {
  const rows: { type: BannerType; shape: string; description: string }[] = [
    {
      type: 'default',
      shape: '64px · centered',
      description: 'Announcement bar with optional leading icon and inline link.',
    },
    {
      type: 'logo-button',
      shape: '68px · divided',
      description: 'Logo mark + vertical divider + body text + primary CTA button.',
    },
    {
      type: 'newsletter',
      shape: '68px · centered form',
      description: 'Newsletter sign-up with form fields passed as children.',
    },
    {
      type: 'icon-link',
      shape: '64px · centered',
      description: 'Brand-colored dot indicator + text + hyperlink with arrow.',
    },
    {
      type: 'heading-description',
      shape: 'auto · two-col',
      description: 'Rich layout with bold heading, body copy, and action button slot.',
    },
  ];

  return (
    <Panel padding={0}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr' }}>
        {['type', 'shape', 'description'].map((h) => (
          <div key={h} style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700, color: 'var(--docs-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '12px 14px', borderBottom: '1px solid var(--docs-border)',
            background: 'var(--docs-page-bg)',
          }}>
            {h}
          </div>
        ))}
        {rows.map((r, i) => (
          <React.Fragment key={r.type}>
            <div style={{ padding: '10px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--docs-border)', background: 'var(--docs-page-bg)' }}>
              <CodeChip label={r.type} />
            </div>
            <div style={{ padding: '10px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--docs-border)', fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)', whiteSpace: 'nowrap' }}>
              {r.shape}
            </div>
            <div style={{ padding: '10px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--docs-border)', fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
              {r.description}
            </div>
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

// ─── Per-type showcase panels ─────────────────────────────────────────────────

function DefaultShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Banner type="default" onClose={() => undefined}>
          New brand identity has been launched for the{' '}
          <a href="#" onClick={(e) => e.preventDefault()}>Paapeli Library</a>
        </Banner>
        <Banner type="default">
          Check out our latest updates — no close button on this one.
        </Banner>
        <Banner type="default" icon={false} onClose={() => undefined}>
          Without icon — pass <code style={{ fontFamily: MONO, fontSize: 12 }}>icon={'{false}'}</code> to suppress it.
        </Banner>
      </div>
    </Panel>
  );
}

function LogoButtonShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Banner
          type="logo-button"
          icon={<PaapeliLogo size={32} />}
          action={<Button size="sm" color="brand">Sign up now</Button>}
          onClose={() => undefined}
        >
          Build websites even faster with components on top of Tailwind.
        </Banner>
        <Banner
          type="logo-button"
          icon={<PaapeliLogo size={32} />}
          action={
            <>
              <Button size="sm" color="brand">Sign up now</Button>
              <Button size="sm" color="secondary" outline>Close</Button>
            </>
          }
          onClose={() => undefined}
        >
          Dual-action variant — pass any nodes to the <code style={{ fontFamily: MONO, fontSize: 12 }}>action</code> slot.
        </Banner>
      </div>
    </Panel>
  );
}

function NewsletterShowcase() {
  return (
    <Panel>
      <Banner type="newsletter" onClose={() => undefined}>
        <NewsletterForm />
      </Banner>
    </Panel>
  );
}

function IconLinkShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Banner type="icon-link" onClose={() => undefined}>
          Get 2% pricing commission.{' '}
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 600 }}>Become a partner</a>
          {' '}→
        </Banner>
        <Banner type="icon-link" onClose={() => undefined}>
          Summer sale is live — up to 40% off all plans.{' '}
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 600 }}>Shop now →</a>
        </Banner>
      </div>
    </Panel>
  );
}

function HeadingDescriptionShowcase() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Banner
          type="heading-description"
          title="Integration is the key"
          action={<Button size="sm" color="brand">Get started →</Button>}
          secondaryAction={<Button size="sm" color="secondary" outline>Learn more</Button>}
          onClose={() => undefined}
        >
          You can integrate Paapeli with many tools to make your work even more efficient.
        </Banner>
        <Banner
          type="heading-description"
          title="You're invited to our live demo"
          action={<Button size="sm" color="brand">Register now →</Button>}
          onClose={() => undefined}
        >
          Join us this Thursday for an in-depth walkthrough of the new design system features.
        </Banner>
      </div>
    </Panel>
  );
}

// ─── Dismissible demo ─────────────────────────────────────────────────────────

function DismissibleDemo() {
  const [visible, setVisible] = useState(true);

  return (
    <Panel>
      {visible ? (
        <Banner
          type="heading-description"
          title="Dismissible banner"
          action={<Button size="sm" color="brand" onClick={() => setVisible(false)}>Acknowledge</Button>}
          secondaryAction={<Button size="sm" color="secondary" outline onClick={() => setVisible(false)}>Maybe later</Button>}
          onClose={() => setVisible(false)}
        >
          Pass an <code style={{ fontFamily: MONO, fontSize: 12 }}>onClose</code> handler to render
          the × button. The <code style={{ fontFamily: MONO, fontSize: 12 }}>action</code> and{' '}
          <code style={{ fontFamily: MONO, fontSize: 12 }}>secondaryAction</code> slots take any node.
        </Banner>
      ) : (
        <button
          onClick={() => setVisible(true)}
          style={{
            alignSelf: 'flex-start',
            padding: '6px 12px',
            fontFamily: MONO, fontSize: 11,
            border: `1px solid ${BRAND_MID}`,
            background: BRAND_BG,
            color: BRAND_MID,
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          Restore banner
        </button>
      )}
    </Panel>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

function Playground() {
  const [type, setType]           = useState<BannerType>('default');
  const [dismissable, setDismissable] = useState(true);
  const [withAction, setWithAction]   = useState(true);

  function renderPreview() {
    const onClose = dismissable ? () => undefined : undefined;

    if (type === 'default') {
      return (
        <Banner type="default" onClose={onClose}>
          New brand identity has been launched for the{' '}
          <a href="#" onClick={(e) => e.preventDefault()}>Paapeli Library</a>
        </Banner>
      );
    }

    if (type === 'logo-button') {
      return (
        <Banner
          type="logo-button"
          icon={<PaapeliLogo size={32} />}
          action={withAction ? <Button size="sm" color="brand">Sign up now</Button> : undefined}
          onClose={onClose}
        >
          Build websites even faster with components on top of Tailwind.
        </Banner>
      );
    }

    if (type === 'newsletter') {
      return (
        <Banner type="newsletter" onClose={onClose}>
          <NewsletterForm />
        </Banner>
      );
    }

    if (type === 'icon-link') {
      return (
        <Banner type="icon-link" onClose={onClose}>
          Get 2% pricing commission.{' '}
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 600 }}>Become a partner →</a>
        </Banner>
      );
    }

    // heading-description
    return (
      <Banner
        type="heading-description"
        title="Integration is the key"
        action={withAction ? <Button size="sm" color="brand">Get started →</Button> : undefined}
        secondaryAction={withAction ? <Button size="sm" color="secondary" outline>Learn more</Button> : undefined}
        onClose={onClose}
      >
        You can integrate Paapeli with many tools to make your work even more efficient.
      </Banner>
    );
  }

  const showActionToggle = type === 'logo-button' || type === 'heading-description';

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="type">
            <Segmented value={type} options={TYPES} onChange={setType} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="onClose"  value={dismissable}  onChange={setDismissable} />
              <Toggle label="action"   value={withAction}   onChange={setWithAction}  disabled={!showActionToggle} />
            </div>
          </ControlGroup>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 100 }}>
          <div style={{ width: '100%', border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 16 }}>
            {renderPreview()}
          </div>
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
    <div style={{ display: 'inline-flex', flexWrap: 'wrap', border: '1px solid var(--docs-border)', borderRadius: 6, overflow: 'hidden' }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 10px',
              fontFamily: MONO,
              fontSize: 11,
              border: 'none',
              borderRight: '1px solid var(--docs-border)',
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

function Toggle({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        padding: '6px 10px',
        fontFamily: MONO,
        fontSize: 11,
        border: `1px solid ${value && !disabled ? BRAND_MID : 'var(--docs-border)'}`,
        background: value && !disabled ? BRAND_BG : 'var(--docs-panel-bg)',
        color: value && !disabled ? BRAND_MID : 'var(--docs-text)',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  );
}

// ─── Props table ──────────────────────────────────────────────────────────────

const PROPS_TABLE: { name: string; type: string; default: string; description: string }[] = [
  { name: 'type',            type: 'default · logo-button · newsletter · icon-link · heading-description', default: 'default',   description: 'Layout variant.' },
  { name: 'title',           type: 'ReactNode',                                                             default: '—',         description: 'Bold heading — used by heading-description.' },
  { name: 'children',        type: 'ReactNode',                                                             default: '—',         description: 'Body text or form content. For newsletter, pass the entire form.' },
  { name: 'icon',            type: 'ReactNode | false',                                                     default: 'megaphone', description: 'Leading icon or logo. Pass false to hide on default type.' },
  { name: 'action',          type: 'ReactNode',                                                             default: '—',         description: 'Primary CTA slot — any element, usually a <Button>.' },
  { name: 'secondaryAction', type: 'ReactNode',                                                             default: '—',         description: 'Secondary CTA slot — used alongside action in heading-description.' },
  { name: 'onClose',         type: '() => void',                                                            default: '—',         description: 'When set, renders a dismiss (×) button on the right.' },
  { name: 'closeAriaLabel',  type: 'string',                                                                default: 'Dismiss',   description: 'Accessible label for the close button.' },
  { name: 'id',              type: 'string',                                                                default: '—',         description: 'HTML id forwarded to the root element.' },
  { name: 'className',       type: 'string',                                                                default: '—',         description: 'Extra class names merged onto the root element.' },
  { name: 'style',           type: 'CSSProperties',                                                         default: '—',         description: 'Inline styles forwarded to the root element.' },
];

function PropsTable() {
  return (
    <Panel padding={0}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 110px 2fr' }}>
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
            <Cell first last={i === PROPS_TABLE.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code>
            </Cell>
            <Cell last={i === PROPS_TABLE.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code>
            </Cell>
            <Cell last={i === PROPS_TABLE.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code>
            </Cell>
            <Cell last={i === PROPS_TABLE.length - 1}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>{row.description}</span>
            </Cell>
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

function Cell({ children, first, last }: { children: React.ReactNode; first?: boolean; last?: boolean }) {
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

export function BannerGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Types" note="The five layout variants supported by Banner." />
      <TypeReference />

      <SectionHeader title="Default" note="Centered announcement bar with optional leading icon and inline link." />
      <DefaultShowcase />

      <SectionHeader title="Logo + Button" note="Brand logo mark separated by a divider, with a primary CTA on the right." />
      <LogoButtonShowcase />

      <SectionHeader title="Newsletter" note="Centered sign-up form — pass your inputs and subscribe button as children." />
      <NewsletterShowcase />

      <SectionHeader title="Icon & Link" note="Brand-colored dot with inline text and a hyperlink with arrow." />
      <IconLinkShowcase />

      <SectionHeader title="Heading & Description" note="Two-column layout with bold title, body copy, and dual action slots." />
      <HeadingDescriptionShowcase />

      <SectionHeader title="Dismissible" note="Live example — onClose unmounts the banner." />
      <DismissibleDemo />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
