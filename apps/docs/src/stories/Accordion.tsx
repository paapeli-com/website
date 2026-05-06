import React, { useState } from 'react';
import {
  Accordion,
  Icon,
  type AccordionChevronPosition,
  type AccordionItemDef,
  type AccordionVariant,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND     = '#803c00';
const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';

// ─── Sample data ──────────────────────────────────────────────────────────────

const BASE_ITEMS: AccordionItemDef[] = [
  {
    id: '1',
    title: 'Can I use Flowbite in open-source projects?',
    icon: <Icon name="question-circle" style={{ fontSize: 20, color: '#1447e6' }} />,
    content: (
      <div>
        <p style={{ margin: '0 0 12px' }}>
          Generally, it is accepted to use Flowbite in open-source projects, as long as it is not a UI library,
          a theme, a template, or a page-builder that would be considered as an alternative to Flowbite itself.
        </p>
        <p style={{ margin: '0 0 12px' }}>
          With that being said, feel free to use this design kit for your open-source projects.
        </p>
        <p style={{ margin: 0 }}>
          Find out more information by{' '}
          <a href="#" style={{ color: '#1447e6' }}>reading the release.</a>
        </p>
      </div>
    ),
  },
  {
    id: '2',
    title: 'Can I contribute to the Flowbite project?',
    icon: <Icon name="question-circle" style={{ fontSize: 20, color: '#1447e6' }} />,
    content: 'Yes! Contributions are welcome. Please read the contributing guidelines before submitting a pull request.',
  },
  {
    id: '3',
    title: 'What are the main features of Flowbite?',
    icon: <Icon name="question-circle" style={{ fontSize: 20, color: '#1447e6' }} />,
    content: 'Flowbite includes a large set of UI components, Figma design files, and Tailwind CSS integration.',
  },
  {
    id: '4',
    title: 'Is Flowbite compatible with popular frontend frameworks?',
    icon: <Icon name="question-circle" style={{ fontSize: 20, color: '#1447e6' }} />,
    content: 'Yes, Flowbite works with React, Vue, Svelte, Angular, and more.',
  },
  {
    id: '5',
    title: 'Does Flowbite offer pre-built components?',
    icon: <Icon name="question-circle" style={{ fontSize: 20, color: '#1447e6' }} />,
    content: 'Yes, over 400 UI components are available out of the box.',
  },
];

const SUB_HEADER_ITEMS: AccordionItemDef[] = [
  {
    id: 'sh-1',
    title: 'Introduction to Flowbite',
    subTitle: 'What is the Flowbite library?',
    icon: <Icon name="book" style={{ fontSize: 20, color: '#4a5565' }} />,
    content: 'Flowbite is an open-source UI component library built with Tailwind CSS utility classes.',
  },
  {
    id: 'sh-2',
    title: 'Installation and Setup',
    subTitle: 'How can I install Flowbite in my project?',
    icon: <Icon name="cog" style={{ fontSize: 20, color: '#4a5565' }} />,
    content: 'Install via npm: npm install flowbite, then add the plugin to your Tailwind config.',
  },
  {
    id: 'sh-3',
    title: 'Compatibility and Frameworks',
    subTitle: 'Which frameworks are compatible with Flowbite?',
    icon: <Icon name="code" style={{ fontSize: 20, color: '#4a5565' }} />,
    content: 'Flowbite is compatible with React, Vue, Svelte, Angular, Laravel, and more.',
  },
  {
    id: 'sh-4',
    title: 'Component Library',
    subTitle: 'What types of components are available?',
    icon: <Icon name="grid" style={{ fontSize: 20, color: '#4a5565' }} />,
    content: 'Buttons, modals, dropdowns, forms, tables, navigation, and over 400 more components.',
  },
];

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Accordion
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Collapsible content sections from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Three layout variants, optional icons, sub-headers, and multi-open support.
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

// ─── Variant sections ─────────────────────────────────────────────────────────

function VariantsSection() {
  const variants: { key: AccordionVariant; label: string; note: string }[] = [
    { key: 'default',        label: 'Default',        note: 'Single bordered container, divider between items.' },
    { key: 'flush',          label: 'Flush',          note: 'No container border — items separated by divider lines only.' },
    { key: 'separate-cards', label: 'Separate Cards', note: 'Each item is its own elevated card.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {variants.map(({ key, label, note }) => (
        <div key={key}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: BRAND_MID, background: BRAND_BG, border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '2px 6px' }}>
              variant="{key}"
            </span>
            <span style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginLeft: 8 }}>{note}</span>
          </div>
          <Accordion
            variant={key}
            defaultOpen={['1']}
            items={BASE_ITEMS.slice(0, 4)}
          />
        </div>
      ))}
    </div>
  );
}

