import React, { useState } from 'react';
import {
  Badge,
  Breadcrumb,
  Icon,
  type BreadcrumbItem,
  type BreadcrumbVariant,
} from '@paapeli/ui-kit';

// ─── Theme tokens (mirror other stories for visual consistency) ──────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Reference data ──────────────────────────────────────────────────────────

const VARIANTS: BreadcrumbVariant[] = ['default', 'background'];

const HomeIcon  = () => <Icon name="home" style={{ fontSize: 16 }} />;
const DbIcon    = () => <Icon name="database" style={{ fontSize: 14 }} />;
const BranchIcon = () => <Icon name="github" style={{ fontSize: 14 }} />;

// ─── Layout primitives ───────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Breadcrumb
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Hierarchical navigation trail from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Mix plain text crumbs and pill-shaped action crumbs (with icons, dropdowns, and badges) to build any path.
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 40 }}>
      <div style={{ width: 140, fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function VariantReference() {
  const items: BreadcrumbItem[] = [
    { id: 'home',     label: 'Home',       icon: <HomeIcon />, href: '#' },
    { id: 'commerce', label: 'E-commerce', href: '#' },
    { id: 'users',    label: 'Users',      href: '#' },
    { id: 'all',      label: 'All users' },
  ];

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {VARIANTS.map((v) => (
          <Row key={v} label={v}>
            <Breadcrumb items={items} variant={v} />
          </Row>
        ))}
      </div>
    </Panel>
  );
}

function WithDropdownExample() {
  const items: BreadcrumbItem[] = [
    { id: 'home',     label: 'Home',     icon: <HomeIcon />, href: '#' },
    { id: 'settings', label: 'Settings', href: '#' },
    { id: 'dbs',      label: 'Databases', href: '#' },
    { id: 'paapeli',  label: 'Paapeli', icon: <DbIcon />, pill: true, dropdown: true, onClick: () => undefined },
  ];

  return (
    <Panel>
      <Breadcrumb items={items} />
    </Panel>
  );
}

function WithGroupButtonsExample() {
  const items: BreadcrumbItem[] = [
    { id: 'home',     label: 'Home',     icon: <HomeIcon />, href: '#' },
    { id: 'settings', label: 'Settings', href: '#' },
    { id: 'user',     label: 'User settings' },
  ];

  return (
    <Panel>
      <Breadcrumb
        items={items}
        withGroupButtons
        onBack={() => undefined}
        onForward={() => undefined}
      />
    </Panel>
  );
}

function OnlyButtonsExample() {
  const items: BreadcrumbItem[] = [
    {
      id: 'repo',
      label: 'paapeli.com',
      icon: <BranchIcon />,
      pill: true,
      dropdown: true,
      onClick: () => undefined,
    },
    {
      id: 'db',
      label: 'databaseName',
      icon: <DbIcon />,
      pill: true,
      dropdown: true,
      onClick: () => undefined,
    },
  ];

  return (
    <Panel>
      <Breadcrumb items={items} />
    </Panel>
  );
}

function WithBadgeExample() {
  const items: BreadcrumbItem[] = [
    { id: 'repo',    label: 'paapeli.com', href: '#' },
    { id: 'branch',  label: 'develop',     href: '#' },
    {
      id: 'issue',
      label: 'Issue #312',
      badge: <Badge color="warning" size="sm" type="default" icon={false}>docs</Badge>,
    },
    {
      id: 'fix',
      label: 'Fix #6597',
      icon: <BranchIcon />,
      pill: true,
      dropdown: true,
      onClick: () => undefined,
    },
  ];

  return (
    <Panel>
      <Breadcrumb items={items} />
    </Panel>
  );
}

function ItemReference() {
  return (
    <Panel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        columnGap: 24, rowGap: 14, alignItems: 'center',
      }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>flag</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>preview</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>description</div>

        <div><CodeChip label="text" /></div>
        <div>
          <Breadcrumb items={[{ id: '1', label: 'Settings', href: '#' }, { id: '2', label: 'Profile' }]} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Default — plain text crumb. Active (last) crumb gets a darker color.
        </div>

        <div><CodeChip label="icon" /></div>
        <div>
          <Breadcrumb items={[{ id: '1', label: 'Home', icon: <HomeIcon />, href: '#' }, { id: '2', label: 'Inbox' }]} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Pass an <code style={{ fontFamily: MONO, fontSize: 11 }}>icon</code> node to render before the label.
        </div>

        <div><CodeChip label="pill" /></div>
        <div>
          <Breadcrumb items={[{ id: '1', label: 'Home', href: '#' }, { id: '2', label: 'Paapeli', icon: <DbIcon />, pill: true }]} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Wraps the crumb in a rounded surface — useful for the active / contextual node.
        </div>

        <div><CodeChip label="dropdown" /></div>
        <div>
          <Breadcrumb items={[{ id: '1', label: 'Home', href: '#' }, { id: '2', label: 'Paapeli', icon: <DbIcon />, pill: true, dropdown: true, onClick: () => undefined }]} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Adds a trailing chevron-down — turns the crumb into a menu trigger and applies the brand tint.
        </div>

        <div><CodeChip label="badge" /></div>
        <div>
          <Breadcrumb items={[
            { id: '1', label: 'Issues', href: '#' },
            { id: '2', label: '#312', badge: <Badge color="warning" size="sm" icon={false}>docs</Badge> },
          ]} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Append any node (typically a <code style={{ fontFamily: MONO, fontSize: 11 }}>{'<Badge>'}</code>) after the label.
        </div>
      </div>
    </Panel>
  );
}

// ─── Interactive playground ──────────────────────────────────────────────────

