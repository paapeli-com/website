import React, { useEffect, useState } from 'react';
import {
  Button,
  Toast,
  type ToastColor,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

// ─── Inline icons (lightweight set used by the demo) ─────────────────────────

const ic = (path: React.ReactNode) => () =>
  (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {path}
    </svg>
  );

const CheckIcon    = ic(<path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />);
const PaperPlane   = ic(<path d="M3 10l14-6-6 14-2-6-6-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />);
const RefreshIcon  = ic(<><path d="M4 8a6 6 0 019.9-2.5M16 12a6 6 0 01-9.9 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M14 4v3.5h-3.5M6 16v-3.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>);
const CloudUpload  = ic(<><path d="M4.5 13a3.5 3.5 0 011-6.9 5 5 0 019.9 1.4 3 3 0 010 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M10 9v7M7.5 11.5L10 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>);
const UploadIcon   = ic(<><path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M10 13V3M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>);
const InfoIcon     = ic(<><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 9v4M10 6.5h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>);
const ReplyIcon    = ic(<path d="M9 6L4 10l5 4M4 10h7a4 4 0 014 4v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />);

// ─── Sample illustration (wallet) ────────────────────────────────────────────

const WalletIllustration = () => (
  <svg width={88} height={88} viewBox="0 0 88 88" fill="none" aria-hidden="true">
    <rect x="14" y="14" width="60" height="68" rx="6" fill="#eff6ff" stroke="#bedbff" strokeWidth="1.5" />
    <rect x="22" y="22" width="44" height="14" rx="2" fill="#dbeafe" />
    <rect x="22" y="40" width="32" height="6" rx="2" fill="#dbeafe" />
    <rect x="22" y="50" width="44" height="6" rx="2" fill="#dbeafe" />
    <rect x="22" y="60" width="28" height="6" rx="2" fill="#dbeafe" />
    <circle cx="68" cy="22" r="14" fill="#dbeafe" stroke="#1447e6" strokeWidth="1.5" />
    <path d="M62 22l4 4 8-8" stroke="#1447e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AvatarPlaceholder = () => (
  <svg width={40} height={40} viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" fill="#fde2e2" />
    <circle cx="20" cy="16" r="6" fill="#f59e9e" />
    <path d="M8 36c0-6 5-10 12-10s12 4 12 10" fill="#f59e9e" />
  </svg>
);

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Toast
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Notification card from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Compose any of the 10 Figma variants by mixing the slots — header, icon /
        avatar / illustration, title, description, meta, actions, progress, close.
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

function Frame({ tag, dim, width, children }: { tag: string; dim?: string; width?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: MONO, fontSize: 10, color: BRAND_MID, background: BRAND_BG,
          border: `1px solid ${BRAND_MID}`, borderRadius: 4, padding: '1px 5px',
        }}>
          {tag}
        </span>
        {dim && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--docs-text-muted)' }}>
            {dim}
          </span>
        )}
      </div>
      <div style={{ width: width ? `${width}px` : '100%', maxWidth: '100%' }}>
        {children}
      </div>
    </div>
  );
}

// ─── 10 Figma variants ───────────────────────────────────────────────────────

function FigmaVariants() {
  const [progress, setProgress] = useState(75);
  // Mild auto-progress so the bar feels alive in the docs
  useEffect(() => {
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 1)), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <Panel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
      }}>
        <Frame tag="avatar & button" dim="380 × 144" width={380}>
          <Toast
            avatar={<AvatarPlaceholder />}
            title="Bonnie Green"
            actions={<Button color="brand" size="sm" withIcon><ReplyIcon />Reply</Button>}
            onClose={() => undefined}
          >
            "Hi Bonnie, I appreciate you sharing your insights on paapeli."
          </Toast>
        </Frame>

        <Frame tag="icon shape & text" dim="309 × 68" width={309}>
          <Toast
            icon={<CheckIcon />}
            iconShape
            iconColor="success"
            onClose={() => undefined}
          >
            Notification message here!
          </Toast>
        </Frame>

        <Frame tag="icon & text" dim="309 × 64" width={309}>
          <Toast
            icon={<PaperPlane />}
            iconDivider
            onClose={() => undefined}
          >
            Message sent successfully.
          </Toast>
        </Frame>

        <Frame tag="with header" dim="320 × 193" width={320}>
          <Toast
            header="New notification"
            avatar={<AvatarPlaceholder />}
            title="Bonnie Green"
            meta="a few seconds ago"
            actions={
              <>
                <Button color="secondary" outline size="sm">Close</Button>
                <Button color="brand" size="sm" withIcon><ReplyIcon />Reply</Button>
              </>
            }
          >
            commented on your photo
          </Toast>
        </Frame>

        <Frame tag="icon shape & buttons" dim="320 × 152" width={320}>
          <Toast
            icon={<RefreshIcon />}
            iconShape
            title="Update available"
            actions={
              <>
                <Button color="secondary" outline size="sm">Not now</Button>
                <Button color="brand" size="sm" withIcon><UploadIcon />Update</Button>
              </>
            }
            onClose={() => undefined}
          >
            The latest software version is now accessible for download.
          </Toast>
        </Frame>

        <Frame tag="with illustration" dim="384 × 152" width={384}>
          <Toast
            illustration={<WalletIllustration />}
            title="Connect your wallet"
            actions={
              <>
                <Button color="secondary" outline size="sm">Close</Button>
                <Button color="brand" size="sm">Connect</Button>
              </>
            }
          >
            Connect your wallet by clicking the bottom-right blue button.
          </Toast>
        </Frame>

        <Frame tag="with progress bar" dim="320 × 234" width={320}>
          <Toast
            icon={<CloudUpload />}
            iconShape
            title="Uploading in progress"
            progress={progress}
            actions={
              <>
                <Button color="secondary" outline size="sm">Cancel</Button>
                <Button color="brand" size="sm">Go to uploads</Button>
              </>
            }
            onClose={() => undefined}
          >
            Please wait while your file is being uploaded. This may take a moment.
          </Toast>
        </Frame>

        <Frame tag="warning" dim="640 × 150" width={620}>
          <Toast
            color="warning"
            icon={<InfoIcon />}
            title="Upload your invoice"
            actions={
              <>
                <Button color="warning" outline size="sm">Remind me later</Button>
                <Button color="warning" size="sm" withIcon><UploadIcon />Upload invoice</Button>
              </>
            }
            onClose={() => undefined}
          >
            Upload your invoice in one of the supported formats (PDF, JPG, PNG) with a maximum
            file size of <strong>5MB</strong>. Ensure that all relevant details are visible for
            verification.
          </Toast>
        </Frame>

        <Frame tag="error" dim="384 × 150" width={384}>
          <Toast
            color="danger"
            icon={<InfoIcon />}
            title="Whoops! Something went wrong"
            actions={
              <>
                <Button color="danger" outline size="sm">Close</Button>
                <Button color="danger" size="sm" withIcon><RefreshIcon />Try again</Button>
              </>
            }
            onClose={() => undefined}
          >
            The file format is not supported. Please upload a valid file type (PDF, JPG, PNG).
          </Toast>
        </Frame>

        <Frame tag="info" dim="384 × 150" width={384}>
          <Toast
            color="info"
            icon={<InfoIcon />}
            title="Whoops! Something went wrong"
            actions={
              <>
                <Button color="info" outline size="sm">Close</Button>
                <Button color="info" size="sm" withIcon><RefreshIcon />Try again</Button>
              </>
            }
            onClose={() => undefined}
          >
            The file format is not supported. Please upload a valid file type (PDF, JPG, PNG).
          </Toast>
        </Frame>
      </div>
    </Panel>
  );
}

