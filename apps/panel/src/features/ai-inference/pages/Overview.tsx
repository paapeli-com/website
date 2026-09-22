import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight, Code2, Key, Layers, Play, TestTube, Wallet } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { AI_INFERENCE_BASE, centralApiKeysPath } from "@/shell/nav/aiInferenceNav";
import { getBudget, getUsage, listAvailableModels } from "../lib/catalog";
import { listKeysForProduct } from "@/shared/lib/apiKeys";
import { AI_INFERENCE_PRODUCT_ID } from "@/shared/lib/productRegistry";
import { useT } from "../i18n";
import { Badge, MetricCard, MetricRow, Page, PageHead, SectionCard, useAmount, useCurrency, useNum } from "../ui";
import { useProject } from "../routes";

/* The product's front door: what it cost, what it is allowed to reach, and
   the three steps between a new project and a first request. */
export default function Overview() {
  const t = useT();
  const currency = useCurrency();
  const num = useNum();
  const amount = useAmount();
  const navigate = useNavigate();
  const { projectId } = useProject();

  const usage = getUsage();
  const budget = getBudget();
  const models = listAvailableModels();
  /* The count comes from the central registry, not from a list of this
     product's own: there isn't one, and that is the point. */
  const keys = listKeysForProduct(AI_INFERENCE_PRODUCT_ID, projectId).filter((k) => k.status === "active");

  const steps = [
    {
      n: 1,
      title: t("Choose your model"),
      body: t("Browse text, code and embedding models."),
      action: t("Explore models"),
      icon: Layers,
      onClick: () => navigate(`${AI_INFERENCE_BASE}/models`),
    },
    {
      n: 2,
      title: t("Try a prompt"),
      body: t("Test inputs and inspect the response format."),
      action: t("Open playground"),
      icon: TestTube,
      onClick: () => navigate(`${AI_INFERENCE_BASE}/playground`),
    },
    {
      n: 3,
      title: t("Connect your app"),
      body: t("Create a key and copy an API example."),
      action: t("Get API code"),
      icon: Code2,
      onClick: () => navigate(`${AI_INFERENCE_BASE}/integration`),
    },
  ];

  const spentPercent = Math.min(100, (budget.spent / budget.monthly) * 100);

  return (
    <Page>
      <PageHead
        title={t("Overview")}
        description={t("Your inference project at a glance.")}
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate(`${AI_INFERENCE_BASE}/playground`)}
          >
            <Play className="size-4 me-2" />
            {t("Try a model")}
          </Button>
        }
      />

      <MetricRow>
        <MetricCard active label={t("This month")} value={amount(usage.cost)} unit={currency} icon={Wallet} />
        <MetricCard label={t("Requests")} value={amount(usage.requests)} unit={t("calls")} icon={Activity} tone="blue" />
        <MetricCard
          label={t("Total tokens")}
          value={`${num(((usage.inputTokens + usage.outputTokens) / 1_000_000).toFixed(2))}M`}
          unit={t("tokens")}
          icon={Layers}
          tone="violet"
        />
        <MetricCard label={t("Active API keys")} value={num(keys.length)} unit={t("keys")} icon={Key} tone="emerald" />
      </MetricRow>

      <div className="mt-5">
        <SectionCard
          title={t("Get started in three steps")}
          action={<Badge tone="warn">{t("OpenAI-compatible API")}</Badge>}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-[13px] font-semibold text-primary">
                  {num(s.n)}
                </span>
                <h3 className="text-[15px] font-bold text-foreground">{s.title}</h3>
                <p className="text-[13px] text-muted-foreground">{s.body}</p>
                <Button variant="outline" size="sm" className="mt-1 self-start" onClick={s.onClick}>
                  <s.icon className="size-4 me-2" />
                  {s.action}
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
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

        <SectionCard title={t("Budget this month")}>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold leading-none text-foreground tabular-nums">{amount(budget.spent)}</span>
            <span className="text-[13px] text-muted-foreground">{currency}</span>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("of")} {amount(budget.monthly)} {currency} · {t("Monthly budget")}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${spentPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Send a budget alert at")} {num(budget.alertPercent)}%
          </p>
          <Button variant="link" className="mt-2 h-auto p-0 text-primary" onClick={() => navigate(`${AI_INFERENCE_BASE}/limits`)}>
            {t("Manage budget")}
            <ArrowRight className="size-4 ms-1.5 rtl:rotate-180" />
          </Button>
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <Code2 className="size-4 text-primary" />
              {t("One API. All your models.")}
            </span>
          }
          action={
            <Button variant="link" className="h-auto p-0 text-primary" onClick={() => navigate(`${AI_INFERENCE_BASE}/integration`)}>
              {t("View integration guide")}
              <ArrowRight className="size-4 ms-1.5 rtl:rotate-180" />
            </Button>
          }
        >
          <p className="text-[13px] text-muted-foreground">
            {t("Change the model ID in your request to switch models.")}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate(centralApiKeysPath(projectId))}>
            <Key className="size-4 me-2" />
            {t("Open central API keys")}
          </Button>
        </SectionCard>
      </div>
    </Page>
  );
}
