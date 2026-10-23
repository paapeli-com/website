import { useEffect, useRef, useState, type ReactNode } from "react";
import { FileText, Mail, Palette, Upload } from "lucide-react";
import { toast } from "@/shared/lib/toast";
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

/** Label, field and hint — the shape every input on this page takes. A
    required field carries an asterisk and an optional one says so beside the
    label, as every form in the panel does. */
function FormField({
  label,
  hint,
  required,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  const tr = useTr();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ms-1 text-destructive" aria-hidden>*</span>}
        {optional && <span className="ms-1.5 font-normal text-muted-foreground">({tr("optional")})</span>}
      </span>
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
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className="size-5" />
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="max-w-sm whitespace-normal text-[13px] text-muted-foreground">{description}</span>
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
            {/* Nothing stores a brand yet, so both answer "Coming soon" as
                the panel's other unbuilt controls do, rather than sitting
                disabled with no word on why. */}
            <Button variant="ghost" onClick={() => toast.info(tr("sendTest"), { description: tr("comingSoonDesc") })}>
              <Mail className="size-4" />
              {tr("sendTest")}
            </Button>
            <Button onClick={() => toast.info(tr("saveChanges"), { description: tr("comingSoonDesc") })}>
              {tr("saveChanges")}
            </Button>
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
  /* The chosen logo, as an object URL for the preview. It stays in this tab
     until saving a brand exists. */
  const [logo, setLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (logo) URL.revokeObjectURL(logo); }, [logo]);

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(tr("logoTooLarge"));
      return;
    }
    setLogo(URL.createObjectURL(file));
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <FormField label={tr("panelLogo")} optional>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => {
              pickLogo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {logo ? (
            <div className="flex h-28 items-center gap-4 rounded-xl border border-border bg-muted/30 px-4">
              <img src={logo} alt="" className="max-h-20 max-w-[160px] object-contain" />
              <span className="flex-1" />
              <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => fileRef.current?.click()}>
                {tr("replaceLogo")}
              </Button>
              <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => setLogo(null)}>
                {tr("removeLogo")}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickLogo(e.dataTransfer.files?.[0]);
              }}
              className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40"
            >
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{tr("logoHint")}</span>
            </button>
          )}
        </FormField>

        <FormField label={tr("primaryColour")} required>
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

        <FormField label={tr("productName")} hint={tr("productNameHint")} optional>
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
            {logo ? (
              <img src={logo} alt="" className="h-6 max-w-[96px] shrink-0 object-contain" />
            ) : (
              <span className="size-6 shrink-0 rounded-lg" style={{ background: colour }} />
            )}
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
        <FormField label={tr("panelDomain")} hint={tr("panelDomainHint")} required>
          <Input value={panelDomain} onChange={(e) => setPanelDomain(e.target.value)} placeholder="panel.example.com" dir="ltr" />
        </FormField>
        <FormField label={tr("mailDomain")} hint={tr("mailDomainHint")} optional>
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
        <FormField label={tr("smsSender")} hint={tr("smsSenderHint")} optional>
          <Input value={sms} onChange={(e) => setSms(e.target.value)} maxLength={11} dir="ltr" />
        </FormField>
        <FormField label={tr("emailFrom")} hint={tr("emailFromHint")} optional>
          <Input value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label={tr("replyTo")} hint={tr("replyToHint")} optional>
          <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="support@example.com" dir="ltr" />
        </FormField>
        <FormField label={tr("supportLink")} hint={tr("supportLinkHint")} optional>
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
