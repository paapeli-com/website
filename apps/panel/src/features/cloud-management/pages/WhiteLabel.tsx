import { useState, type ReactNode } from "react";
import { FileText, Mail, Palette, Upload } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/features/factory/contexts/LanguageContext";
import { Input } from "@/features/factory/components/ui/input";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { ListToolbar, type FilterField, type SortOption, type ViewMode } from "@/features/factory/components/panel/ListToolbar";
import { Button, PageHeader, Tabs } from "@/features/cloud-management/ui";
import { BackendNote, ListCard, TableShell } from "./members/shared";
import { useTr } from "./white-label/dictionary";

/* White Label: the panel wearing the customer's brand instead of ours.
 *
 * Three tabs, following the design doc's Branding page: what the panel looks
 * like, which domain it answers on, and the wording that leaves the platform
 * as email and SMS.
 *
 * Nothing here has an endpoint. There is no white label service, so every
 * field is local to the page, both tables report no data rather than naming
 * templates and DNS records nobody has checked, and the two header actions
 * are disabled rather than pretending to save. The note under the tabs says
 * so in all three languages. When the API lands, the fields are what change,
 * not the layout.
 *
 * The tables are the device list's, to the class (see members/shared.tsx),
 * and the templates toolbar is the panel's own ListToolbar — which is why
 * this page sits inside the factory's LanguageProvider, as Members does: the
 * toolbar and the table primitives read their labels from it. */
export default function WhiteLabel() {
  return (
    <LanguageProvider>
      <WhiteLabelPage />
    </LanguageProvider>
  );
}

/* The design's five swatches. They are a palette to pick from, not data about
   the account, so they are named here rather than fetched. */
const SWATCHES = ["#FF7900", "#1E3A8A", "#00A97A", "#C70036", "#101828"];

/* The slots a message template can carry. Product vocabulary, not account
   data, so the list is real. */
const VARIABLES = ["{{name}}", "{{workspace}}", "{{code}}", "{{device}}", "{{link}}"];

/** Label, field and hint — the shape every input on this page takes. */
function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** What a table says when it has columns but nothing to put under them. */
function EmptyRow({ colSpan, icon: Icon, title, description }: { colSpan: number; icon: typeof FileText; title: string; description: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan}>
        <div className="flex flex-col items-center gap-1.5 py-10 text-center">
          <Icon className="size-6 text-muted-foreground/40" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="max-w-sm text-xs text-muted-foreground">{description}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function WhiteLabelPage() {
  const tr = useTr();
  const { isRTL } = useLanguage();
  const [tab, setTab] = useState<"appearance" | "domain" | "messages">("appearance");

  const labels = {
    appearance: tr("tabAppearance"),
    domain: tr("tabDomain"),
    messages: tr("tabMessages"),
  };
  const byLabel = (v: string) =>
    (Object.keys(labels) as (keyof typeof labels)[]).find((k) => labels[k] === v) ?? "appearance";

  const subtitle = { appearance: tr("subAppearance"), domain: tr("subDomain"), messages: tr("subMessages") }[tab];

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like the rest of Cloud Management. */
    <div data-uniform-type dir={isRTL ? "rtl" : "ltr"} className="flex flex-col gap-6 p-6">
      <PageHeader
        title={tr("whiteLabel")}
        description={subtitle}
        actions={
          <>
            {/* Disabled rather than absent: the design's actions stay visible
                so the page reads as finished, but neither can save while
                there is nothing behind them. */}
            <Button variant="ghost" disabled title={tr("comingSoon")}>
              <Mail className="size-4" />
              {tr("sendTest")}
            </Button>
            <Button disabled title={tr("comingSoon")}>{tr("saveChanges")}</Button>
          </>
        }
      />

      <Tabs
        items={[labels.appearance, labels.domain, labels.messages]}
        value={labels[tab]}
        onChange={(v) => setTab(byLabel(v))}
      />

      {tab === "appearance" && <AppearanceTab />}
      {tab === "domain" && <DomainTab />}
      {tab === "messages" && <MessagesTab />}

      <BackendNote text={tr("backendNote")} />
    </div>
  );
}

