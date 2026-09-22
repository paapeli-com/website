import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Code2, Copy, Play, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Textarea } from "@/features/factory/components/ui/textarea";
import { Switch } from "@/features/factory/components/ui/switch";
import { Slider } from "@/features/factory/components/ui/slider";
import { AI_INFERENCE_BASE } from "@/shell/nav/aiInferenceNav";
import { listAvailableModels, PROPOSED_BASE_URL } from "../lib/catalog";
import type { InferenceModel } from "../lib/types";
import { useT } from "../i18n";
import { Badge, Page, PageHead, SectionCard, useAmount, useCurrency, useNum } from "../ui";

/* The playground.
 *
 * Two shapes, not one with irrelevant controls greyed out: a chat model takes
 * a temperature, an output limit and streaming; an embedding model takes none
 * of those and returns a vector. Showing an output-token price next to an
 * embedding model would be inventing a charge that does not exist.
 *
 * NOTHING HERE CALLS A MODEL. There is no inference service yet, so running a
 * prompt returns a canned preview, marked as one on screen. The alternative —
 * a convincing fake answer — is the kind of thing someone demos to a customer.
 */

const PREVIEW_ANSWER =
  "پاپلی مدیریت زیرساخت هوش مصنوعی را بر عهده می‌گیرد تا توسعه‌دهندگان روی محصولشان تمرکز کنند.";
const PREVIEW_PROMPT =
  "این متن را کوتاه کن: پاپلی زیرساخت اجرای مدل‌های هوش مصنوعی را مدیریت می‌کند تا توسعه‌دهندگان روی ساخت محصول خود تمرکز کنند.";
const PREVIEW_EMBEDDING_INPUT = "پاپلی زیرساخت ابری برای اجرای مدل‌های هوش مصنوعی ارائه می‌دهد.";

/* A fixed vector, so the bars are a picture of these numbers rather than
   decoration that reshuffles on every render. */
const PREVIEW_VECTOR = [
  0.02148, -0.06371, 0.00892, 0.04416, -0.01725, 0.0328, -0.04812, 0.01109, 0.05237, -0.02684,
  0.03391, -0.00947, 0.02215, 0.04903, -0.03118, 0.01476, -0.05024, 0.02871, 0.00633, -0.04187,
  0.03755, -0.01298, 0.04461, -0.02036, 0.01822,
];

