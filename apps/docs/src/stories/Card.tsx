import React from 'react';
import { Button, Card, Icon } from '@paapeli/ui-kit';

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
        Card
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Surface container from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Just the box — white background, 1px gray-200 border, 12px radius, 24px padding,
        {' '}subtle shadow. Pass arbitrary content via <code style={{ fontFamily: MONO, fontSize: 12 }}>children</code>.
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

function Panel({ children, padding = 32 }: { children: React.ReactNode; padding?: number }) {
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

// ─── Sample inner content (mirrors the Figma example) ────────────────────────

function FigmaExampleContent() {
  return (
    <>
      <div style={{
        height: 192,
        marginBottom: 24,
        borderRadius: 12,
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <NewspaperIcon />
      </div>

      <h3 style={{
        margin: '0 0 12px',
        fontFamily: FONT,
        fontSize: 24,
        fontWeight: 600,
        lineHeight: 1.2,
        color: '#101828',
      }}>
        Streamlining your design process with Paapeli.
      </h3>

      <p style={{
        margin: '0 0 24px',
        fontFamily: FONT,
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5,
        color: '#4a5565',
      }}>
        In today's fast-paced digital landscape, fostering seamless collaboration
        among Developers and IT Operations.
      </p>

      <Button size="sm" color="secondary" outline>
        Read more →
      </Button>
    </>
  );
}

const NewspaperIcon = () => (
  <svg width={64} height={64} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <rect x="14" y="12" width="32" height="40" rx="3" stroke="#4a5565" strokeWidth="2.5" />
    <path d="M46 22h6v26a4 4 0 0 1-4 4h-2" stroke="#4a5565" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="20" y="20" width="20" height="14" rx="1.5" stroke="#4a5565" strokeWidth="2" />
    <path d="M22 31l5-4 4 3 6-5" stroke="#4a5565" strokeWidth="2" strokeLinejoin="round" />
    <path d="M20 39h20M20 43h20M20 47h12" stroke="#4a5565" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ─── Sections ─────────────────────────────────────────────────────────────────

function FigmaExample() {
  return (
    <Panel>
      <div style={{ width: 384 }}>
        <Card>
          <FigmaExampleContent />
        </Card>
      </div>
    </Panel>
  );
}

function VariationsGrid() {
  return (
    <Panel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
      }}>
        <Variation label="default" code="<Card>...</Card>">
          <Card>
            <SimpleContent />
          </Card>
        </Variation>

        <Variation label="flat" code="<Card flat>...</Card>">
          <Card flat>
            <SimpleContent />
          </Card>
        </Variation>

        <Variation label="borderless" code="<Card borderless>...</Card>">
          <Card borderless>
            <SimpleContent />
          </Card>
        </Variation>

        <Variation label="padding={0}" code="<Card padding={0}>...</Card>">
          <Card padding={0}>
            <div style={{
              height: 80, background: '#f3f4f6', borderTopLeftRadius: 11, borderTopRightRadius: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: MONO, fontSize: 12, color: 'var(--docs-text-muted)',
            }}>
              flush header
            </div>
            <div style={{ padding: 24 }}>
              <SimpleContent />
            </div>
          </Card>
        </Variation>

        <Variation label="padding=16" code="<Card padding={16}>...</Card>">
          <Card padding={16}>
            <SimpleContent />
          </Card>
        </Variation>

        <Variation label="clickable" code="<Card onClick={fn}>...</Card>">
          <Card
            onClick={() => undefined}
            role="button"
            tabIndex={0}
            ariaLabel="Open card"
          >
            <SimpleContent />
          </Card>
        </Variation>
      </div>
    </Panel>
  );
}

function SimpleContent() {
  return (
    <>
      <h4 style={{
        margin: '0 0 8px',
        fontFamily: FONT, fontSize: 16, fontWeight: 600, color: '#101828',
      }}>
        Card title
      </h4>
      <p style={{
        margin: 0,
        fontFamily: FONT, fontSize: 13, lineHeight: 1.5, color: '#4a5565',
      }}>
        The Card is just a styled box. Compose any layout you want inside its
        children — text, media, lists, or another card.
      </p>
    </>
  );
}

function Variation({ label, code, children }: { label: string; code: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: MONO, fontSize: 10, color: BRAND_MID, background: BRAND_BG,
          border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '1px 5px',
        }}>
          {label}
        </span>
        <code style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)' }}>
          {code}
        </code>
      </div>
      {children}
    </div>
  );
}

