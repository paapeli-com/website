import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Code2, ExternalLink, FileText, Info, MessageSquare, Network, Play } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { AI_INFERENCE_BASE } from "@/shell/nav/aiInferenceNav";
import { getModel, listRateLimits, PROPOSED_BASE_URL } from "../lib/catalog";
import { useT } from "../i18n";
import { Badge, Card, DetailRow, IconTile, Page, SectionCard, useAmount, useNum } from "../ui";

/* One model: what it does, what it costs, and what this project may ask of it.
   Header, status line and underlined tabs follow the device detail page, which
   is the panel's existing pattern for "one thing, several views of it". */

type Tab = "overview" | "integration" | "pricing";

export default function ModelDetail() {
  const t = useT();
  const num = useNum();
  const amount = useAmount();
  const navigate = useNavigate();
  const { modelId = "" } = useParams();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");

  const model = getModel(modelId);
  /* Arrived here from the catalogue's "compare selected". */
  const other = params.get("compare") ? getModel(params.get("compare")!) : undefined;
  const limit = listRateLimits().find((l) => l.modelId === modelId);

  if (!model) {
    return (
      <Page>
        <div className="py-16 text-center text-sm text-muted-foreground">{t("Model not found")}</div>
      </Page>
    );
  }

  const isEmbedding = model.task === "embedding";
  const TaskIcon = isEmbedding ? Network : model.task === "code" ? Code2 : MessageSquare;

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare }[] = [
    { key: "overview", label: t("Overview"), icon: MessageSquare },
    { key: "integration", label: t("API integration"), icon: Code2 },
    { key: "pricing", label: t("Pricing"), icon: FileText },
  ];

  return (
    <Page>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{model.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground" dir="ltr">
            {model.modelId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`${AI_INFERENCE_BASE}/models`)}>
            <ArrowLeft className="size-4 me-2 rtl:rotate-180" />
            {t("All models")}
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate(`${AI_INFERENCE_BASE}/playground?model=${model.id}`)}
          >
            <Play className="size-4 me-2" />
            {t("Try in playground")}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
        <Badge tone={model.available ? "ok" : "gray"}>{t("Available")}</Badge>
        <span>{t(isEmbedding ? "Embedding" : model.task === "code" ? "Code" : "Chat")}</span>
        {model.capabilities.includes("tools") && <span>{t("Tool calling")}</span>}
        {model.capabilities.includes("json") && <span>{t("JSON output")}</span>}
        <span>
          {t("Publisher")}: {model.publisher}
        </span>
      </div>

      <div className="mb-5 flex gap-6 overflow-x-auto border-b border-border">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={
              tab === tb.key
                ? "flex shrink-0 items-center gap-1.5 border-b-2 border-primary pb-2.5 text-sm font-medium text-primary"
                : "flex shrink-0 items-center gap-1.5 border-b-2 border-transparent pb-2.5 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            <tb.icon className="size-4" />
            {tb.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          {tab === "overview" && (
            <SectionCard
              title={
                <span className="flex items-center gap-2.5">
                  <IconTile icon={TaskIcon} tone={isEmbedding ? "violet" : "brand"} />
                  {t("Model overview")}
                </span>
              }
            >
              <p className="text-sm leading-relaxed text-muted-foreground">{model.description}</p>
              <div className="mt-4">
                <DetailRow
                  label={t("Task")}
                  value={isEmbedding ? t("Embedding") : t("Text generation / chat")}
                />
                <DetailRow label={t("Serving context")} value={`${amount(model.contextTokens)} ${t("tokens")}`} />
                {model.maxOutputTokens !== null && (
                  <DetailRow label={t("Maximum output")} value={`${amount(model.maxOutputTokens)} ${t("tokens")}`} />
                )}
                {isEmbedding && model.dimensions !== null && (
                  <DetailRow label={t("Dimensions")} value={amount(model.dimensions)} />
                )}
                {!isEmbedding && (
                  <>
                    <DetailRow
                      label={t("Streaming")}
                      value={
                        <Badge tone={model.capabilities.includes("streaming") ? "ok" : "gray"}>
                          {t(model.capabilities.includes("streaming") ? "Supported" : "Not supported")}
                        </Badge>
                      }
                    />
                    <DetailRow
                      label={t("Structured output")}
                      value={model.capabilities.includes("json") ? "JSON" : "—"}
                    />
                    <DetailRow
                      label={t("Tool calling")}
                      value={
                        <Badge tone={model.capabilities.includes("tools") ? "ok" : "gray"}>
                          {t(model.capabilities.includes("tools") ? "Supported" : "Not supported")}
                        </Badge>
                      }
                    />
                  </>
                )}
              </div>

              {model.sourceUrl && (
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <a href={model.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 me-2" />
                    {t("Source model card")}
                  </a>
                </Button>
              )}
            </SectionCard>
          )}

          {tab === "integration" && <IntegrationTab modelId={model.modelId} />}
          {tab === "pricing" && <PricingTab model={model} />}

          {other && (
            <SectionCard title={`${model.name} · ${other.name}`}>
              <div className="grid grid-cols-2 gap-4 text-[13.5px]">
                <div>
                  <p className="mb-2 font-semibold text-foreground">{model.name}</p>
                  <DetailRow label={t("Context")} value={amount(model.contextTokens)} />
                  <DetailRow label={t("Input tokens")} value={amount(model.inputPrice)} />
                  <DetailRow
                    label={t("Output tokens")}
                    value={model.outputPrice === null ? "—" : amount(model.outputPrice)}
                  />
                </div>
                <div>
                  <p className="mb-2 font-semibold text-foreground">{other.name}</p>
                  <DetailRow label={t("Context")} value={amount(other.contextTokens)} />
                  <DetailRow label={t("Input tokens")} value={amount(other.inputPrice)} />
                  <DetailRow
                    label={t("Output tokens")}
                    value={other.outputPrice === null ? "—" : amount(other.outputPrice)}
                  />
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <SectionCard title={t("Usage pricing")}>
            <p className="text-[13px] text-muted-foreground">{t("Per 1 million tokens")}</p>
            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="text-[13px] text-muted-foreground">{t("Input tokens")}</p>
              <p className="mt-1 text-xl font-bold text-foreground tabular-nums">
                {amount(model.inputPrice)} <span className="text-[13px] font-normal text-muted-foreground">{t("Toman")}</span>
              </p>
            </div>
            <div className="mt-3 border-t border-border/60 pt-3">
              <p className="text-[13px] text-muted-foreground">{t("Output tokens")}</p>
              <p className="mt-1 text-xl font-bold text-foreground tabular-nums">
                {model.outputPrice === null ? "—" : amount(model.outputPrice)}{" "}
                {model.outputPrice !== null && (
                  <span className="text-[13px] font-normal text-muted-foreground">{t("Toman")}</span>
                )}
              </p>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {t("Pay for the tokens you use. No GPU setup is required.")}
            </p>
          </SectionCard>

          <SectionCard title={t("Your project limits")}>
            <DetailRow label={t("Requests / minute")} value={amount(limit?.requestsPerMinute ?? 0)} />
            <DetailRow label={t("Tokens / minute")} value={amount(limit?.tokensPerMinute ?? 0)} />
            <DetailRow label={t("Applies to")} value={t("Project + model")} />
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-primary"
              onClick={() => navigate(`${AI_INFERENCE_BASE}/limits`)}
            >
              {t("View limits")}
            </Button>
          </SectionCard>
        </div>
      </div>
    </Page>
  );

  function IntegrationTab({ modelId: id }: { modelId: string }) {
    return (
      <SectionCard title={t("Quick start")} action={<Badge tone="warn">REST API</Badge>}>
        <p className="text-[13px] text-muted-foreground">{t("Base URL")}</p>
        <code className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs" dir="ltr">
          {PROPOSED_BASE_URL}
        </code>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          {t("Proposed API address for this design.")}
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100" dir="ltr">
{`from openai import OpenAI
import os

client = OpenAI(
    base_url="${PROPOSED_BASE_URL}",
    api_key=os.environ["PAAPELI_API_KEY"],
)

response = client.chat.completions.create(
    model="${id}",
    messages=[{"role": "user", "content": "Summarize this text…"}],
)`}
        </pre>
      </SectionCard>
    );
  }

  function PricingTab({ model: m }: { model: NonNullable<ReturnType<typeof getModel>> }) {
    const [inputTokens, setInputTokens] = useState("1000");
    const [outputTokens, setOutputTokens] = useState("500");

    /* An estimate from the same prices the table shows, so the two can never
       tell a reader different things. */
    const estimate = useMemo(() => {
      const inTok = Number(inputTokens) || 0;
      const outTok = Number(outputTokens) || 0;
      const inCost = (inTok / 1_000_000) * m.inputPrice;
      const outCost = m.outputPrice === null ? 0 : (outTok / 1_000_000) * m.outputPrice;
      return inCost + outCost;
    }, [inputTokens, outputTokens, m]);

    return (
      <SectionCard title={t("Estimate a request")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{t("Input tokens")}</span>
            <Input value={inputTokens} onChange={(e) => setInputTokens(e.target.value)} inputMode="numeric" dir="ltr" />
          </label>
          {m.outputPrice !== null && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-foreground">{t("Output tokens")}</span>
              <Input value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} inputMode="numeric" dir="ltr" />
            </label>
          )}
        </div>
        <Card className="mt-4 flex items-baseline justify-between">
          <span className="text-[13px] text-muted-foreground">{t("Estimated cost")}</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {num(estimate.toFixed(3))} <span className="text-[13px] font-normal text-muted-foreground">{t("Toman")}</span>
          </span>
        </Card>
      </SectionCard>
    );
  }
}
