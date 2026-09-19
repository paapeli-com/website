/* The same inbox the website's contact form writes to.
 *
 * Source of truth: apps/web/app/[lang]/contact/page.tsx. Web3Forms delivers a
 * submission to our team's mailbox; the access key is a submit-only token that
 * reads nothing back, which is why it sits in the page there and can sit in
 * the bundle here. Copied rather than shared because the panel and the
 * marketing site are separate apps with no common package between them — if
 * the key is ever rotated, both files change.
 *
 * Field NAMES are what the email shows as labels, so they are written as
 * labels rather than as variable names.
 */

const FORM_ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = "131ad66a-900d-4406-ae8b-9d13562a36cc";

export interface ContactRequest {
  /** Email subject. Must say what the message is about on its own. */
  subject: string;
  /** Label/value pairs, rendered as the body of the email. */
  fields: Record<string, string | undefined>;
}

/** Send a request to the team inbox. Throws if it doesn't get through. */
export async function sendContactRequest({ subject, fields }: ContactRequest): Promise<void> {
  const payload: Record<string, string> = {
    access_key: ACCESS_KEY,
    /* Distinguishes these from the website's own submissions at a glance. */
    from_name: "Paapeli Panel",
    subject,
  };
  for (const [label, value] of Object.entries(fields)) {
    if (value) payload[label] = value;
  }

  const response = await fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({ success: response.ok }));
  if (!response.ok || !result.success) throw new Error(result.message ?? "submit failed");
}

/** Good enough to catch a typo before it costs someone their reply. */
export const isEmailAddress = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
