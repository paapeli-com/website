/**
 * The customer dashboard, which lives on its own host rather than under the
 * marketing site. Signed-out visitors get the login screen and are handed
 * back to the dashboard once they are in, so this is the right destination
 * for "Start Free" whether or not someone already has an account.
 *
 * Always link to it with a plain <a>: next/link would try to route it
 * client-side, and this is a full navigation to another origin.
 */
export const PANEL_URL = "https://panel.paapeli.com";
