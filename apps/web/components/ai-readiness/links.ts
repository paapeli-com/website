/**
 * Every destination the AI-Readiness pages link to.
 *
 * The assessment flow, the sample output and report No. 0 are not built yet,
 * so they currently resolve to in-page anchors. When the real routes land,
 * change the value here — no section component needs to be touched.
 */

/** Landing page root. The bare path works because middleware.ts rewrites
 *  locale-less URLs onto the `en` segment. */
export const AI_BASE = '/AI-Readiness-Assessment';

export const aiLinks = {
  /** Primary conversion: entry into the assessment app. */
  startAssessment: `${AI_BASE}/start`,
  /** Step 2 of the app: the short intake questionnaire. */
  intake: `${AI_BASE}/start/intake`,
  /** Where the organisational tier's CTA leads — a request form, not a
   *  paywall and not the ordinary assessment. */
  orgRequest: `${AI_BASE}/start/organization`,
  /** "مشاهده خروجی نمونه" — the example diagnosis. */
  sampleOutput: '#output',
  /** "مطالعه گزارش" — the AI-in-Iran report page. */
  report: `${AI_BASE}/report`,

  /** Navbar "روش‌شناسی": scrolls to the summary section on the landing page. */
  methodologyAnchor: '#methodology',
  /** "مشاهده روش‌شناسی": the full methodology page. */
  methodologyPage: `${AI_BASE}/methodology`,
  /** "درباره ارزیابی": the about page. */
  aboutPage: `${AI_BASE}/about`,
  /** The landing page itself, for links coming back from a sub-page. */
  landing: AI_BASE,
} as const;

/** Section ids, kept next to the links so anchors and targets stay in sync. */
export const aiSections = {
  top: 'top',
  why: 'why',
  dimensions: 'dimensions',
  experience: 'experience',
  output: 'output',
  methodology: 'methodology',
  steps: 'steps',
  finalCta: 'final-cta',
} as const;

/** Outbound company sites, opened in a new tab. */
export const companySites = {
  paapeli: 'https://paapeli.com',
  rayka: 'https://raykaconsulting.com',
} as const;

/** Sections that only exist on the report page. */
export const reportSections = {
  top: 'top',
  highlights: 'highlights',
  audience: 'audience',
  download: 'download',
  archive: 'archive',
  finalCta: 'final-cta',
} as const;

/** Sections that only exist on the about page. */
export const aboutSections = {
  top: 'top',
  why: 'why',
  who: 'who',
  partnership: 'partnership',
  research: 'research',
  outcome: 'outcome',
  finalCta: 'final-cta',
} as const;

/** Sections that only exist on the methodology page. */
export const methodologySections = {
  top: 'top',
  pillars: 'pillars',
  sources: 'sources',
  dimensions: 'dimensions',
  maturity: 'maturity',
  pipeline: 'pipeline',
  data: 'data',
  transparency: 'transparency',
  finalCta: 'final-cta',
} as const;
