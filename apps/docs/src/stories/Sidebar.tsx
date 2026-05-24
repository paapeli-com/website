import React, { useState } from 'react';
import {
  Badge,
  Button,
  Icon,
  Sidebar,
  type SidebarItem,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Inline icons (lightweight set used by the demo items) ───────────────────

const ic = (path: React.ReactNode) => () =>
  (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {path}
    </svg>
  );

const HomeIcon       = ic(<path d="M3.5 9l6.5-5 6.5 5V16a1 1 0 0 1-1 1h-3v-5h-5v5h-3a1 1 0 0 1-1-1V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />);
const PagesIcon      = ic(<><rect x="4.5" y="3" width="11" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M7.5 7h5M7.5 10h5M7.5 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>);
const BagIcon        = ic(<><path d="M5 7h10l-.7 9.2a1 1 0 0 1-1 .8h-6.6a1 1 0 0 1-1-.8L5 7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M7.5 7V5a2.5 2.5 0 1 1 5 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>);
const ChatIcon       = ic(<path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h10a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 15 13H8.5L5 16.5V13a1.5 1.5 0 0 1-1.5-1.5v-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />);
const UsersIcon      = ic(<><circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="14" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M3 16c0-2.5 2-4 4.5-4S12 13.5 12 16M12.5 16c0-1.7 1.2-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>);
const SupportIcon    = ic(<><circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5.7 5.7l2 2M12.3 12.3l2 2M14.3 5.7l-2 2M7.7 12.3l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>);
const DocsIcon       = ic(<><path d="M5 4h7l3 3v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 4v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></>);
const ComponentsIcon = ic(<><rect x="3.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="10.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="3.5" y="10.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="10.5" y="10.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /></>);
const HelpIcon       = ic(<><circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 8a2 2 0 1 1 2.5 2c-.5.2-.5.7-.5 1M10 14h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>);

const InfoIcon       = ic(<><circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10 9v4M10 6.5h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>);

// ─── Demo data ───────────────────────────────────────────────────────────────

const MENU_ITEMS: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: <HomeIcon />, items: [
    { id: 'overview-dashboard', label: 'Dashboard', href: '#' },
    { id: 'overview-analytics', label: 'Analytics',  href: '#' },
  ] },
  { id: 'pages', label: 'Pages', icon: <PagesIcon />, items: [
    { id: 'pages-landing', label: 'Landing',  href: '#' },
    { id: 'pages-pricing', label: 'Pricing',  href: '#' },
  ] },
  {
    id: 'ecommerce',
    label: 'Ecommerce',
    icon: <BagIcon />,
    defaultOpen: true,
    items: [
      { id: 'ec-products',     label: 'All products',  href: '#' },
      { id: 'ec-billing',      label: 'Billing',       href: '#' },
      { id: 'ec-invoice',      label: 'Invoice',       href: '#' },
      { id: 'ec-transactions', label: 'Transactions',  href: '#' },
    ],
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <ChatIcon />,
    href: '#',
    badge: <Badge color="danger" size="sm" type="default" icon={false}>4</Badge>,
  },
  { id: 'users',   label: 'Users',   icon: <UsersIcon />, items: [
    { id: 'users-all',   label: 'All users', href: '#' },
    { id: 'users-roles', label: 'Roles',     href: '#' },
  ] },
  { id: 'support', label: 'Support', icon: <SupportIcon />, items: [
    { id: 'support-tickets', label: 'Tickets', href: '#' },
    { id: 'support-faq',     label: 'FAQ',     href: '#' },
  ] },
];

const FOOTER_ITEMS: SidebarItem[] = [
  { id: 'docs',       label: 'Docs',       icon: <DocsIcon />,       href: '#' },
  { id: 'components', label: 'Components', icon: <ComponentsIcon />, href: '#' },
  { id: 'help',       label: 'Help',       icon: <HelpIcon />,       href: '#' },
];

// ─── Brand / profile bits ────────────────────────────────────────────────────

function BrandHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: 24, height: 24, borderRadius: 6, background: '#ff7900',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 14,
      }}>
        P
      </span>
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 16, color: '#101828' }}>
        Paapeli
      </span>
    </div>
  );
}

function ProfileHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 4px',
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 9999, background: '#fff3eb', color: '#aa4f00',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontWeight: 600, fontSize: 14,
      }}>
        JL
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#101828' }}>
          Jese Leos
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: '#6a7282', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          name@paapeli.com
        </div>
      </div>
      <Icon name="chevron-up" style={{ fontSize: 14, color: '#6a7282' }} />
    </div>
  );
}