function AppearanceTab() {
  const tr = useTr();
  const [colour, setColour] = useState(SWATCHES[0]);
  const [name, setName] = useState("");

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <FormField label={tr("panelLogo")}>
          <div className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40">
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{tr("logoHint")}</span>
          </div>
        </FormField>

        <FormField label={tr("primaryColour")}>
          <div className="flex flex-wrap gap-2.5">
            {SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={hex}
                onClick={() => setColour(hex)}
                style={{ background: hex }}
                className={
                  "size-9 rounded-xl ring-offset-2 ring-offset-card transition-all " +
                  (hex === colour ? "ring-2 ring-primary" : "ring-0 hover:opacity-80")
                }
              />
            ))}
          </div>
        </FormField>

        <FormField label={tr("productName")} hint={tr("productNameHint")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("productNamePh")} />
        </FormField>
      </div>

      {/* The panel as the customer would see it. Everything in it comes from
          the two controls on the left, so it shows a real consequence rather
          than a picture of someone else's brand. */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">{tr("preview")}</span>
        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          <div className="flex h-14 items-center gap-2.5 border-b border-border bg-card px-4">
            <span className="size-6 shrink-0 rounded-lg" style={{ background: colour }} />
            <span className="truncate text-base font-bold" style={{ color: colour }}>
              {name || "Paapeli"}
            </span>
            <span className="flex-1" />
            <span
              className="hidden h-8 shrink-0 items-center rounded-lg px-3.5 text-xs font-semibold text-white sm:flex"
              style={{ background: colour }}
            >
              {tr("previewAction")}
            </span>
          </div>
          <div className="flex gap-4 p-5">
            <div className="hidden w-32 shrink-0 flex-col gap-2 sm:flex">
              <span className="h-7 rounded-lg" style={{ background: colour, opacity: 0.16 }} />
              <span className="h-7 rounded-lg bg-card" />
              <span className="h-7 rounded-lg bg-card" />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <span className="h-16 rounded-xl border border-border bg-card" />
              <span className="h-28 rounded-xl border border-border bg-card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DomainTab() {
  const tr = useTr();
  const [panelDomain, setPanelDomain] = useState("");
  const [mailDomain, setMailDomain] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
        <FormField label={tr("panelDomain")} hint={tr("panelDomainHint")}>
          <Input value={panelDomain} onChange={(e) => setPanelDomain(e.target.value)} placeholder="panel.example.com" dir="ltr" />
        </FormField>
        <FormField label={tr("mailDomain")} hint={tr("mailDomainHint")}>
          <Input value={mailDomain} onChange={(e) => setMailDomain(e.target.value)} placeholder="mail.example.com" dir="ltr" />
        </FormField>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-foreground">{tr("dnsRecords")}</span>
        <ListCard>
          {/* The records to create belong to a verified domain. Inventing
              hosts and values here would be worse than showing none: someone
              would put them into real DNS. */}
          <TableShell minWidth="640px">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[110px]">{tr("colType")}</TableHead>
                <TableHead>{tr("colHost")}</TableHead>
                <TableHead>{tr("colValue")}</TableHead>
                <TableHead className="w-[120px]">{tr("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <EmptyRow colSpan={4} icon={FileText} title={tr("noRecords")} description={tr("noRecordsDesc")} />
            </TableBody>
          </TableShell>
        </ListCard>
      </div>
    </div>
  );
}

function MessagesTab() {
  const tr = useTr();
  const [sms, setSms] = useState("");
  const [from, setFrom] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [support, setSupport] = useState("");

  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [state, setState] = useState("all");
  const [sort, setSort] = useState("nameAsc");
  const [view, setView] = useState<ViewMode>("table");

  const all = { value: "all", label: tr("optAll") };
  const filterFields: FilterField[] = [
    {
      key: "channel",
      label: tr("colChannel"),
      value: channel,
      onChange: setChannel,
      options: [all, { value: "email", label: tr("channelEmail") }, { value: "sms", label: tr("channelSms") }],
    },
    {
      key: "state",
      label: tr("filterState"),
      value: state,
      onChange: setState,
      options: [all, { value: "default", label: tr("stateDefault") }, { value: "customized", label: tr("stateCustomized") }],
    },
  ];
  const sortOptions: SortOption[] = [{ key: "nameAsc", label: tr("sortNameAsc") }];
  const activeFilterCount = [channel, state].filter((v) => v !== "all").length;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <FormField label={tr("smsSender")} hint={tr("smsSenderHint")}>
          <Input value={sms} onChange={(e) => setSms(e.target.value)} maxLength={11} dir="ltr" />
        </FormField>
        <FormField label={tr("emailFrom")} hint={tr("emailFromHint")}>
          <Input value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label={tr("replyTo")} hint={tr("replyToHint")}>
          <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="support@example.com" dir="ltr" />
        </FormField>
        <FormField label={tr("supportLink")} hint={tr("supportLinkHint")}>
          <Input value={support} onChange={(e) => setSupport(e.target.value)} placeholder="https://example.com/support" dir="ltr" />
        </FormField>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tr("availableVariables")}
          </span>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((v) => (
              <span key={v} className="rounded-lg bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground" dir="ltr">
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-foreground">{tr("templates")}</span>
        <ListCard>
          <ListToolbar
            search={{ value: search, onChange: setSearch, placeholder: tr("searchTemplates") }}
            view={{ value: view, onChange: setView, available: ["table"] }}
            filter={{
              fields: filterFields,
              activeCount: activeFilterCount,
              onClear: () => {
                setChannel("all");
                setState("all");
              },
            }}
            sort={{ options: sortOptions, value: sort, onChange: setSort }}
            actions={[{ key: "export", label: tr("actionExport"), comingSoon: true }]}
            selectionCount={0}
          />

          <TableShell minWidth="620px">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{tr("colTemplate")}</TableHead>
                <TableHead className="w-[110px]">{tr("colChannel")}</TableHead>
                <TableHead className="hidden lg:table-cell">{tr("colSubject")}</TableHead>
                <TableHead className="w-[90px] text-end">{tr("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <EmptyRow colSpan={4} icon={Palette} title={tr("noTemplates")} description={tr("noTemplatesDesc")} />
            </TableBody>
          </TableShell>
        </ListCard>
      </div>
    </div>
  );
}
