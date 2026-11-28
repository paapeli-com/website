import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/lib/toast";
import { Activity, ArrowRight, Copy, Key, Layers, Plus, TestTube } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { AI_INFERENCE_BASE, centralApiKeysPath } from "@/shell/nav/aiInferenceNav";
import { getUsage, listAvailableModels, PROPOSED_BASE_URL } from "../lib/catalog";
import { listKeysForProduct } from "@/shared/lib/apiKeys";
import { AI_INFERENCE_PRODUCT_ID } from "@/shared/lib/productRegistry";
import { useT } from "../i18n";
import { Badge, MetricCard, MetricRow, Page, PageHead, SectionCard, WalletLinkCard, useAmount, useNum } from "../ui";
import { useProject } from "../routes";

/* Start: the product's front door.
 *
 * What a first visit needs, in the order it needs it: the base URL, a key,
 * a request to copy, and then, once requests have been sent, a short summary
 * of what they used. Cost and balance are not repeated here; they are a link
 * to the wallet in Cloud Management.
 */
export default function Overview() {
  const t = useT();
  const num = useNum();
  const amount = useAmount();
  const navigate = useNavigate();
  const { projectId } = useProject();

  const usage = getUsage();
  const models = listAvailableModels();
  const firstChat = models.find((m) => m.task !== "embedding");
  /* The count comes from the central registry, not from a list of this
     product's own: there isn't one, and that is the point. */
  const keys = listKeysForProduct(AI_INFERENCE_PRODUCT_ID, projectId).filter((k) => k.status === "active");

  const sample = `curl ${PROPOSED_BASE_URL}/chat/completions \\
  -H "Authorization: Bearer $PAAPELI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${firstChat?.modelId ?? "model-id"}",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`;

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(t("Copied"));
  };

  return (
    <Page>
      <PageHead
        title={t("Start")}
        description={t("Everything you need to send your first request.")}
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate(`${AI_INFERENCE_BASE}/playground`)}
          >
            <TestTube className="size-4 me-2" />
            {t("Try in Playground")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SectionCard title={t("Quick start")} action={<Badge tone="warn">{t("OpenAI-compatible API")}</Badge>}>
          {/* 1. Base URL */}
          <p className="text-[13px] font-medium text-foreground">
            <span className="me-2 text-muted-foreground tabular-nums">{num(1)}</span>
            {t("Base URL")}
          </p>
          <span className="mt-1.5 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs" dir="ltr">
              {PROPOSED_BASE_URL}
            </code>
            <Button variant="ghost" size="icon" onClick={() => copy(PROPOSED_BASE_URL)} aria-label={t("Copied")}>
              <Copy className="size-4" />
            </Button>
          </span>

          {/* 2. A key */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-foreground">
              <span className="me-2 text-muted-foreground tabular-nums">{num(2)}</span>
              {t("Create an API key")}
              <span className="ms-2 text-xs font-normal text-muted-foreground">{t("Keys are kept in Cloud Management.")}</span>
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate(centralApiKeysPath(true))}>
              <Plus className="size-4 me-2" />
              {t("Create API key")}
            </Button>
          </div>

          {/* 3. A request */}
          <p className="mt-5 text-[13px] font-medium text-foreground">
            <span className="me-2 text-muted-foreground tabular-nums">{num(3)}</span>
            {t("Send your first request")}
          </p>
          <div className="mt-1.5 overflow-hidden rounded-lg bg-slate-900">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2" dir="ltr">
              <span className="text-xs font-medium text-white">cURL</span>
              <button type="button" onClick={() => copy(sample)} className="text-slate-300 hover:text-white" aria-label={t("Copied")}>
                <Copy className="size-4" />
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-100" dir="ltr">
              {sample}
            </pre>
          </div>
          <Button variant="link" className="mt-3 h-auto p-0 text-primary" onClick={() => navigate(`${AI_INFERENCE_BASE}/integration`)}>
            {t("View integration guide")}
            <ArrowRight className="size-4 ms-1.5 rtl:rotate-180" />
          </Button>
        </SectionCard>

        <SectionCard title={t("Available to your project")}>
          <div className="flex flex-col">
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate(`${AI_INFERENCE_BASE}/models/${m.id}`)}
                className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 text-start last:border-0 hover:text-primary"
              >
                <span className="truncate text-[13.5px] text-foreground">{m.name}</span>
                <Badge tone={m.task === "embedding" ? "embedding" : "chat"}>
                  {t(m.task === "chat" ? "Chat" : m.task === "code" ? "Code" : "Embedding")}
                </Badge>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* The summary appears once the project has sent a request. */}
      {usage.requests > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">{t("Usage summary")}</h2>
            <Button variant="link" className="h-auto p-0 text-primary" onClick={() => navigate(`${AI_INFERENCE_BASE}/usage`)}>
              {t("View usage")}
              <ArrowRight className="size-4 ms-1.5 rtl:rotate-180" />
            </Button>
          </div>
          <MetricRow>
            <MetricCard active label={t("Requests")} value={amount(usage.requests)} unit={t("calls")} icon={Activity} />
            <MetricCard
              label={t("Total tokens")}
              value={`${num(((usage.inputTokens + usage.outputTokens) / 1_000_000).toFixed(2))}M`}
              unit={t("tokens")}
              icon={Layers}
              tone="violet"
            />
            <MetricCard label={t("Active API keys")} value={num(keys.length)} unit={t("keys")} icon={Key} tone="emerald" />
            <WalletLinkCard />
          </MetricRow>
        </div>
      )}
    </Page>
  );
}
