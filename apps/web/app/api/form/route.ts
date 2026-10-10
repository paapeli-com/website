/* ------------------------------------------------------------------ */
/* Relay for the site's forms.                                         */
/* The browser used to post straight to Web3Forms, and from inside     */
/* Iran that connection is reset before it gets anywhere, so nothing   */
/* a visitor wrote ever reached the inbox. Here the visitor only talks */
/* to our own domain and this server, which sits outside, hands the    */
/* submission on untouched: JSON stays JSON, and a resume stays the    */
/* multipart body it arrived as.                                       */
/* ------------------------------------------------------------------ */

const FORM_ENDPOINT = "https://api.web3forms.com/submit";

export async function POST(request: Request) {
  try {
    const upstream = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        /* Carries the multipart boundary, so it has to pass through as is. */
        "Content-Type": request.headers.get("content-type") ?? "application/json",
        Accept: "application/json",
      },
      body: await request.arrayBuffer(),
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json({ success: false, message: "relay failed" }, { status: 502 });
  }
}
