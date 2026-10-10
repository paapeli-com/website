/* Where a form on this site goes to reach our inbox.
 *
 * Our own relay (app/api/form/route.ts) is tried first, because a visitor
 * in Iran cannot reach Web3Forms directly. The direct address stays as the
 * second try, so a relay that is down or refused costs nobody their message.
 */
const FORM_ENDPOINTS = ["/api/form", "https://api.web3forms.com/submit"];

/** Sends one body, and says only whether it landed. */
export async function submitForm(body: BodyInit, headers?: HeadersInit): Promise<boolean> {
  for (const endpoint of FORM_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, { method: "POST", headers, body });
      const result = await response.json().catch(() => ({ success: response.ok }));
      if (response.ok && result.success !== false) return true;
    } catch {
      /* Unreachable from here: the next address may not be. */
    }
  }
  return false;
}
