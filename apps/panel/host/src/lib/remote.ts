/* ------------------------------------------------------------------ */
/* Loading a federated remote, reliably.                               */
/*                                                                     */
/* A remote can fail to load for reasons that have nothing to do with   */
/* our code: in dev, `vite build --watch` rewrites the remote's dist on  */
/* every save, so a chunk requested mid-rebuild 404s; in prod, a browser */
/* holding a page open across a deploy asks for chunk hashes that no     */
/* longer exist.                                                        */
/*                                                                     */
/* The problem is that such a failure is normally PERMANENT for the life */
/* of the document, which is why only a hard reload used to fix it:      */
/*   · the browser's module map caches a failed dynamic import, so       */
/*     re-importing the same URL replays the same error without ever     */
/*     hitting the network again;                                        */
/*   · remoteEntry.js memoises the promise for each exposed chunk        */
/*     (rejections included) and remembers which stylesheet hrefs it has  */
/*     already injected, so a CSS file that 404'd is never re-added —     */
/*     the remote then renders with the host's stylesheet only, which is  */
/*     the "styles are off" half of the symptom;                          */
/*   · React.lazy caches the rejected promise too.                       */
/*                                                                     */
/* Every one of those caches is keyed by URL, so the retry below asks    */
/* for a URL none of them has seen (?__attempt=N). That yields a fresh    */
/* remoteEntry module instance with empty caches, which re-imports the    */
/* exposed chunk and re-injects the stylesheet.                          */
/*                                                                     */
/* vite.config.ts wires __paapeliRemoteUrl into the federation runtime   */
/* as a promise-typed external, so it is consulted on every attempt.     */
/* ------------------------------------------------------------------ */

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;
/* A stylesheet that neither loads nor errors shouldn't hold the UI
   hostage — render unstyled rather than hang on a stalled request. */
const STYLESHEET_TIMEOUT_MS = 4000;

declare global {
  // eslint-disable-next-line no-var
  var __paapeliRemoteUrl: ((name: string, url: string) => string) | undefined;
}

const attempts: Record<string, number> = {};

globalThis.__paapeliRemoteUrl = (name, url) => {
  const attempt = attempts[name] ?? 0;
  if (!attempt) return url;
  return `${url}${url.includes("?") ? "&" : "?"}__attempt=${attempt}`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const stylesheets = () => Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));

/** Resolve once `link` has applied; reject if the browser failed to fetch it. */
function settleStylesheet(link: HTMLLinkElement): Promise<void> {
  // `sheet` is set as soon as the stylesheet is applied (cross-origin
  // included — only reading its rules is blocked), so a link that landed
  // before we got here needs no waiting.
  if (link.sheet) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timer);
      link.removeEventListener("load", onLoad);
      link.removeEventListener("error", onError);
    };
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      link.remove(); // so the retry's fresh injection isn't a duplicate
      reject(new Error(`stylesheet failed to load: ${link.href}`));
    };
    const timer = window.setTimeout(onLoad, STYLESHEET_TIMEOUT_MS);
    link.addEventListener("load", onLoad);
    link.addEventListener("error", onError);
  });
}

/**
 * Import a federated remote, retrying transient failures on a fresh URL.
 *
 * Also waits for the stylesheets the remote injects while loading. The
 * federation runtime appends them to <head> and moves straight on to the
 * module, so without this the remote's markup can paint a frame or two
 * before its CSS applies — and a stylesheet that 404s would go unnoticed
 * instead of triggering a retry.
 */
export async function loadRemote<T>(name: string, load: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const before = new Set(stylesheets());
    try {
      const mod = await load();
      await Promise.all(stylesheets().filter((link) => !before.has(link)).map(settleStylesheet));
      return mod;
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) throw error;
      console.warn(`[host] remote "${name}" failed to load (attempt ${attempt}), retrying:`, error);
      attempts[name] = attempt; // next __paapeliRemoteUrl call busts every cache
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
}
