import React, { useState } from 'react';
import {
  Alert,
  Button,
  type AlertColor,
  type AlertType,
} from '@paapeli/ui-kit';

// ─── Theme tokens (mirror BgColors.tsx for visual consistency) ───────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Reference data ──────────────────────────────────────────────────────────

const COLORS: AlertColor[] = ['success', 'danger', 'warning', 'info', 'default'];
const TYPES: AlertType[]   = ['default', 'complex', 'small', 'border-top'];

const COLOR_BUTTON: Record<AlertColor, 'success' | 'danger' | 'warning' | 'info' | 'dark'> = {
  success: 'success',
  danger:  'danger',
  warning: 'warning',
  info:    'info',
  default: 'dark',
};

const SAMPLE_TITLE = 'Alert heading';
const SAMPLE_LINE  = "Great job! You've acknowledged this significant alert message.";
const SAMPLE_BODY  = (
  <>
    {SAMPLE_LINE} We&apos;re adding extra text to illustrate how longer
    notifications are displayed. By doing this, you can see how text wrapping
    and spacing are managed.
  </>
);

// ─── Layout primitives ───────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Alert
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Inline notification surface from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Available in five semantic colors and four layout types.
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

function ColorRows({ type, dismissable }: { type: AlertType; dismissable?: boolean }) {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {COLORS.map((c) => {
          const onClose = dismissable ? () => undefined : undefined;

          if (type === 'complex') {
            return (
              <Alert
                key={c}
                type="complex"
                color={c}
                title={SAMPLE_TITLE}
                onClose={onClose}
                action={
                  <Button fluid color={COLOR_BUTTON[c]} size="sm">
                    Learn more
                  </Button>
                }
              >
                {SAMPLE_BODY}
              </Alert>
            );
          }

          if (type === 'small') {
            return (
              <Alert key={c} type="small" color={c} badge="New">
                {SAMPLE_LINE}
              </Alert>
            );
          }

          return (
            <Alert key={c} type={type} color={c} onClose={onClose}>
              {SAMPLE_LINE}
            </Alert>
          );
        })}
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
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>shape</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)', textTransform: 'uppercase' }}>description</div>

        <div><CodeChip label="default" /></div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>53px · rounded</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Single-line notification with leading icon and optional close button.
        </div>

        <div><CodeChip label="complex" /></div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>block · auto height</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Rich layout with heading, body copy, action slot and dismiss button.
        </div>

        <div><CodeChip label="small" /></div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>30px · pill</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Compact pill with leading badge and trailing chevron — for status banners.
        </div>

        <div><CodeChip label="border-top" /></div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)' }}>53px · top accent</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'var(--docs-text)' }}>
          Same as default with a 4px colored accent on top — for stacked rails.
        </div>
      </div>
    </Panel>
  );
}

function DismissibleDemo() {
  const [visible, setVisible] = useState(true);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible ? (
          <Alert
            type="complex"
            color="info"
            title="Dismissible alert"
            onClose={() => setVisible(false)}
            action={
              <>
                <Button fluid color="info" size="sm" onClick={() => setVisible(false)}>
                  Acknowledge
                </Button>
                <Button fluid color="info" outline size="sm" onClick={() => setVisible(false)}>
                  Cancel
                </Button>
              </>
            }
          >
            Pass an <code style={{ fontFamily: MONO, fontSize: 12 }}>onClose</code>{' '}
            handler to render a close button. The action slot takes any node — a
            single Button, two Buttons, or a custom element.
          </Alert>
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
            Restore alert
          </button>
        )}
      </div>
    </Panel>
  );
}

// ─── Interactive playground ──────────────────────────────────────────────────