// ─── Color themes ────────────────────────────────────────────────────────────

const COLORS: ToastColor[] = ['default', 'brand', 'success', 'warning', 'danger', 'info'];

function ColorThemes() {
  return (
    <Panel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 24,
      }}>
        {COLORS.map((c) => (
          <Frame key={c} tag={`color="${c}"`}>
            <Toast
              color={c}
              icon={<InfoIcon />}
              iconShape
              title={`${c[0]?.toUpperCase()}${c.slice(1)} toast`}
              onClose={() => undefined}
            >
              The toast inherits its background, border, title, and icon-shape from this color theme.
            </Toast>
          </Frame>
        ))}
      </div>
    </Panel>
  );
}

// ─── Live "trigger toast" demo ───────────────────────────────────────────────

type Notice = {
  id: number;
  color: ToastColor;
  title: string;
  body: string;
};

function LiveDemo() {
  const [items, setItems] = useState<Notice[]>([]);

  const push = (color: ToastColor) => {
    const id = Date.now() + Math.random();
    const presets: Record<ToastColor, { title: string; body: string }> = {
      default: { title: 'Saved',           body: 'Your changes were stored locally.' },
      brand:   { title: 'Heads up',        body: 'A new beta channel is available.' },
      success: { title: 'Upload complete', body: 'Your file is now live.' },
      warning: { title: 'Disk almost full',body: 'You have 5% of your quota remaining.' },
      danger:  { title: 'Update failed',   body: 'Couldn\'t reach the server. Try again.' },
      info:    { title: 'Tip',             body: 'You can drag a file onto this card.' },
    };
    setItems((prev) => [...prev, { id, color, ...presets[color] }]);
    // auto-dismiss after 4s
    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  };

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => push(c)}
              style={{
                padding: '6px 10px',
                fontFamily: MONO, fontSize: 11,
                border: `1px solid ${BRAND_MID}`,
                background: BRAND_BG, color: BRAND_MID,
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              push "{c}"
            </button>
          ))}
        </div>

        <div style={{
          minHeight: 240,
          padding: 16,
          background: 'repeating-linear-gradient(45deg, var(--docs-page-bg), var(--docs-page-bg) 6px, transparent 6px, transparent 12px)',
          borderRadius: 10,
          border: '1px dashed var(--docs-border)',
          display: 'flex', flexDirection: 'column', gap: 12,
          alignItems: 'flex-end',
        }}>
          {items.length === 0 && (
            <span style={{
              fontFamily: FONT, fontSize: 12, color: 'var(--docs-text-muted)',
              alignSelf: 'center', margin: 'auto',
            }}>
              click a button above
            </span>
          )}
          {items.map((n) => (
            <div key={n.id} style={{ width: '100%', maxWidth: 380 }}>
              <Toast
                color={n.color}
                icon={<InfoIcon />}
                iconShape
                title={n.title}
                onClose={() => setItems((prev) => prev.filter((x) => x.id !== n.id))}
              >
                {n.body}
              </Toast>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

const PROPS_TABLE = [
  { name: 'title',          type: 'ReactNode',         default: '—',        description: 'Bold title.' },
  { name: 'children',       type: 'ReactNode',         default: '—',        description: 'Description / body.' },
  { name: 'color',          type: 'ToastColor',        default: 'default',  description: 'default · brand · success · warning · danger · info' },
  { name: 'icon',           type: 'ReactNode',         default: '—',        description: 'Leading icon.' },
  { name: 'iconShape',      type: 'boolean',           default: 'false',    description: 'Wrap the icon in a soft tinted square (36×36).' },
  { name: 'iconColor',      type: 'ToastColor',        default: 'auto',     description: 'Icon-shape color override (only relevant on default toasts).' },
  { name: 'iconDivider',    type: 'boolean',           default: 'false',    description: 'Render a 1px vertical rule between the icon and the content.' },
  { name: 'avatar',         type: 'ReactNode',         default: '—',        description: 'Avatar slot — typically a circular image.' },
  { name: 'illustration',   type: 'ReactNode',         default: '—',        description: 'Larger illustration slot (preferred over icon when set).' },
  { name: 'header',         type: 'ReactNode',         default: '—',        description: 'Header bar above the body — e.g. "New notification".' },
  { name: 'meta',           type: 'ReactNode',         default: '—',        description: 'Subtle metadata line under the description.' },
  { name: 'actions',        type: 'ReactNode',         default: '—',        description: 'Footer action buttons row.' },
  { name: 'progress',       type: 'number (0–100)',    default: '—',        description: 'Render a progress bar with this percentage.' },
  { name: 'onClose',        type: '() => void',        default: '—',        description: 'When set, renders the close (X) button.' },
  { name: 'closeAriaLabel', type: 'string',            default: 'Dismiss',  description: 'Accessible label for the close button.' },
  { name: 'role',           type: 'status · alert',    default: 'status',   description: 'Role on the wrapper. Use "alert" for urgent toasts.' },
  { name: 'ariaLive',       type: 'polite · assertive · off', default: 'polite', description: 'aria-live politeness on the wrapper.' },
];

function PropsTable() {
  return (
    <Panel padding={0}>
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

export function ToastGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Figma variants" note="Each of the 10 Figma frames composed from the same Toast slots." />
      <FigmaVariants />

      <SectionHeader title="Color themes" note="The `color` prop tints the bg, border, title, and icon-shape." />
      <ColorThemes />

      <SectionHeader title="Live triggers" note="Push toasts on demand — they auto-dismiss after 4s." />
      <LiveDemo />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
