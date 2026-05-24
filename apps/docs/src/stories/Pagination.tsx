import React, { useState } from 'react';
import {
  Pagination,
  type PaginationVariant,
} from '@paapeli/ui-kit';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const FONT = '"Poppins", "Inter", system-ui, sans-serif';
const MONO = '"Fira Mono", "Consolas", monospace';

const BRAND_BG  = '#fff3eb';
const BRAND_MID = '#aa4f00';
const BRAND     = '#803c00';

const VARIANTS: PaginationVariant[] = [
  'default',
  'text-buttons',
  'two-buttons',
  'helper-text',
  'arrows',
];

// ─── Layout primitives ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: 'var(--docs-text)', margin: '0 0 6px' }}>
        Pagination
      </h1>
      <p style={{ fontSize: 13, fontFamily: FONT, color: 'var(--docs-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Page navigator from{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>@paapeli/ui-kit</code>.
        {' '}Pass <code style={{ fontFamily: MONO, fontSize: 12 }}>currentPage</code>,{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>totalPages</code>, and{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>onPageChange</code> — pick a layout via{' '}
        <code style={{ fontFamily: MONO, fontSize: 12 }}>variant</code>.
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

function Row({ tag, dim, children }: { tag: string; dim?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
      <div>{children}</div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Variants() {
  const [page, setPage] = useState(3);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <Row tag="default" dim="chevrons + numbers">
          <Pagination
            variant="default"
            currentPage={page}
            totalPages={10}
            onPageChange={setPage}
          />
        </Row>

        <Row tag="text-buttons" dim="Previous / Next labels + numbers">
          <Pagination
            variant="text-buttons"
            currentPage={page}
            totalPages={99}
            onPageChange={setPage}
          />
        </Row>

        <Row tag="two-buttons" dim="separated pills">
          <Pagination
            variant="two-buttons"
            currentPage={page}
            totalPages={10}
            onPageChange={setPage}
          />
        </Row>

        <Row tag="helper-text" dim="totals string + Prev/Next">
          <Pagination
            variant="helper-text"
            currentPage={page}
            totalPages={10}
            pageSize={10}
            totalItems={100}
            onPageChange={setPage}
          />
        </Row>

        <Row tag="arrows" dim="X of Y joined">
          <Pagination
            variant="arrows"
            currentPage={page}
            totalPages={99}
            onPageChange={setPage}
          />
        </Row>
      </div>
    </Panel>
  );
}

function EllipsisShowcase() {
  const [page, setPage] = useState(50);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Row tag="middle" dim="ellipsis on both sides">
          <Pagination
            variant="text-buttons"
            currentPage={page}
            totalPages={99}
            onPageChange={setPage}
          />
        </Row>
        <Row tag="near start" dim="ellipsis right only">
          <Pagination
            variant="text-buttons"
            currentPage={3}
            totalPages={99}
            onPageChange={() => undefined}
          />
        </Row>
        <Row tag="near end" dim="ellipsis left only">
          <Pagination
            variant="text-buttons"
            currentPage={97}
            totalPages={99}
            onPageChange={() => undefined}
          />
        </Row>
        <Row tag="few pages" dim="all numbers, no ellipsis">
          <Pagination
            variant="text-buttons"
            currentPage={3}
            totalPages={5}
            onPageChange={() => undefined}
          />
        </Row>
      </div>
    </Panel>
  );
}

function DisabledStates() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Row tag="first page" dim="Previous disabled">
          <Pagination
            variant="default"
            currentPage={1}
            totalPages={10}
            onPageChange={() => undefined}
          />
        </Row>
        <Row tag="last page" dim="Next disabled">
          <Pagination
            variant="default"
            currentPage={10}
            totalPages={10}
            onPageChange={() => undefined}
          />
        </Row>
        <Row tag="single page" dim="both disabled">
          <Pagination
            variant="two-buttons"
            currentPage={1}
            totalPages={1}
            onPageChange={() => undefined}
          />
        </Row>
      </div>
    </Panel>
  );
}

// ─── Live demo with a fake table ─────────────────────────────────────────────

function FakeTableDemo() {
  const PAGE_SIZE = 10;
  const TOTAL = 137;
  const [page, setPage] = useState(1);

  const start = (page - 1) * PAGE_SIZE;
  const rows = Array.from({ length: PAGE_SIZE }, (_, i) => ({
    id: start + i + 1,
    name: ['Aino', 'Eero', 'Mikko', 'Saara', 'Lauri', 'Tiia', 'Vesa', 'Kati', 'Janne', 'Heli'][i % 10],
    role: ['Admin', 'Editor', 'Viewer'][i % 3],
  })).filter((r) => r.id <= TOTAL);

  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          border: '1px solid var(--docs-border)', borderRadius: 10, overflow: 'hidden',
          background: '#fff',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={cellStyle(true)}>#</th>
                <th style={cellStyle(true)}>Name</th>
                <th style={cellStyle(true)}>Role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={cellStyle(false)}>{r.id}</td>
                  <td style={cellStyle(false)}>{r.name}</td>
                  <td style={cellStyle(false)}>{r.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: FONT, fontSize: 13, color: '#4a5565' }}>
            Showing <strong>{start + 1}</strong>–<strong>{Math.min(start + PAGE_SIZE, TOTAL)}</strong> of <strong>{TOTAL}</strong>
          </span>
          <Pagination
            variant="text-buttons"
            currentPage={page}
            totalPages={Math.ceil(TOTAL / PAGE_SIZE)}
            onPageChange={setPage}
          />
        </div>
      </div>
    </Panel>
  );
}