export default function Playground() {
  const t = useT();
  const currency = useCurrency();
  const num = useNum();
  const amount = useAmount();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const models = useMemo(() => listAvailableModels(), []);
  const [modelId, setModelId] = useState(params.get("model") ?? models[0].id);
  const model = models.find((m) => m.id === modelId) ?? models[0];
  const isEmbedding = model.task === "embedding";

  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant. Answer clearly and concisely.");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState("1024");
  const [stream, setStream] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [shown, setShown] = useState<{ prompt: string; answer: string } | null>({
    prompt: PREVIEW_PROMPT,
    answer: PREVIEW_ANSWER,
  });
  const [embeddingInput, setEmbeddingInput] = useState("");
  const [embeddingShown, setEmbeddingShown] = useState<string | null>(PREVIEW_EMBEDDING_INPUT);

  /* Switching model throws away the previous model's answer rather than
     leaving it under a new name. */
  const previousModel = useRef(model.id);
  useEffect(() => {
    if (previousModel.current === model.id) return;
    previousModel.current = model.id;
    setShown(null);
    setEmbeddingShown(null);
  }, [model.id]);

  const run = () => {
    const text = prompt.trim();
    if (!text) return;
    setShown({ prompt: text, answer: PREVIEW_ANSWER });
    setPrompt("");
  };

  const embed = () => {
    const text = embeddingInput.trim();
    if (!text) return;
    setEmbeddingShown(text);
    setEmbeddingInput("");
  };

  const maxAbs = Math.max(...PREVIEW_VECTOR.map((v) => Math.abs(v)));

  return (
    <Page>
      <PageHead
        title={t("Playground")}
        description={t("Test model inputs and inspect the response before integrating.")}
        actions={
          <Button variant="outline" onClick={() => navigate(`${AI_INFERENCE_BASE}/integration`)}>
            <Code2 className="size-4 me-2" />
            {t("View API code")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard title={t("Configuration")}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{t("Model")}</span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={isEmbedding ? "embedding" : "chat"}>
              {t(isEmbedding ? "Embedding" : model.task === "code" ? "Code" : "Chat")}
            </Badge>
            <Badge tone="ok">{t("Available")}</Badge>
          </div>

          {isEmbedding ? (
            <EmbeddingConfig model={model} />
          ) : (
            <>
              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-foreground">{t("System instructions")}</span>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </label>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-foreground">{t("Temperature")}</span>
                  <span className="tabular-nums text-muted-foreground">{num(temperature.toFixed(1))}</span>
                </div>
                <Slider
                  className="mt-2"
                  value={[temperature]}
                  min={0}
                  max={2}
                  step={0.1}
                  onValueChange={([v]) => setTemperature(v)}
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{t("Precise")} · {num(0)}</span>
                  <span>{t("Creative")} · {num(2)}</span>
                </div>
              </div>

              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-foreground">{t("Max output tokens")}</span>
                <Input value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} inputMode="numeric" dir="ltr" />
              </label>

              {model.capabilities.includes("streaming") && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-foreground">{t("Stream response")}</span>
                  <Switch checked={stream} onCheckedChange={setStream} />
                </div>
              )}
            </>
          )}

          <div className="mt-4 border-t border-border pt-3 text-[13px]">
            <p className="text-muted-foreground">{t("Input")} / 1M {t("tokens")}</p>
            <p className="font-semibold text-foreground tabular-nums">
              {amount(model.inputPrice)} {currency}
            </p>
            {/* No output price for an embedding model: it does not bill one. */}
            {model.outputPrice !== null && (
              <>
                <p className="mt-2 text-muted-foreground">{t("Output")} / 1M {t("tokens")}</p>
                <p className="font-semibold text-foreground tabular-nums">
                  {amount(model.outputPrice)} {currency}
                </p>
              </>
            )}
          </div>
        </SectionCard>

        {isEmbedding ? (
          <SectionCard
            title={t("Embedding preview")}
            action={
              <div className="flex items-center gap-2">
                <Badge tone="warn">{t("Preview response")}</Badge>
                <Button variant="outline" size="sm" onClick={() => setEmbeddingShown(null)}>
                  <RotateCcw className="size-3.5 me-1.5" />
                  {t("Clear")}
                </Button>
              </div>
            }
          >
            {embeddingShown && (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{t("Input text")}</p>
                  <p className="mt-1 text-sm text-foreground">{embeddingShown}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">{t("Vector output")}</h3>
                  <Badge tone="embedding">
                    {amount(model.dimensions ?? 0)} {t("dimensions")}
                  </Badge>
                </div>
                {/* Bar heights are these numbers, not decoration. */}
                <div className="mt-3 flex h-20 items-center gap-1.5" dir="ltr">
                  {PREVIEW_VECTOR.map((v, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-sm bg-violet-400/70"
                      style={{ height: `${Math.max(12, (Math.abs(v) / maxAbs) * 100)}%` }}
                    />
                  ))}
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs" dir="ltr">
{`[ ${PREVIEW_VECTOR.slice(0, 4).map((v) => v.toFixed(5)).join(", ")},
  ${PREVIEW_VECTOR.slice(4, 6).map((v) => v.toFixed(5)).join(", ")}, ... ]`}
                </pre>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("First values shown · illustrative vector, not a computed embedding")}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3 text-[13px]">
                  <span className="text-muted-foreground">
                    {t("Input")} <span className="font-medium text-foreground">{num(26)} {t("tokens")}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {t("Latency")} <span className="font-medium text-foreground">{num("0.18")} s</span>
                  </span>
                  <span className="text-muted-foreground">
                    {t("Cost")} <span className="font-medium text-foreground">{num("0.039")} {currency}</span>
                  </span>
                </div>
              </>
            )}

            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setEmbeddingInput(PREVIEW_EMBEDDING_INPUT)}>
                {t("Semantic search example")}
              </Button>
              <Textarea
                value={embeddingInput}
                onChange={(e) => setEmbeddingInput(e.target.value)}
                rows={3}
                placeholder={t("Enter text to create an embedding…")}
                className="mt-3 resize-none"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{t("Embedding output is a numeric vector")}</span>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={embed}>
                  <Play className="size-4 me-2" />
                  {t("Generate embedding")}
                </Button>
              </div>
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            title={t("Chat preview")}
            action={
              <div className="flex items-center gap-2">
                <Badge tone="warn">{t("Preview response")}</Badge>
                <Button variant="outline" size="sm" onClick={() => setShown(null)}>
                  <RotateCcw className="size-3.5 me-1.5" />
                  {t("Clear")}
                </Button>
              </div>
            }
          >
            <div className="min-h-[220px]">
              {shown && (
                <>
                  <div className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      M
                    </span>
                    <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">{t("You")}</p>
                      <p className="mt-1 text-sm text-foreground">{shown.prompt}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="size-3.5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{model.name}</p>
                      <p className="mt-1 text-sm text-foreground">{shown.answer}</p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => void navigator.clipboard.writeText(shown.answer)}
                          aria-label={t("Copied")}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {shown && (
              <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3 text-[13px]">
                <span className="text-muted-foreground">
                  {t("Input")} <span className="font-medium text-foreground">{num(56)} {t("tokens")}</span>
                </span>
                <span className="text-muted-foreground">
                  {t("Output")} <span className="font-medium text-foreground">{num(31)} {t("tokens")}</span>
                </span>
                <span className="text-muted-foreground">
                  {t("Latency")} <span className="font-medium text-foreground">{num("0.92")} s</span>
                </span>
                <span className="text-muted-foreground">
                  {t("Cost")} <span className="font-medium text-foreground">{num("0.745")} {currency}</span>
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setPrompt(PREVIEW_PROMPT)}>
                {t("Summarize in Persian")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrompt("Write a TypeScript function that debounces a callback.")}>
                {t("Write code")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrompt("Translate to English: پاپلی زیرساخت ابری است.")}>
                {t("Translate")}
              </Button>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run();
              }}
              rows={3}
              placeholder={t("Type a message…")}
              className="mt-3 resize-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{t("Ctrl + Enter to run · Project limits apply")}</span>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={run}>
                <Play className="size-4 me-2" />
                {t("Run prompt")}
              </Button>
            </div>
          </SectionCard>
        )}
      </div>
    </Page>
  );

  function EmbeddingConfig({ model: m }: { model: InferenceModel }) {
    return (
      <div className="mt-4 text-[13.5px]">
        <div className="flex items-center justify-between border-b border-border/60 py-2.5">
          <span className="text-muted-foreground">{t("Dimensions")}</span>
          <span className="font-medium text-foreground tabular-nums">{amount(m.dimensions ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border/60 py-2.5">
          <span className="text-muted-foreground">{t("Max input")}</span>
          <span className="font-medium text-foreground tabular-nums">
            {amount(m.contextTokens)} {t("tokens")}
          </span>
        </div>
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-foreground">{t("Encoding format")}</span>
          <select className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary">
            <option>Float</option>
            <option>Base64</option>
          </select>
        </label>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("Embedding models return vectors for search, retrieval and similarity.")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground" dir="ltr">
          {PROPOSED_BASE_URL}/embeddings
        </p>
      </div>
    );
  }
}