function Playground() {
  const [color, setColor] = useState<AlertColor>('success');
  const [type, setType]   = useState<AlertType>('complex');
  const [dismissable, setDismissable] = useState(true);
  const [withAction, setWithAction]   = useState(true);
  const [withTitle, setWithTitle]     = useState(true);

  const codeProps = [
    `type="${type}"`,
    `color="${color}"`,
    type !== 'small' && withTitle && `title="Alert heading"`,
    type !== 'small' && dismissable && `onClose={fn}`,
    type === 'complex' && withAction && `action={<Button fluid>…</Button>}`,
    type === 'small' && `badge="New"`,
  ].filter(Boolean).join(' ');

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="type">
            <Segmented value={type} options={TYPES} onChange={setType} />
          </ControlGroup>
          <ControlGroup label="color">
            <Segmented value={color} options={COLORS} onChange={setColor} />
          </ControlGroup>
          <ControlGroup label="modifiers">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Toggle label="title"      value={withTitle}   onChange={setWithTitle}   disabled={type === 'small'} />
              <Toggle label="onClose"    value={dismissable} onChange={setDismissable} disabled={type === 'small'} />
              <Toggle label="action"     value={withAction}  onChange={setWithAction}  disabled={type !== 'complex'} />
            </div>
          </ControlGroup>
        </div>

        {/* Preview + code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8, padding: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120,
          }}>
            {type === 'complex' ? (
              <Alert
                color={color}
                type="complex"
                title={withTitle ? SAMPLE_TITLE : undefined}
                onClose={dismissable ? () => undefined : undefined}
                action={withAction ? <Button fluid color={COLOR_BUTTON[color]} size="sm">Learn more</Button> : undefined}
              >
                {SAMPLE_BODY}
              </Alert>
            ) : type === 'small' ? (
              <Alert color={color} type="small" badge="New">{SAMPLE_LINE}</Alert>
            ) : (
              <Alert
                color={color}
                type={type}
                title={withTitle ? 'Heads up.' : undefined}
                onClose={dismissable ? () => undefined : undefined}
              >
                {SAMPLE_LINE}
              </Alert>
            )}
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {`<Alert ${codeProps}>${type === 'complex' ? '\n  Long body text…\n' : ' Message '}</Alert>`}
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

// ─── Prop reference ──────────────────────────────────────────────────────────

const PROPS_TABLE: { name: string; type: string; default: string; description: string }[] = [
  { name: 'type',        type: 'default · complex · small · border-top',                default: 'default', description: 'Layout variant.' },
  { name: 'color',       type: 'success · danger · warning · info · default',            default: 'info',    description: 'Semantic color of the alert.' },
  { name: 'title',       type: 'ReactNode',                                              default: '—',       description: 'Heading shown in complex layout (optional).' },
  { name: 'children',    type: 'ReactNode',                                              default: '—',       description: 'Body content of the alert.' },
  { name: 'icon',        type: 'ReactNode | false',                                      default: 'info icon', description: 'Override the leading icon. Pass false to hide.' },
  { name: 'action',      type: 'ReactNode',                                              default: '—',       description: 'Action slot rendered below the body in complex.' },
  { name: 'badge',       type: 'ReactNode',                                              default: '—',       description: 'Pill badge shown by the small variant.' },
  { name: 'trailing',    type: 'ReactNode',                                              default: 'chevron',  description: 'Trailing element for the small variant.' },
  { name: 'onClose',     type: '() => void',                                             default: '—',       description: 'When set, renders a close button on the right.' },
  { name: 'closeAriaLabel', type: 'string',                                              default: 'Dismiss', description: 'Accessible label for the close button.' },
  { name: 'role',        type: 'alert · status · alertdialog',                           default: 'alert',   description: 'ARIA role applied to the root element.' },
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

export function AlertGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Types" note="The four layout variants supported by Alert." />
      <TypeReference />

      <SectionHeader title="Default" note="Single-line notification with leading icon and optional close." />
      <ColorRows type="default" dismissable />

      <SectionHeader title="Complex" note="Heading + body + action slot + close button." />
      <ColorRows type="complex" dismissable />

      <SectionHeader title="Small (pill)" note="Compact rail with badge and trailing chevron." />
      <ColorRows type="small" />

      <SectionHeader title="Border top" note="Stackable rails with a 4px colored top accent." />
      <ColorRows type="border-top" dismissable />

      <SectionHeader title="Dismissible" note="Live example — onClose unmounts the alert." />
      <DismissibleDemo />

      <SectionHeader title="Playground" note="Live preview with an editable prop set." />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
