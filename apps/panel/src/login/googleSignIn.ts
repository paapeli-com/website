import { useCallback, useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "@/shared/config";
import type { AppLanguage } from "@/shared/i18n/appLanguage";

/* Google Identity Services, the same flow as the gateway team's
   google-signin.html reference: GIS hands us an ID token in a callback, and
   POST /api/v1/aiot/auth/google trades it for a Paapeli bearer token.

   The button has to be Google's own — GIS gives a custom button no way to open
   the account chooser (`prompt()` is One Tap, and the OAuth code flow returns
   a code, not the ID token this endpoint wants). So the disabled placeholder
   button is replaced by a container GIS renders into. */

const SRC = "https://accounts.google.com/gsi/client";

interface CredentialResponse {
  credential: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        use_fedcm_for_button?: boolean;
        itp_support?: boolean;
        auto_select?: boolean;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "small" | "medium" | "large";
          text?: "signin_with" | "signup_with" | "continue_with";
          shape?: "rectangular" | "pill";
          width?: number;
          locale?: string;
        },
      ): void;
      cancel(): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

let scriptPromise: Promise<GoogleIdentityServices> | null = null;

/** Loads the GIS client once per page, however many callers ask for it. */
function loadGis(): Promise<GoogleIdentityServices> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google);

    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // onload fires when the file is parsed; the namespace is there by then.
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error("Google Identity Services loaded without accounts.id"));
    };
    // Blocked by an extension, a content blocker, or an offline network.
    script.onerror = () => reject(new Error("Could not load Google Identity Services"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Decoded claims of a Google ID token, for the session record only. */
export interface GoogleIdentity {
  email?: string;
  name?: string;
}

/* The gateway's response is just `{ token, tokenType }`, but the session record
   wants an email and a display name. Both are claims in the ID token we just
   handed over, so read them from there.

   Decoding without verifying is fine for this: the token came straight from
   GIS, it is only used to label the local session, and the gateway verifies it
   properly before trusting anything. */
export function decodeGoogleIdentity(idToken: string): GoogleIdentity {
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return {};
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    // atob yields bytes; names carry non-ASCII, so re-decode them as UTF-8.
    const utf8 = new TextDecoder().decode(Uint8Array.from(json, (c) => c.charCodeAt(0)));
    const claims = JSON.parse(utf8) as { email?: string; name?: string };
    return { email: claims.email, name: claims.name };
  } catch {
    return {};
  }
}

export type GoogleButtonState = "loading" | "ready" | "failed";

/**
 * Renders Google's sign-in button into `ref` and calls `onCredential` with the
 * ID token when someone signs in. Re-renders on a language change so the
 * button's own text follows the page.
 */
export function useGoogleButton(
  onCredential: (idToken: string) => void,
  language: AppLanguage,
) {
  /* A callback ref, not useRef: the button renders under both the sign-in and
     the sign-up form, so switching mode unmounts one container and mounts
     another. With a plain ref the effect would not re-run and the new
     container would stay empty — the button would vanish on mode switch. */
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const ref = useCallback((el: HTMLDivElement | null) => setNode(el), []);
  const [state, setState] = useState<GoogleButtonState>("loading");

  /* The callback lands inside GIS, which we initialize once per container —
     keep the latest handler in a ref so it always sees current state without
     re-initializing. */
  const handler = useRef(onCredential);
  handler.current = onCredential;

  useEffect(() => {
    if (!node) return;
    let cancelled = false;

    loadGis()
      .then((google) => {
        if (cancelled) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            console.info("[google] ID token received, calling the gateway");
            handler.current(response.credential);
          },
          /* Opt out of FedCM so the click opens Google's own popup account
             chooser ("to continue to Paapeli") rather than Chrome's native
             FedCM sheet ("Sign in to localhost with google.com"). Both return
             the same ID token to the callback below — this is purely which
             chooser the user sees.

             Worth knowing: Chrome is migrating this button to FedCM and this
             opt-out is temporary, so the popup path will eventually stop
             being available. If a click ever goes back to doing nothing at
             all, flip this to true first. */
          use_fedcm_for_button: false,
          itp_support: true,
          // Never sign someone in without them clicking.
          auto_select: false,
        });

        /* Google caps the button at 400px and ignores CSS width, so measure
           the container instead of hardcoding the card's inner width. */
        const width = Math.min(node.offsetWidth || 320, 400);
        node.innerHTML = "";
        google.accounts.id.renderButton(node, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width,
          locale: language,
        });

        setState("ready");
      })
      .catch((error) => {
        console.error("[google] Identity Services failed to load", error);
        if (!cancelled) setState("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [node, language]);

  return { ref, state };
}
