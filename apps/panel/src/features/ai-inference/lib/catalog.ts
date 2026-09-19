import type {
  InferenceModel,
  InferenceProject,
  InferenceRequest,
  ModelRateLimit,
  ProjectBudget,
  UsageSummary,
} from "./types";

/* The adapter every AI Inference page reads through.
 *
 * DEVELOPMENT FIXTURES. There is no inference service behind @paapeli/api yet,
 * so none of this is measured: the catalogue, the prices, the usage rollup and
 * the request log are all written here. The pages carry a preview footer
 * saying exactly that, because a token count that looks measured and is not is
 * worse than no number at all.
 *
 * Deliberately shaped like queries rather than exported constants, so the day
 * the service exists this file is the only one that changes: each function
 * becomes a fetch and the pages keep their call sites.
 *
 * Nothing here is random. A refresh returns the same numbers, so a reader
 * never watches "live" data reshuffle itself.
 */

const LAUNCH_MODELS: InferenceModel[] = [
  {
    id: "qwen3-8b",
    modelId: "Qwen/Qwen3-8B",
    name: "Qwen3 · 8B",
    publisher: "Qwen",
    task: "chat",
    capabilities: ["tools", "json", "streaming"],
    contextTokens: 32_768,
    maxOutputTokens: 8_192,
    inputPrice: 5_000,
    outputPrice: 15_000,
    dimensions: null,
    available: true,
    description:
      "A compact language model for chat, summarization, translation and application workflows. Access this hosted model through a managed API.",
    sourceUrl: "https://huggingface.co/Qwen/Qwen3-8B",
  },
  {
    id: "qwen3-32b",
    modelId: "Qwen/Qwen3-32B",
    name: "Qwen3 · 32B",
    publisher: "Qwen",
    task: "chat",
    capabilities: ["tools", "json", "streaming"],
    contextTokens: 32_768,
    maxOutputTokens: 8_192,
    inputPrice: 20_000,
    outputPrice: 60_000,
    dimensions: null,
    available: true,
    description:
      "A larger general model for work that needs more reasoning than the 8B: longer analysis, harder instructions, multi-step tool use.",
    sourceUrl: "https://huggingface.co/Qwen/Qwen3-32B",
  },
  {
    id: "qwen25-coder-32b",
    modelId: "Qwen/Qwen2.5-Coder-32B-Instruct",
    name: "Qwen2.5 Coder · 32B",
    publisher: "Qwen",
    task: "code",
    capabilities: ["json", "streaming"],
    contextTokens: 32_768,
    maxOutputTokens: 8_192,
    inputPrice: 18_000,
    outputPrice: 50_000,
    dimensions: null,
    available: true,
    description:
      "Code generation, completion and review across common languages, with structured output for tooling.",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct",
  },
  {
    id: "bge-m3",
    modelId: "BAAI/bge-m3",
    name: "BGE-M3",
    publisher: "BAAI",
    task: "embedding",
    capabilities: [],
    contextTokens: 8_192,
    maxOutputTokens: null,
    inputPrice: 1_500,
    outputPrice: null,
    dimensions: 1_024,
    available: true,
    description:
      "A multilingual embedding model for search, retrieval and similarity. Returns a 1,024-dimension vector.",
    sourceUrl: "https://huggingface.co/BAAI/bge-m3",
  },
];

/* The catalogue has to stay usable as it grows, so the pages are exercised
   against more than the launch four. These carry an obviously provisional
   name: they demonstrate paging and filtering, they are not a roadmap. */
const PREVIEW_PLACEHOLDERS: InferenceModel[] = Array.from({ length: 16 }, (_, i) => {
  const n = i + 5;
  const cycle = i % 3;
  const task = cycle === 0 ? "chat" : cycle === 1 ? "code" : "embedding";
  const base = LAUNCH_MODELS.find((m) => m.task === task)!;
  const label = task === "chat" ? "Chat model" : task === "code" ? "Code model" : "Embedding model";
  const slug = task === "chat" ? "chat" : task === "code" ? "code" : "embedding";
  const pad = String(n).padStart(2, "0");
  return {
    ...base,
    id: `preview-${slug}-${pad}`,
    modelId: `preview/${slug}-${pad}`,
    name: `${label} · ${pad}`,
    publisher: "Preview",
    description: base.description,
    /* Not callable: only the launch four are. Marking these available
       would put a number on the catalogue card that no project could
       actually reach. The availability filter is what tells them apart. */
    available: false,
    sourceUrl: null,
  };
});

/** Every model the catalogue offers, launch set first. */
export function listModels(includePlaceholders = true): InferenceModel[] {
  return includePlaceholders ? [...LAUNCH_MODELS, ...PREVIEW_PLACEHOLDERS] : [...LAUNCH_MODELS];
}

export function getModel(id: string): InferenceModel | undefined {
  return listModels().find((m) => m.id === id);
}

/** The models a project can actually call today. */
export function listAvailableModels(): InferenceModel[] {
  return LAUNCH_MODELS.filter((m) => m.available);
}

export const PROJECTS: InferenceProject[] = [
  { id: "production", name: "Production" },
  { id: "staging", name: "Staging" },
];