function InfoCard() {
  return (
    <div style={{
      padding: 12,
      background: '#eff6ff',
      border: '1px solid #bedbff',
      borderRadius: 12,
      fontFamily: FONT,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <span style={{ color: '#1c398e', flexShrink: 0 }}><InfoIcon /></span>
        <strong style={{ flex: 1, fontSize: 13, color: '#1c398e' }}>New dashboard!</strong>
        <button style={{
          border: 0, background: 'transparent', cursor: 'pointer', padding: 0, color: '#1c398e',
          lineHeight: 0,
        }} aria-label="Dismiss">
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#1c398e', lineHeight: 1.5 }}>
        Preview the new paapeli dashboard navigation! You can turn the new
        navigation off for a limited time in your profile.
      </p>
      <Button size="sm" color="info">Check it out →</Button>
    </div>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Sidebar
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Vertical navigation from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Pass an <code style={{ fontFamily: MONO, fontSize: 12 }}>items</code> array — leaf items render as links/buttons, items with nested
        {' '}<code style={{ fontFamily: MONO, fontSize: 12 }}>items</code> render as collapsible groups.
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

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid var(--docs-border)',
      borderRadius: 12,
      background: '#fff',
      overflow: 'hidden',
      height: 720,
      display: 'flex',
    }}>
      {children}
    </div>
  );
}

// ─── Variants ────────────────────────────────────────────────────────────────

function VariantDefault() {
  const [active, setActive] = useState('ec-products');
  return (
    <Frame>
      <Sidebar
        header={<BrandHeader />}
        items={MENU_ITEMS}
        footerItems={FOOTER_ITEMS}
        footer={<InfoCard />}
        activeId={active}
        onItemClick={(id) => setActive(id)}
      />
    </Frame>
  );
}

function VariantWithProfile() {
  const [active, setActive] = useState('ec-products');
  return (
    <Frame>
      <Sidebar
        header={<ProfileHeader />}
        items={MENU_ITEMS}
        footer={
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Icon name="settings" style={{ fontSize: 18, color: '#6a7282' }} />
            <span style={{
              width: 20, height: 20, borderRadius: 9999, background: '#fff3eb',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#ff7900', fontFamily: FONT, fontSize: 11, fontWeight: 700,
            }}>P</span>
            <Icon name="adjust" style={{ fontSize: 18, color: '#6a7282' }} />
          </div>
        }
        activeId={active}
        onItemClick={(id) => setActive(id)}
      />
    </Frame>
  );
}

function VariantCollapsed() {
  const [active, setActive] = useState('messages');
  return (
    <Frame>
      <Sidebar
        collapsed
        header={
          <span style={{
            width: 28, height: 28, borderRadius: 6, background: '#ff7900',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 14,
          }}>P</span>
        }
        items={MENU_ITEMS}
        footerItems={FOOTER_ITEMS}
        activeId={active}
        onItemClick={(id) => setActive(id)}
      />
    </Frame>
  );
}

function VariantInteractive() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState('ec-products');

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Button
          size="sm"
          color="secondary"
          outline
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? 'Expand sidebar →' : '← Collapse sidebar'}
        </Button>
      </div>
      <Frame>
        <Sidebar
          collapsed={collapsed}
          header={collapsed ? (
            <span style={{
              width: 28, height: 28, borderRadius: 6, background: '#ff7900',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 14,
            }}>P</span>
          ) : (
            <BrandHeader />
          )}
          items={MENU_ITEMS}
          footerItems={FOOTER_ITEMS}
          activeId={active}
          onItemClick={(id) => setActive(id)}
        />
        <div style={{ flex: 1, padding: 32, fontFamily: FONT }}>
          <div style={{ fontSize: 11, color: 'var(--docs-text-muted)', marginBottom: 6 }}>
            Active item id
          </div>
          <code style={{
            fontFamily: MONO, fontSize: 13, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', padding: '4px 8px', borderRadius: 4,
            border: '1px solid var(--docs-border)',
          }}>
            {active}
          </code>
        </div>
      </Frame>
    </div>
  );
}

// ─── Items API reference ─────────────────────────────────────────────────────

const ITEMS_API_CODE = `const items: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, href: '/' },
  {
    id: 'ecommerce',
    label: 'Ecommerce',
    icon: <BagIcon />,
    defaultOpen: true,
    items: [
      { id: 'products', label: 'All products', href: '/products' },
      { id: 'billing',  label: 'Billing',      href: '/billing' },
    ],
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <ChatIcon />,
    href: '/messages',
    badge: <Badge color="danger" size="sm">4</Badge>,
  },
];

<Sidebar
  items={items}
  activeId={active}
  onItemClick={(id) => setActive(id)}
/>`;

