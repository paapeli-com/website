import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { Button, Card, NoData, NoDataValue, PageHeader, Table } from "@/features/cloud-management/ui";

/* @paapeli/api has no billing module yet.

   This was the worst of the placeholder pages: whatever invoice id you opened
   rendered the same document — six line items, a VAT calculation, a payment
   timeline down to the minute, national ID and VAT registration numbers, and
   downloadable PDFs that do not exist. It reads as a tax document for the
   signed-in company. All of it reports no data until a detail endpoint keys
   off `invoiceId` from the route. */
const LINE_ITEMS: [string, string, string, string][] = [];
const SUMMARY: [string, string][] = [];
const TIMELINE: [string, string][] = [];
const DOCUMENTS: [string, string][] = [];

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
        description="Line items, payment timeline and documents for this invoice."
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
              {/* Registration and VAT numbers are legal identifiers — never invent them. */}
              <span className="text-[13px] leading-relaxed text-muted-foreground"><NoDataValue /></span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Issued by</span>
              <span className="text-sm font-semibold text-foreground">Paapeli Cloud</span>
              <span className="text-[13px] leading-relaxed text-muted-foreground"><NoDataValue /></span>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-2xl font-bold text-foreground"><NoDataValue /></span>
            </div>
          </Card>

          <Table
            columns={["Description", "Quantity", "Unit price", "Amount"]}
            head={
              <>
                <h2 className="text-sm font-bold text-foreground">Line items</h2>
                <span className="text-xs text-muted-foreground">
                  {LINE_ITEMS.length > 0 ? `${LINE_ITEMS.length} items` : null}
                </span>
              </>
            }
            rows={LINE_ITEMS}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-2.5">
            <h2 className="text-sm font-bold text-foreground">Summary</h2>
            {SUMMARY.length === 0 && <NoData />}
            {SUMMARY.map(([l, v]) => (
              <div key={l} className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
            <div className="h-px bg-border" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-foreground">Total paid</span>
              <span className="text-xl font-bold text-foreground"><NoDataValue /></span>
            </div>
          </Card>

          <Card className="flex flex-col gap-1">
            <h2 className="mb-2 text-sm font-bold text-foreground">Timeline</h2>
            {TIMELINE.length === 0 && <NoData />}
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
            {DOCUMENTS.length === 0 && <NoData />}
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
