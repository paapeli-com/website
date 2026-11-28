import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * Crawlers are welcome everywhere except the assessment funnel, which
 * only renders something meaningful part-way through a form.
 *
 * Note that Cloudflare can serve its own managed robots.txt in front of
 * this one; if the deployed /robots.txt has no Sitemap line, that switch
 * is on in the dashboard and this file never reaches a crawler.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /* Only the assessment's form steps. The report is a public article
           that asks to be indexed, so it is not blocked here. */
        disallow: ["/AI-Readiness-Assessment/start"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