function Playground() {
  const [variant, setVariant]   = useState<BreadcrumbVariant>('default');
  const [withIcon, setWithIcon] = useState(true);
  const [lastPill, setLastPill] = useState(false);
  const [lastDropdown, setLastDropdown] = useState(false);
  const [withGroup, setWithGroup] = useState(false);

  const items: BreadcrumbItem[] = [
    { id: 'home',     label: 'Home',     icon: withIcon ? <HomeIcon /> : undefined, href: '#' },
    { id: 'settings', label: 'Settings', href: '#' },
    { id: 'dbs',      label: 'Databases', href: '#' },
    {
      id: 'last',
      label: 'Paapeli',
      icon: lastPill ? <DbIcon /> : undefined,
      pill: lastPill,
      dropdown: lastDropdown,
      onClick: lastDropdown ? () => undefined : undefined,
    },
  ];

  const codeProps = [
    `variant="${variant}"`,
    withGroup && 'withGroupButtons',
    withGroup && 'onBack={fn}',
    withGroup && 'onForward={fn}',
  ].filter(Boolean).join(' ');

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="variant">
            <Segmented value={variant} options={VARIANTS} onChange={setVariant} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="leading icon"      value={withIcon}     onChange={setWithIcon} />
              <Toggle label="last pill"         value={lastPill}     onChange={setLastPill} />
              <Toggle label="last dropdown"     value={lastDropdown} onChange={(v) => { setLastDropdown(v); if (v) setLastPill(true); }} />
              <Toggle label="withGroupButtons"  value={withGroup}    onChange={setWithGroup} />
            </div>
          </ControlGroup>
        </div>

        {/* Preview + code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: 120,
          }}>
            <Breadcrumb
              items={items}
              variant={variant}
              withGroupButtons={withGroup}
              onBack={withGroup ? () => undefined : undefined}
              onForward={withGroup ? () => undefined : undefined}
            />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<Breadcrumb items={items} ${codeProps} />`}
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
  { name: 'items',            type: 'BreadcrumbItem[]',                 default: '—',         description: 'Ordered list of crumbs (root → current).' },
  { name: 'variant',          type: 'default · background',             default: 'default',   description: 'Wraps the trail in a rounded surface when set to "background".' },
  { name: 'separator',        type: 'ReactNode',                        default: 'chevron',   description: 'Replace the default chevron-right between crumbs.' },
  { name: 'withGroupButtons', type: 'boolean',                          default: 'false',     description: 'Prepend back/forward navigation arrows.' },
  { name: 'onBack',           type: '() => void',                       default: '—',         description: 'Click handler for the back arrow.' },
  { name: 'onForward',        type: '() => void',                       default: '—',         description: 'Click handler for the forward arrow.' },
  { name: 'backDisabled',     type: 'boolean',                          default: 'false',     description: 'Disables the back arrow.' },
  { name: 'forwardDisabled',  type: 'boolean',                          default: 'false',     description: 'Disables the forward arrow.' },
  { name: 'ariaLabel',        type: 'string',                           default: 'Breadcrumb', description: 'Accessible label for the <nav>.' },
];

const ITEM_PROPS_TABLE: { name: string; type: string; default: string; description: string }[] = [
  { name: 'label',         type: 'ReactNode',           default: '—',     description: 'Crumb text.' },
  { name: 'icon',          type: 'ReactNode',           default: '—',     description: 'Leading icon.' },
  { name: 'href',          type: 'string',              default: '—',     description: 'Renders the crumb as an <a>.' },
  { name: 'onClick',       type: '(e) => void',         default: '—',     description: 'Renders the crumb as a <button> when no href is set.' },
  { name: 'pill',          type: 'boolean',             default: 'false', description: 'Wraps the crumb in a rounded surface.' },
  { name: 'dropdown',      type: 'boolean',             default: 'false', description: 'Adds a trailing chevron-down + brand tint (combine with pill).' },
  { name: 'active',        type: 'boolean',             default: 'auto',  description: 'Marks the crumb as current. Defaults to true on the last item.' },
  { name: 'badge',         type: 'ReactNode',           default: '—',     description: 'Element appended after the label (typically a <Badge>).' },
  { name: 'hideSeparator', type: 'boolean',             default: 'false', description: 'Hides the chevron after this crumb.' },
  { name: 'id',            type: 'string',              default: 'index', description: 'React key for the row.' },
  { name: 'ariaLabel',     type: 'string',              default: '—',     description: 'Accessible label for the crumb.' },
];

function PropsTable({ rows }: { rows: typeof PROPS_TABLE }) {
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

        {rows.map((row, i) => (
          <React.Fragment key={row.name}>
            <Cell first last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code></Cell>
            <Cell last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code></Cell>
            <Cell last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code></Cell>
            <Cell last={i === rows.length - 1}>
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

export function BreadcrumbGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Variants" note="Plain trail vs. wrapped in a rounded surface." />
      <VariantReference />

      <SectionHeader title="Item options" note="Per-crumb flags compose freely." />
      <ItemReference />

      <SectionHeader title="With dropdown" note="The active crumb becomes a brand-tinted menu trigger." />
      <WithDropdownExample />

      <SectionHeader title="With group buttons" note="Back / forward history navigation prepended to the trail." />
      <WithGroupButtonsExample />

      <SectionHeader title="Only buttons" note="Every crumb is an interactive pill — useful for context switchers." />
      <OnlyButtonsExample />

      <SectionHeader title="With badge" note="Append metadata (status, type, count) inline with a crumb." />
      <WithBadgeExample />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable rows={PROPS_TABLE} />

      <SectionHeader title="BreadcrumbItem" note="Shape of each entry in the items array." />
      <PropsTable rows={ITEM_PROPS_TABLE} />
    </div>
  );
}