function cellStyle(header: boolean): React.CSSProperties {
  return {
    padding: '10px 14px',
    textAlign: 'left',
    fontWeight: header ? 600 : 400,
    fontSize: header ? 12 : 13,
    color: header ? '#6a7282' : '#101828',
    borderBottom: '1px solid var(--docs-border)',
    textTransform: header ? 'uppercase' : 'none',
    letterSpacing: header ? 0.4 : 0,
  };
}

// ─── Playground ───────────────────────────────────────────────────────────────

function Playground() {
  const [variant, setVariant]   = useState<PaginationVariant>('default');
  const [page, setPage]         = useState(3);
  const [totalPages, setTotal]  = useState(10);
  const [siblings, setSiblings] = useState(1);
  const [boundaries, setBoundaries] = useState(1);

  const code = `<Pagination
  variant="${variant}"
  currentPage={${page}}
  totalPages={${totalPages}}
  onPageChange={setPage}${variant === 'default' || variant === 'text-buttons' ? `
  siblingCount={${siblings}}
  boundaryCount={${boundaries}}` : ''}${variant === 'helper-text' ? `
  pageSize={10}
  totalItems={${totalPages * 10}}` : ''}
/>`;

  return (
    <Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ControlGroup label="variant">
            <Segmented value={variant} options={VARIANTS} onChange={setVariant} />
          </ControlGroup>
          <ControlGroup label="totalPages">
            <NumberStep value={totalPages} onChange={setTotal} min={1} max={999} />
          </ControlGroup>
          <ControlGroup label="currentPage">
            <NumberStep value={page} onChange={setPage} min={1} max={totalPages} />
          </ControlGroup>
          {(variant === 'default' || variant === 'text-buttons') && (
            <>
              <ControlGroup label="siblingCount">
                <NumberStep value={siblings} onChange={setSiblings} min={0} max={3} />
              </ControlGroup>
              <ControlGroup label="boundaryCount">
                <NumberStep value={boundaries} onChange={setBoundaries} min={0} max={3} />
              </ControlGroup>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            border: '1px dashed var(--docs-border)', borderRadius: 8,
            padding: 24, minHeight: 140,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
            background: '#fff',
          }}>
            <Pagination
              variant={variant}
              currentPage={Math.min(page, totalPages)}
              totalPages={totalPages}
              onPageChange={setPage}
              siblingCount={siblings}
              boundaryCount={boundaries}
              pageSize={10}
              totalItems={totalPages * 10}
            />
          </div>
          <pre style={{
            fontFamily: MONO, fontSize: 12, color: 'var(--docs-text)',
            background: 'var(--docs-page-bg)', border: '1px solid var(--docs-border)',
            borderRadius: 8, padding: '10px 12px', margin: 0, whiteSpace: 'pre',
          }}>
            {code}
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
    <div style={{
      display: 'inline-flex', flexWrap: 'wrap',
      border: '1px solid var(--docs-border)', borderRadius: 6, overflow: 'hidden',
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

function NumberStep({ value, onChange, min, max }: { value: number; onChange: (n: number) => void; min: number; max: number }) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      border: '1px solid var(--docs-border)', borderRadius: 6, overflow: 'hidden',
    }}>
      <button
        onClick={() => set(value - 1)}
        style={{
          width: 28, height: 28, border: 0, background: 'var(--docs-panel-bg)',
          color: 'var(--docs-text)', cursor: 'pointer', fontFamily: MONO, fontSize: 13,
        }}
      >−</button>
      <input
        type="number"
        value={value}
        min={min} max={max}
        onChange={(e) => set(parseInt(e.target.value, 10) || min)}
        style={{
          width: 50, height: 28, border: 0,
          borderLeft: '1px solid var(--docs-border)', borderRight: '1px solid var(--docs-border)',
          fontFamily: MONO, fontSize: 12, textAlign: 'center', padding: 0,
        }}
      />
      <button
        onClick={() => set(value + 1)}
        style={{
          width: 28, height: 28, border: 0, background: 'var(--docs-panel-bg)',
          color: 'var(--docs-text)', cursor: 'pointer', fontFamily: MONO, fontSize: 13,
        }}
      >+</button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

const PROPS_TABLE = [
  { name: 'currentPage',   type: 'number',                default: '—',         description: '1-indexed current page.' },
  { name: 'totalPages',    type: 'number',                default: '—',         description: 'Total page count.' },
  { name: 'onPageChange',  type: '(page) => void',        default: '—',         description: 'Fires when the user navigates to a different page.' },
  { name: 'variant',       type: 'PaginationVariant',     default: 'default',   description: 'default · text-buttons · two-buttons · helper-text · arrows' },
  { name: 'siblingCount',  type: 'number',                default: '1',         description: 'Pages shown on each side of the current page.' },
  { name: 'boundaryCount', type: 'number',                default: '1',         description: 'Pages always shown at each end.' },
  { name: 'totalItems',    type: 'number',                default: '—',         description: 'Used by helper-text variant for the "Showing X–Y of N" line.' },
  { name: 'pageSize',      type: 'number',                default: '—',         description: 'Used by helper-text variant.' },
  { name: 'helperText',    type: 'ReactNode | (info) => ReactNode', default: 'auto', description: 'Override the helper text. Receives `{ from, to, total }`.' },
  { name: 'ariaLabel',     type: 'string',                default: 'Pagination', description: 'Accessible name for the <nav>.' },
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

export function PaginationGallery() {
  return (
    <div style={{
      padding: '36px 40px',
      background: 'var(--docs-page-bg)',
      minHeight: '100vh',
      fontFamily: FONT,
    }}>
      <PageHeader />

      <SectionHeader title="Variants" note="Five layouts — pick one via the `variant` prop." />
      <Variants />

      <SectionHeader title="Ellipsis behavior" note="Truncation activates when totalPages > boundary*2 + sibling*2 + 3." />
      <EllipsisShowcase />

      <SectionHeader title="Disabled edges" note="Previous / Next are auto-disabled at the boundaries." />
      <DisabledStates />

      <SectionHeader title="In context" note="Wired up to a fake table — current page drives the visible rows." />
      <FakeTableDemo />

      <SectionHeader title="Playground" />
      <Playground />

      <SectionHeader title="Props" />
      <PropsTable />
    </div>
  );
}
