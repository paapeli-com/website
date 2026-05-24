import React, { useState, useMemo, useRef } from 'react';
import { Icon } from '@paapeli/ui-kit';
import { ICON_NAMES } from 'paapeli-font/icon-names';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND     = '#803c00';
const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Icon
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Icon font component from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>
        {' '}powered by the{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>paapeli-font</code>
        {' '}icon set. 753 glyphs — size and color controlled via CSS.
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

// ─── Setup section ────────────────────────────────────────────────────────────

function SetupSection() {
  return (
    <Panel>
      <p style={{ fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)', margin: '0 0 12px' }}>
        Install <code style={{ fontFamily: MONO, fontSize: 12 }}>paapeli-font</code> separately and import both CSS files
        in your app entry point. The icon component lives in <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code> and requires no additional dependencies.
      </p>
      <pre style={{
        fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
        background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
        borderRadius: 8, padding: '12px 14px', margin: 0, whiteSpace: 'pre-wrap',
      }}>{`// In your app entry (e.g. main.tsx / layout.tsx)
import 'paapeli-font/style.css';   // @font-face declaration
import 'paapeli-font/icons.css';   // per-icon ::before rules

// Then use the Icon component anywhere
import { Icon } from '@paapeli/ui-kit';

<Icon name="check" />
<Icon name="user" color="#803c00" style={{ fontSize: 24 }} />
<Icon name="home" ariaLabel="Home" />`}
      </pre>
    </Panel>
  );
}

// ─── Icon gallery ─────────────────────────────────────────────────────────────

type GalleryProps = {
  selected: string;
  onSelect: (name: string) => void;
};

function IconGallery({ selected, onSelect }: GalleryProps) {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ICON_NAMES.filter((n) => n.includes(q)) : ICON_NAMES;
  }, [query]);

  function handleClick(name: string) {
    onSelect(name);
    navigator.clipboard.writeText(name).catch(() => {});
    setCopied(name);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search icons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontFamily: FONT,
            fontSize: 13,
            border: '1px solid var(--docs-border)',
            borderRadius: 8,
            background: 'var(--docs-panel-bg)',
            color: 'var(--docs-text)',
            outline: 'none',
          }}
        />
        <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} / {ICON_NAMES.length}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '48px 0', textAlign: 'center',
          fontFamily: FONT, fontSize: 13, color: 'var(--docs-text-muted)',
          border: '1px solid var(--docs-border)', borderRadius: 10,
        }}>
          No icons match &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 8,
        }}>
          {filtered.map((name) => {
            const isSelected = selected === name;
            const isCopied = copied === name;
            return (
              <button
                key={name}
                onClick={() => handleClick(name)}
                title={`Select "${name}"`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 8px 12px',
                  border: `1px solid ${isSelected ? BRAND_MID : 'var(--docs-border)'}`,
                  borderRadius: 8,
                  background: isSelected ? BRAND_BG : 'var(--docs-panel-bg)',
                  cursor: 'pointer',
                  outline: isSelected ? `2px solid ${BRAND}` : 'none',
                  outlineOffset: 2,
                  transition: 'border-color 0.15s, background 0.15s',
                  minWidth: 0,
                }}
              >
                <Icon
                  name={name}
                  color={isSelected ? BRAND_MID : undefined}
                  style={{ fontSize: 24, lineHeight: 1, display: 'block' }}
                />
                <span style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  color: isSelected ? BRAND_MID : 'var(--docs-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}>
                  {isCopied ? '✓ copied' : name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sizes section ────────────────────────────────────────────────────────────

const SIZES: { label: string; px: number }[] = [
  { label: '12', px: 12 },
  { label: '16', px: 16 },
  { label: '20', px: 20 },
  { label: '24', px: 24 },
  { label: '32', px: 32 },
  { label: '48', px: 48 },
  { label: '64', px: 64 },
];

function SizesSection({ name }: { name: string }) {
  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
        {SIZES.map(({ label, px }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Icon name={name} style={{ fontSize: px, color: 'var(--docs-text)', lineHeight: 1, display: 'block' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)' }}>{label}px</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Colors section ───────────────────────────────────────────────────────────

const COLOR_SAMPLES: { label: string; color: string; bg?: string }[] = [
  { label: 'default',         color: 'var(--docs-text)' },
  { label: '#803c00 (brand)', color: '#803c00' },
  { label: '#16a34a (green)', color: '#16a34a' },
  { label: '#dc2626 (red)',   color: '#dc2626' },
  { label: '#2563eb (blue)',  color: '#2563eb' },
  { label: '#ffffff (white)', color: '#ffffff', bg: '#1e2939' },
];

function ColorsSection({ name }: { name: string }) {
  return (
    <Panel>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        {COLOR_SAMPLES.map(({ label, color, bg }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ background: bg, borderRadius: 8, padding: bg ? 10 : 0, display: 'inline-flex' }}>
              <Icon name={name} color={color} style={{ fontSize: 32, lineHeight: 1, display: 'block' }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textAlign: 'center' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', margin: '16px 0 0' }}>
        Pass any CSS color to the <code style={{ fontFamily: MONO, fontSize: 11 }}>color</code> prop.
        Size is controlled via <code style={{ fontFamily: MONO, fontSize: 11 }}>style.fontSize</code>.
      </p>
    </Panel>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

type PlaygroundProps = {
  name: string;
  onNameChange: (name: string) => void;
};

function Playground({ name, onNameChange }: PlaygroundProps) {
  const [size, setSize] = useState(32);
  const [color, setColor] = useState('#803c00');

  const styleProps: string[] = [];
  if (size !== 24) styleProps.push(`fontSize: ${size}`);
  const styleStr = styleProps.length ? ` style={{ ${styleProps.join(', ')} }}` : '';
  const codeSnippet = `<Icon name="${name}" color="${color}"${styleStr} />`;

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="icon name">
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. check"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '6px 10px',
                fontFamily: MONO,
                fontSize: 12,
                border: '1px solid var(--docs-border)',
                borderRadius: 6,
                background: 'var(--docs-panel-bg)',
                color: 'var(--docs-text)',
                outline: 'none',
              }}
            />
          </ControlGroup>

          <ControlGroup label={`size — ${size}px`}>
            <input
              type="range"
              min={12}
              max={96}
              step={4}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: BRAND }}
            />
          </ControlGroup>

          <ControlGroup label="color">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 36, height: 30, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 2, background: 'none' }}
              />
              <code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text-muted)' }}>{color}</code>
            </div>
          </ControlGroup>
        </div>

        {/* Preview + code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: '32px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120,
          }}>
            <Icon name={name} color={color} style={{ fontSize: size }} />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {codeSnippet}
          </pre>
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

// ─── Props table ──────────────────────────────────────────────────────────────

const PROPS_TABLE: { name: string; type: string; default: string; description: string }[] = [
  { name: 'name',       type: 'string',               default: '—',      description: 'Icon name from the paapeli-font set (e.g. "check", "star", "home").' },
  { name: 'color',      type: 'string',               default: '—',      description: 'Any CSS color. Overrides the font palette so the glyph renders in that color.' },
  { name: 'iconPrefix', type: 'string',               default: '"icon"', description: 'CSS class prefix. Renders as `{prefix} {prefix}-{name}`.' },
  { name: 'style',      type: 'CSSProperties',        default: '—',      description: 'Inline styles. Use fontSize to control size.' },
  { name: 'className',  type: 'string',               default: '—',      description: 'Additional CSS classes merged onto the <i> element.' },
  { name: 'ariaLabel',  type: 'string',               default: '—',      description: 'Accessible label. When omitted the icon is hidden from screen readers.' },
  { name: 'role',       type: 'AriaRole',             default: '—',      description: 'ARIA role override.' },
  { name: 'onClick',    type: '(e) => void',          default: '—',      description: 'Click handler.' },
  { name: 'ref',        type: 'RefObject<HTMLElement>', default: '—',    description: 'Forwarded ref to the underlying <i> element.' },
];

function PropsTable() {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--docs-border)', background: 'var(--docs-panel-bg)', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 110px 2fr' }}>
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
    </div>
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

export function IconGalleryPage() {
  const [selectedName, setSelectedName] = useState('star');

  return (
    <div style={{ padding: '36px 40px', background: 'var(--docs-page-bg)', minHeight: '100vh', fontFamily: FONT }}>
      <PageHeader />

      <SectionHeader title="Setup" />
      <SetupSection />

      <SectionHeader
        title="Icon list"
        note="Click any icon to select it — the playground and size/color sections update instantly. Name is also copied to clipboard."
      />
      <IconGallery selected={selectedName} onSelect={setSelectedName} />

      <SectionHeader title="Sizes" note="Set font-size on the Icon to scale — icons are pure text glyphs." />
      <SizesSection name={selectedName} />

      <SectionHeader title="Colors" note="Pass any CSS color to the color prop." />
      <ColorsSection name={selectedName} />

      <SectionHeader title="Playground" note="Type a name or click any icon above, then adjust size and color." />
      <Playground name={selectedName} onNameChange={setSelectedName} />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
