import React, { useState } from 'react';
import {
  Badge,
  type BadgeColor,
  type BadgeSize,
  type BadgeType,
} from '@paapeli/ui-kit';

// ─── Theme tokens (mirror BgColors.tsx for visual consistency) ───────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Reference data ──────────────────────────────────────────────────────────

const COLORS: BadgeColor[] = ['gray', 'white', 'brand', 'danger', 'warning', 'success', 'info'];
const SIZES:  BadgeSize[]  = ['sm', 'lg'];
const TYPES:  BadgeType[]  = ['default', 'avatar', 'dot', 'loader', 'secondary-text'];

// Inline data-URI avatar (small head silhouette) so the doc has no network deps.
const AVATAR_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#e2e8f0"/>
      <circle cx="12" cy="9" r="4" fill="#94a3b8"/>
      <path d="M4 22c0-4 3.6-7 8-7s8 3 8 7" fill="#94a3b8"/>
    </svg>`
  );

const Avatar = () => (
  <img src={AVATAR_SVG} alt="" />
);

// ─── Layout primitives ───────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Badge
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Compact pill from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Six color themes, two sizes, five layout types.
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

// ─── Sections ────────────────────────────────────────────────────────────────

function ColorSizeMatrix({ type, dismissable }: { type: BadgeType; dismissable?: boolean }) {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {SIZES.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 36, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
              {s}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {COLORS.map((c) => (
                <Badge
                  key={c}
                  color={c}
                  size={s}
                  type={type}
                  avatar={type === 'avatar' ? <Avatar /> : undefined}
                  secondaryText={type === 'secondary-text' ? 'Secondary text' : undefined}
                  onClose={dismissable ? () => undefined : undefined}
                >
                  Badge text
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TypeReference() {
  return (
    <Panel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        columnGap: 24, rowGap: 14, alignItems: 'center',
      }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>type</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>preview</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>description</div>

        <div><CodeChip label="default" /></div>
        <div><Badge color="brand" type="default" onClose={() => undefined}>Badge text</Badge></div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Pill with leading info icon, label and optional close.
        </div>

        <div><CodeChip label="avatar" /></div>
        <div><Badge color="brand" type="avatar" avatar={<Avatar />} onClose={() => undefined}>Badge text</Badge></div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Pill with a circular avatar in the leading slot.
        </div>

        <div><CodeChip label="dot" /></div>
        <div><Badge color="brand" type="dot" onClose={() => undefined}>Badge text</Badge></div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Pill with a small colored dot — for status / category labels.
        </div>

        <div><CodeChip label="loader" /></div>
        <div><Badge color="brand" type="loader" onClose={() => undefined}>Badge text</Badge></div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Spinning loader in the leading slot — for in-flight state.
        </div>

        <div><CodeChip label="secondary-text" /></div>
        <div>
          <Badge color="brand" type="secondary-text" secondaryText="Secondary" onClose={() => undefined}>
            Badge text
          </Badge>
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Two-up label split by a divider — for key/value pairs.
        </div>
      </div>
    </Panel>
  );
}

function SquareSection() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 88, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>iconOnly</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {SIZES.map((s) => (
              <React.Fragment key={s}>
                {COLORS.map((c) => (
                  <Badge key={`${c}-${s}`} color={c} size={s} iconOnly>{null}</Badge>
                ))}
                <div style={{ width: 1, height: 18, background: 'var(--docs-border)', margin: '0 4px' }} />
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 88, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>textOnly</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {SIZES.map((s) => (
              <React.Fragment key={s}>
                {COLORS.map((c) => (
                  <Badge key={`${c}-${s}`} color={c} size={s} textOnly>1</Badge>
                ))}
                <div style={{ width: 1, height: 18, background: 'var(--docs-border)', margin: '0 4px' }} />
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function DismissibleDemo() {
  const [items, setItems] = useState(['React', 'TypeScript', 'SCSS', 'Storybook', 'Vite']);

  return (
    <Panel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', minHeight: 32 }}>
        {items.length ? (
          items.map((label) => (
            <Badge
              key={label}
              color="brand"
              type="dot"
              onClose={() => setItems((prev) => prev.filter((x) => x !== label))}
            >
              {label}
            </Badge>
          ))
        ) : (
          <button
            onClick={() => setItems(['React', 'TypeScript', 'SCSS', 'Storybook', 'Vite'])}
            style={{
              padding: '6px 12px',
              fontFamily: MONO, fontSize: 11,
              border: `1px solid ${BRAND_MID}`,
              background: BRAND_BG, color: BRAND_MID,
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            Restore tags
          </button>
        )}
      </div>
    </Panel>
  );
}

// ─── Interactive playground ──────────────────────────────────────────────────

function Playground() {
  const [color, setColor] = useState<BadgeColor>('brand');
  const [size, setSize]   = useState<BadgeSize>('sm');
  const [type, setType]   = useState<BadgeType>('default');
  const [dismissable, setDismissable] = useState(true);
  const [iconOnly, setIconOnly] = useState(false);
  const [textOnly, setTextOnly] = useState(false);

  const square = iconOnly || textOnly;

  const codeProps = [
    `color="${color}"`,
    `size="${size}"`,
    !square && `type="${type}"`,
    !square && type === 'secondary-text' && `secondaryText="Secondary"`,
    !square && dismissable && `onClose={fn}`,
    iconOnly && 'iconOnly',
    textOnly && 'textOnly',
  ].filter(Boolean).join(' ');

  const child = textOnly ? '1' : iconOnly ? '' : 'Badge text';

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="color">
            <Segmented value={color} options={COLORS} onChange={setColor} />
          </ControlGroup>
          <ControlGroup label="size">
            <Segmented value={size} options={SIZES} onChange={setSize} />
          </ControlGroup>
          <ControlGroup label="type">
            <Segmented value={type} options={TYPES} onChange={setType} disabled={square} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="onClose"  value={dismissable} onChange={setDismissable} disabled={square} />
              <Toggle label="iconOnly" value={iconOnly}    onChange={(v) => { setIconOnly(v); if (v) setTextOnly(false); }} />
              <Toggle label="textOnly" value={textOnly}    onChange={(v) => { setTextOnly(v); if (v) setIconOnly(false); }} />
            </div>
          </ControlGroup>
        </div>

        {/* Preview + code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120,
          }}>
            <Badge
              color={color}
              size={size}
              type={type}
              avatar={type === 'avatar' ? <Avatar /> : undefined}
              secondaryText={type === 'secondary-text' ? 'Secondary' : undefined}
              onClose={!square && dismissable ? () => undefined : undefined}
              iconOnly={iconOnly}
              textOnly={textOnly}
            >
              {child}
            </Badge>
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<Badge ${codeProps}>${iconOnly ? '' : child}</Badge>`}
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

