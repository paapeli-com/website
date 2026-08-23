import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { Badge, Button, Card, PageHeader, Table } from "@/features/cloud-management/ui";

/* Placeholder data — @paapeli/api has no billing module yet. Every invoice
   id shows the same sample line items; a real detail endpoint would key
   off `invoiceId` from the route. */
const LINE_ITEMS: [string, string, string, string][] = [
  ["AIoT Business — base fee", "1 month", "﷼ 42,000,000", "﷼ 42,000,000"],
  ["Extra assets pack", "2 × 5 assets", "﷼ 6,000,000", "﷼ 12,000,000"],
  ["AI analytics — advanced", "1 workspace", "﷼ 18,000,000", "﷼ 18,000,000"],
  ["Extended retention (24 months)", "1", "﷼ 9,000,000", "﷼ 9,000,000"],
  ["Priority support", "1", "﷼ 3,200,000", "﷼ 3,200,000"],
  ["Message overage", "0.4M messages", "﷼ 13.5 / 1k", "﷼ 5,400,000"],
];

const SUMMARY = [
  ["Subtotal", "﷼ 89,600,000"],
  ["Discount (annual commit)", "− ﷼ 8,000,000"],
  ["Wallet credit applied", "− ﷼ 0"],
  ["VAT 9%", "﷼ 8,064,000"],
];

const TIMELINE = [
  ["Invoice issued", "1 Aug 2026, 00:05"],
  ["Reminder sent", "2 Aug 2026, 09:00"],
  ["Payment received", "3 Aug 2026, 11:42"],
  ["Tax document filed", "4 Aug 2026, 08:10"],
];

const DOCUMENTS = [
  ["Invoice PDF", "214 KB"],
  ["Official tax invoice", "188 KB"],
  ["Usage report (CSV)", "1.2 MB"],
];

export default function InvoiceDetail() {
  const { invoiceId = "" } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { selected } = useWorkspaceSelection();

  return (
    <div className="flex flex-col gap-6 p-6">
      <button
        type="button"
        onClick={() => navigate("billing")}
        className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Billing & invoices
      </button>

      <PageHeader
        title={`Invoice ${invoiceId}`}
        description="Issued 1 Aug 2026 · period 1–31 Jul 2026 · paid on 3 Aug 2026 — preview data, no billing backend yet."
        actions={
          <>
            <Button variant="ghost">Send by email</Button>
            <Button>Download PDF</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-wrap justify-between gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Billed to</span>
              <span className="text-sm font-semibold text-foreground">{selected?.workspaceName ?? "Your workspace"}</span>
              <span className="text-[13px] leading-relaxed text-muted-foreground">
                National ID 10861234567
                <br />
                VAT 411223344
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Issued by</span>
              <span className="text-sm font-semibold text-foreground">Paapeli Cloud</span>
              <span className="text-[13px] leading-relaxed text-muted-foreground">
                Registration 14009988776
                <br />
                billing@paapeli.cloud
              </span>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge tone="ok">Paid</Badge>
              <span className="text-2xl font-bold text-foreground">﷼ 89,600,000</span>
              <span className="text-xs text-muted-foreground">Paid via card •••• 4417</span>
            </div>
          </Card>

          <Table
            columns={["Description", "Quantity", "Unit price", "Amount"]}
            head={
              <>
                <h2 className="text-sm font-bold text-foreground">Line items</h2>
                <span className="text-xs text-muted-foreground">{LINE_ITEMS.length} items</span>
              </>
            }
            rows={LINE_ITEMS}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-2.5">
            <h2 className="text-sm font-bold text-foreground">Summary</h2>
            {SUMMARY.map(([l, v]) => (
              <div key={l} className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
            <div className="h-px bg-border" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-foreground">Total paid</span>
              <span className="text-xl font-bold text-foreground">﷼ 89,600,000</span>
            </div>
          </Card>

          <Card className="flex flex-col gap-1">
            <h2 className="mb-2 text-sm font-bold text-foreground">Timeline</h2>
            {TIMELINE.map(([t, d], i) => (
              <div key={t} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  {i < TIMELINE.length - 1 && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className="flex flex-col gap-0.5 pb-3">
                  <span className="text-[13.5px] text-foreground">{t}</span>
                  <span className="text-xs text-muted-foreground">{d}</span>
                </div>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-foreground">Documents</h2>
            {DOCUMENTS.map(([n, s]) => (
              <div key={n} className="flex items-center gap-2.5">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-[13.5px] text-foreground">{n}</span>
                <span className="text-xs text-muted-foreground">{s}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