// ─── Composition example — Card holding any content ──────────────────────────

function ComposedExamples() {
  return (
    <Panel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
      }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 9999,
              background: '#fff3eb', color: '#aa4f00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT, fontWeight: 600, fontSize: 14,
            }}>
              JD
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#101828' }}>
                Jane Doe
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: '#6a7282' }}>
                Product designer · Helsinki
              </div>
            </div>
          </div>
          <p style={{
            margin: '0 0 16px',
            fontFamily: FONT, fontSize: 13, lineHeight: 1.5, color: '#4a5565',
          }}>
            "I'm impressed by how quickly we shipped the new dashboard. The shared
            components made everything slot together cleanly."
          </p>
          <div style={{ fontFamily: FONT, fontSize: 11, color: '#6a7282' }}>
            5 days ago
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, color: '#6a7282' }}>Active users</span>
            <Icon name="trending-up" style={{ fontSize: 18, color: '#00a63e' }} />
          </div>
          <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 600, color: '#101828', lineHeight: 1.1 }}>
            12,489
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: '#00a63e', marginTop: 4 }}>
            ↑ 12.4% vs last month
          </div>
        </Card>

        <Card>
          <h4 style={{ margin: '0 0 12px', fontFamily: FONT, fontSize: 15, fontWeight: 600, color: '#101828' }}>
            What's new
          </h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Toggle component shipped in 0.0.1',
              'Skeleton layouts published to Storybook',
              'Range slider supports dual thumbs',
            ].map((item) => (
              <li key={item} style={{
                fontFamily: FONT, fontSize: 13, color: '#4a5565',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{
                  flexShrink: 0, width: 6, height: 6, borderRadius: 9999,
                  background: '#ff7900', marginTop: 7,
                }} />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Panel>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

const PROPS_TABLE = [
  { name: 'children',   type: 'ReactNode',          default: '—',     description: 'Anything rendered inside the box.' },
  { name: 'padding',    type: 'number · string',    default: '24',    description: 'Override default padding. Numbers become px. Pass `0` for image-flush layouts.' },
  { name: 'flat',       type: 'boolean',            default: 'false', description: 'Hide the subtle drop shadow.' },
  { name: 'borderless', type: 'boolean',            default: 'false', description: 'Hide the border.' },
  { name: 'onClick',    type: '(e) => void',        default: '—',     description: 'Makes the card interactive (cursor + hover state). Pair with role + tabIndex for accessibility.' },
  { name: 'role',       type: 'AriaRole',           default: '—',     description: 'Forwarded to the root element.' },
  { name: 'tabIndex',   type: 'number',             default: '—',     description: 'Forwarded to the root element.' },
  { name: 'ariaLabel',  type: 'string',             default: '—',     description: 'Accessible name for clickable cards.' },
  { name: 'className',  type: 'string',             default: '—',     description: 'Class name override.' },
  { name: 'style',      type: 'CSSProperties',      default: '—',     description: 'Inline-style override.' },
];

function PropsTable() {
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
        {PROPS_TABLE.map((row, i) => (
          <React.Fragment key={row.name}>
            <RowCell first last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code></RowCell>
            <RowCell last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code></RowCell>
            <RowCell last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code></RowCell>
            <RowCell last={i === PROPS_TABLE.length - 1}>
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

export function CardGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Figma example" note="Card box wrapping the example content from the Figma frame." />
      <FigmaExample />

      <SectionHeader title="Variations" note="Padding override, flat (no shadow), borderless, clickable." />
      <VariationsGrid />

      <SectionHeader title="Composition" note="The same box wrapping unrelated content — testimonial, stat, list." />
      <ComposedExamples />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