function Segmented<T extends string>({ value, options, onChange, disabled }: { value: T; options: readonly T[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', flexWrap: 'wrap',
      border: '1px solid var(--docs-border)', borderRadius: 6, overflow: 'hidden',
      opacity: disabled ? 0.45 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 10px',
              fontFamily: MONO, fontSize: 11,
              border: 'none', borderRight: '1px solid var(--docs-border)',
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
        fontFamily: MONO, fontSize: 11,
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

// ─── Prop reference ──────────────────────────────────────────────────────────

const PROPS_TABLE: { name: string; type: string; default: string; description: string }[] = [
  { name: 'color',         type: 'gray · white · brand · danger · warning · success · info', default: 'gray', description: 'Theme color of the pill.' },
  { name: 'size',          type: 'sm · lg',                                            default: 'sm',       description: '20px (sm) or 24px (lg) tall.' },
  { name: 'type',          type: 'default · avatar · dot · loader · secondary-text',   default: 'default',  description: 'Layout variant — controls the leading slot.' },
  { name: 'children',      type: 'ReactNode',                                          default: '—',        description: 'Main label.' },
  { name: 'secondaryText', type: 'ReactNode',                                          default: '—',        description: 'Used by the secondary-text variant.' },
  { name: 'avatar',        type: 'ReactNode',                                          default: '—',        description: 'Avatar node (typically <img>) for the avatar variant.' },
  { name: 'icon',          type: 'ReactNode | false',                                  default: 'info icon', description: 'Override the leading icon. Pass false to hide.' },
  { name: 'iconOnly',      type: 'boolean',                                            default: 'false',    description: 'Square icon-only badge.' },
  { name: 'textOnly',      type: 'boolean',                                            default: 'false',    description: 'Square number/text-only badge.' },
  { name: 'onClose',       type: '() => void',                                         default: '—',        description: 'When set, renders a trailing close button.' },
  { name: 'closeAriaLabel',type: 'string',                                             default: 'Remove',   description: 'Accessible label for the close button.' },
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
            <Cell first last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code></Cell>
            <Cell last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code></Cell>
            <Cell last={i === PROPS_TABLE.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code></Cell>
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

// ─── Page ────────────────────────────────────────────────────────────────────

export function BadgeGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Types" note="The five layout variants supported by Badge." />
      <TypeReference />

      <SectionHeader title="Default" note="Color × size matrix with the leading info icon." />
      <ColorSizeMatrix type="default" dismissable />

      <SectionHeader title="With avatar" note="Replace the leading icon with a circular avatar." />
      <ColorSizeMatrix type="avatar" dismissable />

      <SectionHeader title="With dot" note="Compact category / status pill." />
      <ColorSizeMatrix type="dot" dismissable />

      <SectionHeader title="With loader" note="Use for transient / in-flight state." />
      <ColorSizeMatrix type="loader" dismissable />

      <SectionHeader title="With secondary text" note="Two-up label split by a divider." />
      <ColorSizeMatrix type="secondary-text" dismissable />

      <SectionHeader title="Icon only · text only" note="Square notification dots — sized 20px (sm) / 24px (lg)." />
      <SquareSection />

      <SectionHeader title="Dismissible tags" note="Live example — onClose removes the tag from state." />
      <DismissibleDemo />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