/* One fixed week, so the chart and the table always agree and neither moves
   when the page is refreshed. */
const DAILY: [string, number][] = [
  ["2026-09-13", 4_800],
  ["2026-09-14", 7_100],
  ["2026-09-15", 9_200],
  ["2026-09-16", 11_400],
  ["2026-09-17", 6_200],
  ["2026-09-18", 12_820],
  ["2026-09-19", 15_800],
];

export function getUsage(): UsageSummary {
  const byModel = [
    { modelId: "qwen3-8b", requests: 7_820, inputTokens: 1_300_000, outputTokens: 640_000, cost: 16_100 },
    { modelId: "qwen3-32b", requests: 2_410, inputTokens: 670_000, outputTokens: 370_000, cost: 35_600 },
    { modelId: "qwen25-coder-32b", requests: 1_580, inputTokens: 330_000, outputTokens: 190_000, cost: 15_440 },
    { modelId: "bge-m3", requests: 670, inputTokens: 120_000, outputTokens: null, cost: 180 },
  ];
  /* Summed from the rows rather than written separately, so the cards can
     never disagree with the table underneath them. */
  return {
    cost: byModel.reduce((sum, r) => sum + r.cost, 0),
    requests: byModel.reduce((sum, r) => sum + r.requests, 0),
    inputTokens: byModel.reduce((sum, r) => sum + r.inputTokens, 0),
    outputTokens: byModel.reduce((sum, r) => sum + (r.outputTokens ?? 0), 0),
    daily: DAILY.map(([date, cost]) => ({ date, cost })),
    byModel,
  };
}

const REQUESTS: InferenceRequest[] = [
  { id: "req_c7e2", at: "2026-09-19T14:32:47Z", modelId: "qwen3-8b", status: "ok", httpStatus: 200, inputTokens: 156, outputTokens: 284, latencySeconds: 1.24, cost: 5.04 },
  { id: "req_b138", at: "2026-09-19T14:31:47Z", modelId: "qwen3-32b", status: "ok", httpStatus: 200, inputTokens: 840, outputTokens: 312, latencySeconds: 2.18, cost: 35.52 },
  { id: "req_f04a", at: "2026-09-19T14:30:47Z", modelId: "bge-m3", status: "rate_limited", httpStatus: 429, inputTokens: 0, outputTokens: null, latencySeconds: 0.02, cost: 0 },
  { id: "req_a910", at: "2026-09-19T14:29:47Z", modelId: "qwen25-coder-32b", status: "ok", httpStatus: 200, inputTokens: 220, outputTokens: 486, latencySeconds: 3.42, cost: 28.26 },
  { id: "req_902d", at: "2026-09-19T14:28:47Z", modelId: "qwen3-8b", status: "unavailable", httpStatus: 503, inputTokens: 0, outputTokens: 0, latencySeconds: 0.08, cost: 0 },
  { id: "req_873e", at: "2026-09-19T14:27:47Z", modelId: "bge-m3", status: "ok", httpStatus: 200, inputTokens: 126, outputTokens: null, latencySeconds: 0.17, cost: 0.19 },
  { id: "req_5511", at: "2026-09-19T14:26:47Z", modelId: "qwen3-8b", status: "ok", httpStatus: 200, inputTokens: 92, outputTokens: 140, latencySeconds: 0.88, cost: 2.56 },
  { id: "req_4d0c", at: "2026-09-19T14:25:47Z", modelId: "qwen3-32b", status: "ok", httpStatus: 200, inputTokens: 512, outputTokens: 208, latencySeconds: 1.96, cost: 22.72 },
  { id: "req_31af", at: "2026-09-19T14:24:47Z", modelId: "qwen25-coder-32b", status: "error", httpStatus: 400, inputTokens: 0, outputTokens: null, latencySeconds: 0.04, cost: 0 },
  { id: "req_2b7d", at: "2026-09-19T14:23:47Z", modelId: "bge-m3", status: "ok", httpStatus: 200, inputTokens: 310, outputTokens: null, latencySeconds: 0.21, cost: 0.47 },
];

export function listRequests(): InferenceRequest[] {
  return REQUESTS;
}

export function getRequest(id: string): InferenceRequest | undefined {
  return REQUESTS.find((r) => r.id === id);
}

export function listRateLimits(): ModelRateLimit[] {
  return [
    { modelId: "qwen3-8b", requestsPerMinute: 120, tokensPerMinute: 100_000 },
    { modelId: "qwen3-32b", requestsPerMinute: 60, tokensPerMinute: 50_000 },
    { modelId: "qwen25-coder-32b", requestsPerMinute: 60, tokensPerMinute: 50_000 },
    { modelId: "bge-m3", requestsPerMinute: 300, tokensPerMinute: 250_000 },
  ];
}

export function getBudget(): ProjectBudget {
  const usage = getUsage();
  return { monthly: 2_000_000, spent: usage.cost, alertPercent: 80, pauseAtLimit: true };
}

/** Proposed address for this design; the real one comes from configuration. */
export const PROPOSED_BASE_URL = "https://inference.paapeli.com/v1";