function SubHeaderSection() {
  return (
    <Accordion
      variant="default"
      defaultOpen={['sh-1']}
      items={SUB_HEADER_ITEMS}
    />
  );
}

function MultiLevelSection() {
  const nestedItems: AccordionItemDef[] = [
    { id: 'ml-a', title: 'How to install Flowbite for my Next.js project?', content: 'Run npx create-flowbite-app in your Next.js project directory and follow the prompts.' },
    {
      id: 'ml-b',
      title: 'How to install Flowbite for my React project?',
      content: (
        <div>
          <p style={{ margin: '0 0 12px' }}>
            Generally, it is accepted to use Flowbite in open-source projects, as long as it is not a UI library,
            a theme, a template, or a page-builder that would be considered as an alternative to Flowbite itself.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            With that being said, feel free to use this design kit for your open-source projects.
          </p>
          <p style={{ margin: 0 }}>
            Find out more information by{' '}
            <a href="#" style={{ color: '#1447e6' }}>reading the release.</a>
          </p>
        </div>
      ),
    },
  ];

  const outerItems: AccordionItemDef[] = [
    {
      id: 'ml-outer-1',
      title: 'Is Flowbite compatible with popular frontend frameworks?',
      icon: <Icon name="question-circle" style={{ fontSize: 20, color: '#4a5565' }} />,
      content: (
        <Accordion
          variant="flush"
          chevronPosition="left"
          defaultOpen={['ml-b']}
          items={nestedItems}
        />
      ),
    },
    {
      id: 'ml-outer-2',
      title: 'How does Flowbite differ from other UI libraries?',
      icon: <Icon name="question-circle" style={{ fontSize: 20, color: '#4a5565' }} />,
      content: 'Flowbite focuses on Tailwind-first composable components and ships full Figma source files for designers.',
    },
    {
      id: 'ml-outer-3',
      title: 'Can I use Flowbite for commercial purposes?',
      icon: <Icon name="question-circle" style={{ fontSize: 20, color: '#4a5565' }} />,
      content: 'Yes, the Flowbite license permits commercial use.',
    },
  ];

  return (
    <Accordion
      variant="default"
      defaultOpen={['ml-outer-1']}
      items={outerItems}
    />
  );
}

function MultipleSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: BRAND_MID, background: BRAND_BG, border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '2px 6px' }}>multiple=false</span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginLeft: 8 }}>Opening one item closes the previous (default).</span>
        </div>
        <Accordion variant="default" items={BASE_ITEMS.slice(0, 4)} defaultOpen={['1']} />
      </div>
      <div>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: BRAND_MID, background: BRAND_BG, border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '2px 6px' }}>multiple=true</span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)', marginLeft: 8 }}>Any number of items can be open at once.</span>
        </div>
        <Accordion variant="default" multiple items={BASE_ITEMS.slice(0, 4)} defaultOpen={['1', '3']} />
      </div>
    </div>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

const VARIANTS: AccordionVariant[] = ['default', 'flush', 'separate-cards'];
const CHEVRON_POSITIONS: AccordionChevronPosition[] = ['right', 'left'];

function Playground() {
  const [variant, setVariant] = useState<AccordionVariant>('default');
  const [chevronPos, setChevronPos] = useState<AccordionChevronPosition>('right');
  const [multiple, setMultiple] = useState(false);
  const [showIcons, setShowIcons] = useState(true);
  const [showSubTitle, setShowSubTitle] = useState(false);

  const items: AccordionItemDef[] = BASE_ITEMS.slice(0, 4).map((item) => ({
    ...item,
    icon: showIcons ? item.icon : undefined,
    subTitle: showSubTitle ? 'A helpful subtitle line below the title' : undefined,
  }));

  const codeProps = [
    `variant="${variant}"`,
    chevronPos !== 'right' && `chevronPosition="${chevronPos}"`,
    multiple && 'multiple',
  ].filter(Boolean).join('\n  ');

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="variant">
            <Segmented value={variant} options={VARIANTS} onChange={setVariant} />
          </ControlGroup>
          <ControlGroup label="chevronPosition">
            <Segmented value={chevronPos} options={CHEVRON_POSITIONS} onChange={setChevronPos} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="multiple" value={multiple} onChange={setMultiple} />
              <Toggle label="icons" value={showIcons} onChange={setShowIcons} />
              <Toggle label="sub-title" value={showSubTitle} onChange={setShowSubTitle} />
            </div>
          </ControlGroup>
          <div style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', whiteSpace: 'pre-wrap',
          }}>
            {`<Accordion\n  ${codeProps}\n  items={items}\n/>`}
          </div>
        </div>

        {/* Preview */}
        <div>
          <Accordion
            key={`${variant}-${chevronPos}-${multiple}`}
            variant={variant}
            chevronPosition={chevronPos}
            multiple={multiple}
            defaultOpen={['1']}
            items={items}
          />
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
              padding: '6px 10px', fontFamily: MONO, fontSize: 11,
              border: 'none', borderRight: '1px solid var(--docs-border)',
              background: active ? BRAND : 'var(--docs-panel-bg)',
              color: active ? '#fff' : 'var(--docs-text)',
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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        padding: '6px 10px', fontFamily: MONO, fontSize: 11,
        border: `1px solid ${value ? BRAND_MID : 'var(--docs-border)'}`,
        background: value ? BRAND_BG : 'var(--docs-panel-bg)',
        color: value ? BRAND_MID : 'var(--docs-text)',
        borderRadius: 6, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// ─── Props table ──────────────────────────────────────────────────────────────

