/* The shapes AI Inference reads.
 *
 * There is no inference service behind @paapeli/api yet: no model catalogue,
 * no usage rollup, no request log. These types are the contract the pages are
 * written against, so that swapping the fixture adapter in lib/catalog.ts for
 * a real query is a change in one file rather than in every page.
 *
 * Everything the adapter returns today is a labelled fixture. The pages say so
 * on screen (see the preview footer), because a price or a token count that
 * looks measured but is not is worse than no number at all.
 */

export type ModelTask = "chat" | "code" | "embedding";

export type ModelCapability =
  | "tools"
  | "json"
  | "streaming"
  | "vision";

export interface InferenceModel {
  /** Stable id used in the API and in the URL. */
  id: string;
  /** The id a request carries, e.g. "Qwen/Qwen3-8B". */
  modelId: string;
  name: string;
  publisher: string;
  task: ModelTask;
  capabilities: ModelCapability[];
  /** Serving context the service actually offers, not the model's maximum. */
  contextTokens: number;
  maxOutputTokens: number | null;
  /** Toman per 1M tokens. Output is null for an embedding model. */
  inputPrice: number;
  outputPrice: number | null;
  /** Embedding models only. */
  dimensions: number | null;
  available: boolean;
  description: string;
  /** Where the published weights live, for the "source model card" link. */
  sourceUrl: string | null;
}

export interface UsageByModel {
  modelId: string;
  requests: number;
  inputTokens: number;
  outputTokens: number | null;
  cost: number;
}

export interface UsageDay {
  /** ISO date. */
  date: string;
  cost: number;
}

export interface UsageSummary {
  cost: number;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  daily: UsageDay[];
  byModel: UsageByModel[];
}

export type RequestStatus = "ok" | "rate_limited" | "unavailable" | "error";

export interface InferenceRequest {
  id: string;
  /** ISO date-time, always UTC from the service. */
  at: string;
  modelId: string;
  status: RequestStatus;
  httpStatus: number;
  inputTokens: number;
  outputTokens: number | null;
  latencySeconds: number;
  cost: number;
}

export interface ModelRateLimit {
  modelId: string;
  requestsPerMinute: number;
  tokensPerMinute: number;
}

export interface ProjectBudget {
  /** Toman. */
  monthly: number;
  spent: number;
  alertPercent: number;
  pauseAtLimit: boolean;
}

export interface InferenceProject {
  id: string;
  name: string;
}