function ItemsApi() {
  return (
    <div style={{
      borderRadius: 10,
      border: '1px solid var(--docs-border)',
      background: 'var(--docs-panel-bg)',
      padding: 24,
    }}>
      <pre style={{
        fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
        margin: 0, whiteSpace: 'pre',
        background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
        borderRadius: 8, padding: 16, overflow: 'auto',
      }}>
        {ITEMS_API_CODE}
      </pre>
    </div>
  );
}

// ─── Props tables ────────────────────────────────────────────────────────────

const SIDEBAR_PROPS = [
  { name: 'items',           type: 'SidebarItem[]',     default: '—',         description: 'Main menu items.' },
  { name: 'footerItems',     type: 'SidebarItem[]',     default: '—',         description: 'Secondary list rendered below a horizontal divider.' },
  { name: 'header',          type: 'ReactNode',         default: '—',         description: 'Top slot — brand logo, profile, etc.' },
  { name: 'footer',          type: 'ReactNode',         default: '—',         description: 'Bottom slot — info card, settings row.' },
  { name: 'activeId',        type: 'string',            default: '—',         description: 'Controlled active item id.' },
  { name: 'defaultActiveId', type: 'string',            default: '—',         description: 'Initial active id (uncontrolled).' },
  { name: 'onItemClick',     type: '(id, item) => void',default: '—',         description: 'Fires when a leaf item is clicked. Group toggles do not fire this.' },
  { name: 'collapsed',       type: 'boolean',           default: 'false',     description: 'Icon-only mode. Hides labels, badges, and chevrons.' },
  { name: 'width',           type: 'number · string',   default: '288',       description: 'Width when expanded.' },
  { name: 'collapsedWidth',  type: 'number · string',   default: '64',        description: 'Width when collapsed.' },
  { name: 'ariaLabel',       type: 'string',            default: 'Sidebar',   description: 'Accessible name for the <nav>.' },
];

const ITEM_PROPS = [
  { name: 'id',           type: 'string',          default: '—',     description: 'Stable id — used as the React key and as the active id.' },
  { name: 'label',        type: 'ReactNode',       default: '—',     description: 'Visible label.' },
  { name: 'icon',         type: 'ReactNode',       default: '—',     description: 'Leading icon.' },
  { name: 'href',         type: 'string',          default: '—',     description: 'Renders the leaf item as an `<a>`. Ignored when `items` is set.' },
  { name: 'onClick',      type: '(e) => void',     default: '—',     description: 'Click handler — fires alongside `onItemClick` for leaves and toggles for groups.' },
  { name: 'active',       type: 'boolean',         default: 'auto',  description: 'Force the active style. Defaults to `id === activeId`.' },
  { name: 'disabled',     type: 'boolean',         default: 'false', description: 'Disables clicks and dims the row.' },
  { name: 'badge',        type: 'ReactNode',       default: '—',     description: 'Right-aligned slot — typically a <Badge>.' },
  { name: 'items',        type: 'SidebarItem[]',   default: '—',     description: 'Nested items — renders as a collapsible group.' },
  { name: 'defaultOpen',  type: 'boolean',         default: 'auto',  description: 'Initial open state for groups. Auto-opens when a descendant is active.' },
];

function PropsTable({ rows, title }: { rows: typeof SIDEBAR_PROPS; title?: string }) {
  return (
    <div>
      {title && (
        <div style={{
          fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          {title}
        </div>
      )}
      <div style={{
        borderRadius: 10,
        border: '1px solid var(--docs-border)',
        background: 'var(--docs-panel-bg)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr 130px 2fr' }}>
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
              <RowCell first last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code></RowCell>
              <RowCell last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code></RowCell>
              <RowCell last={i === rows.length - 1}><code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code></RowCell>
              <RowCell last={i === rows.length - 1}>
                <span style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>{row.description}</span>
              </RowCell>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
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

export function SidebarGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Default" note="Brand header, expandable groups, badge counts, footer items, and a custom info-card slot at the bottom." />
      <VariantDefault />

      <SectionHeader title="With profile" note="Header slot replaced with a user profile row." />
      <VariantWithProfile />

      <SectionHeader title="Collapsed" note="Icon-only mode — labels, badges, and group sub-lists are hidden." />
      <VariantCollapsed />

      <SectionHeader title="Toggleable" note="Live example — collapse / expand, with controlled active state shown to the right." />
      <VariantInteractive />

      <SectionHeader title="Items API" note="A flat array drives the entire menu. Nested items become collapsible groups." />
      <ItemsApi />

      <SectionHeader title="Props" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <PropsTable rows={SIDEBAR_PROPS} title="Sidebar" />
        <PropsTable rows={ITEM_PROPS}    title="SidebarItem" />
      </div>
    </div>
  );
}