const ACCORDION_PROPS: { name: string; type: string; default: string; description: string }[] = [
  { name: 'items',           type: 'AccordionItemDef[]',                       default: '—',         description: 'Array of accordion items to render.' },
  { name: 'variant',         type: '"default" | "flush" | "separate-cards"',   default: '"default"', description: 'Layout style of the accordion.' },
  { name: 'chevronPosition', type: '"left" | "right"',                         default: '"right"',   description: 'Side of the trigger where the chevron renders. Use "left" for nested / multi-level rows.' },
  { name: 'multiple',        type: 'boolean',                                  default: 'false',     description: 'When true, multiple items can be open simultaneously.' },
  { name: 'defaultOpen',     type: 'string[]',                                 default: '[]',        description: 'IDs of items that start open on first render.' },
  { name: 'className',       type: 'string',                                   default: '—',         description: 'Additional class applied to the root element.' },
  { name: 'style',           type: 'CSSProperties',                            default: '—',         description: 'Inline styles on the root element.' },
];

const ITEM_PROPS: { name: string; type: string; default: string; description: string }[] = [
  { name: 'id',       type: 'string',    default: '—', description: 'Unique identifier. Used for open state tracking and ARIA attributes.' },
  { name: 'title',    type: 'ReactNode', default: '—', description: 'Header label text.' },
  { name: 'subTitle', type: 'ReactNode', default: '—', description: 'Optional secondary line shown below the title.' },
  { name: 'icon',     type: 'ReactNode', default: '—', description: 'Optional leading icon. Any ReactNode — pass an <Icon> or SVG.' },
  { name: 'content',  type: 'ReactNode', default: '—', description: 'Panel body content shown when the item is open.' },
];

function PropsTable({ rows }: { rows: typeof ACCORDION_PROPS }) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--docs-border)', background: 'var(--docs-panel-bg)', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px 2fr' }}>
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
            <Cell first last={i === rows.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>{row.name}</code>
            </Cell>
            <Cell last={i === rows.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.type}</code>
            </Cell>
            <Cell last={i === rows.length - 1}>
              <code style={{ fontFamily: MONO, fontSize: 11, color: 'var(--docs-text-muted)' }}>{row.default}</code>
            </Cell>
            <Cell last={i === rows.length - 1}>
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

export function AccordionGallery() {
  return (
    <div style={{ padding: '36px 40px', background: 'var(--docs-page-bg)', minHeight: '100vh', fontFamily: FONT }}>
      <PageHeader />

      <SectionHeader title="Variants" note="All three layout styles with the first item open." />
      <VariantsSection />

      <SectionHeader title="With sub-header" note="Each item shows a secondary subtitle line beneath the title." />
      <SubHeaderSection />

      <SectionHeader title="Multi-level" note="Nest an Accordion with chevronPosition='left' inside another item's content." />
      <MultiLevelSection />

      <SectionHeader title="Multiple open" note="Control whether one or many items can be expanded simultaneously." />
      <MultipleSection />

      <SectionHeader title="Playground" note="Toggle variant and modifiers to see live output." />
      <Playground />

      <SectionHeader title="Accordion props" />
      <PropsTable rows={ACCORDION_PROPS} />

      <SectionHeader title="AccordionItemDef props" />
      <PropsTable rows={ITEM_PROPS} />
    </div>
  );
}
