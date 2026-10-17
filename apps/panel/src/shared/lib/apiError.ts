/* The gateway returns RFC 7807-style problem details on failure:
 *
 *   { code: "EXTERNAL_API_CALL_ERROR",
 *     detail: "Asset with such name already exists!",
 *     instance: "/api/v1/aiot/assets/063c7807-…",
 *     status: 400,
 *     title: "Error calling external API" }
 *
 * `detail` is the part that says what actually went wrong; `title` is the
 * generic class of error. Some older endpoints send `{ message }` instead.
 * Callers used to drop all of it and show a fixed string like "Failed to
 * create asset", which told the user nothing they could act on.
 */
interface ProblemDetail {
  detail?: unknown;
  message?: unknown;
  title?: unknown;
}

const asText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * The most specific message the server gave, or `fallback` when it gave none.
 *
 * Prefer this over a hardcoded failure string in every error toast — pass the
 * translated generic message as the fallback so an offline or non-HTTP failure
 * (where there is no response body) still reads sensibly.
 */
/**
 * The problem's machine-readable `code` and the extra fields some refusals
 * carry, for callers that answer each refusal differently.
 */
export function apiProblem(error: unknown): {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
  attemptsLeft?: number;
} {
  const response = (error as { response?: { status?: number; data?: Record<string, unknown> } })?.response;
  const data = response?.data ?? {};
  const num = (value: unknown) => (typeof value === "number" ? value : undefined);
  return {
    status: response?.status,
    code: asText(data.code),
    retryAfterSeconds: num(data.retryAfterSeconds),
    attemptsLeft: num(data.attemptsLeft),
  };
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: ProblemDetail } })?.response?.data;
  if (!data) return fallback;
  return asText(data.detail) ?? asText(data.message) ?? asText(data.title) ?? fallback;
}
