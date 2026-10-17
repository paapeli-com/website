import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/lib/toast";
import { Copy, Info, Key, Plus, Shield } from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { centralApiKeysPath } from "@/shell/nav/aiInferenceNav";
import { listAvailableModels, PROPOSED_BASE_URL } from "../lib/catalog";
import { useT } from "../i18n";
import { Badge, DetailRow, Page, PageHead, SectionCard, useNum } from "../ui";
import { useProject } from "../routes";

/* How to call the service.
 *
 * Every snippet reads the key from an environment variable. None of them can
 * print a real secret, because the console never holds one after the moment it
 * is created — see shared/lib/apiKeys.ts.
 */

type Lang = "curl" | "python" | "javascript";

export default function ApiIntegration() {
  const t = useT();
  const num = useNum();
  const navigate = useNavigate();
  const { projectId } = useProject();

  const models = listAvailableModels().filter((m) => m.task !== "embedding");
  const [modelId, setModelId] = useState(models[0]?.modelId ?? "");
  const [lang, setLang] = useState<Lang>("python");

  const snippets: Record<Lang, string> = {
    curl: `curl ${PROPOSED_BASE_URL}/chat/completions \\
  -H "Authorization: Bearer $PAAPELI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modelId}",
    "messages": [{"role": "user", "content": "Summarize this text…"}],
    "max_tokens": 1024
  }'`,
    python: `# pip install openai
from openai import OpenAI
import os

client = OpenAI(
    base_url="${PROPOSED_BASE_URL}",
    api_key=os.environ["PAAPELI_API_KEY"],
)

response = client.chat.completions.create(
    model="${modelId}",
    messages=[{
        "role": "user",
        "content": "Summarize this text…"
    }],
    max_tokens=1024,
)

print(response.choices[0].message.content)`,
    javascript: `// npm install openai
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${PROPOSED_BASE_URL}",
  apiKey: process.env.PAAPELI_API_KEY,
});

const response = await client.chat.completions.create({
  model: "${modelId}",
  messages: [{ role: "user", content: "Summarize this text…" }],
  max_tokens: 1024,
});

console.log(response.choices[0].message.content);`,
  };

  const steps = [
    {
      n: 1,
      title: t("Create an API key"),
      body: t("Choose model access and an expiration date."),
    },
    {
      n: 2,
      title: t("Set your environment variable"),
      body: t("Keep PAAPELI_API_KEY in your backend."),
    },
    {
      n: 3,
      title: t("Send your first request"),
      body: t("Choose a model ID and inspect the response."),
    },
  ];

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(t("Copied"));
  };

  return (
    <Page>
      <PageHead
        title={t("API integration")}
        description={t("Connect your application using an OpenAI-compatible client.")}
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate(centralApiKeysPath(projectId) + "&create=1")}
          >
            <Plus className="size-4 me-2" />
            {t("Create API key")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title={t("Quick start")} action={<Badge tone="warn">REST API</Badge>}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{t("Model")}</span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              {models.map((m) => (
                <option key={m.id} value={m.modelId}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{t("Base URL")}</span>
            <span className="flex items-center gap-2">
              <code
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                dir="ltr"
              >
                {PROPOSED_BASE_URL}
              </code>
              <Button variant="ghost" size="icon" onClick={() => copy(PROPOSED_BASE_URL)} aria-label={t("Copied")}>
                <Copy className="size-4" />
              </Button>
            </span>
          </label>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            {t("Proposed API address for this design.")}
          </p>

          <div className="mt-4 overflow-hidden rounded-lg bg-slate-900">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2" dir="ltr">
              <div className="flex gap-4">
                {(["curl", "python", "javascript"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={
                      lang === l
                        ? "text-xs font-medium text-white"
                        : "text-xs text-slate-400 hover:text-slate-200"
                    }
                  >
                    {l === "curl" ? "cURL" : l === "python" ? "Python" : "JavaScript"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => copy(snippets[lang])}
                className="text-slate-300 hover:text-white"
                aria-label={t("Copied")}
              >
                <Copy className="size-4" />
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-100" dir="ltr">
              {snippets[lang]}
            </pre>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-5">
          <SectionCard title={t("Connect in three steps")}>
            {steps.map((s) => (
              <div key={s.n} className="flex gap-3 border-b border-border/60 py-3 last:border-0">
                <span className="text-sm text-muted-foreground tabular-nums">{num(s.n)}</span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-foreground">{s.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate(centralApiKeysPath(projectId))}
            >
              <Key className="size-4 me-2" />
              {t("Open central API keys")}
            </Button>
          </SectionCard>

          <SectionCard title={t("Supported endpoints")}>
            <DetailRow label={t("Chat")} value={<code className="font-mono text-xs" dir="ltr">POST /chat/completions</code>} />
            <DetailRow label={t("Embeddings")} value={<code className="font-mono text-xs" dir="ltr">POST /embeddings</code>} />
            <DetailRow label={t("Model catalog")} value={<code className="font-mono text-xs" dir="ltr">GET /models</code>} />
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="size-3.5" />
              <code className="font-mono" dir="ltr">Authorization: Bearer &lt;API_KEY&gt;</code>
            </p>
          </SectionCard>
        </div>
      </div>
    </Page>
  );
}
