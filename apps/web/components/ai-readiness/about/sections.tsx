import Link from 'next/link';
import { ChevronLeft, CheckCircle2, Info, Quote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Container, PrimaryButton, SectionHeading } from '../primitives';
import { Reveal } from '../Reveal';
import { PaapeliMark, RaykaWordmark } from '../Logos';
import { aiLinks, aboutSections as S } from '../links';
import { AboutVisual } from './AboutVisual';
import {
  companies,
  heroLead,
  outcomeCards,
  partnershipCards,
  partnershipLead,
  researchNote,
  researchQuotes,
  whyCards,
  whyFootnote,
} from './content';

/* ------------------------------------------------------------------ */
/* Shared card                                                         */
/* ------------------------------------------------------------------ */

function IconCard({
  icon: Icon,
  title,
  body,
  tone = 'green',
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone?: 'green' | 'orange';
}) {
  const accent = tone === 'orange' ? 'text-[var(--ai-orange-soft)]' : 'text-[var(--ai-green)]';
  return (
    <article className="flex h-full flex-col items-center rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 py-7 text-center transition-colors duration-200 hover:border-[var(--ai-green-hover)]">
      <Icon className={`h-6 w-6 ${accent}`} strokeWidth={1.6} />
      <h3 className="mt-4 text-[15px] font-bold text-[var(--ai-text)]">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-[1.95] text-[var(--ai-muted)]">{body}</p>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function AboutHero() {
  return (
    <section
      id={S.top}
      aria-labelledby="a-hero-heading"
      className="ai-readiness-glow relative overflow-hidden"
    >
      <Container className="relative pb-12 pt-12 md:pb-16 md:pt-16">
        {/* Copy first → right-hand column in RTL, matching the landing page. */}
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.15fr] md:gap-8 lg:gap-14">
          <Reveal>
            <h1
              id="a-hero-heading"
              className="text-[30px] font-bold leading-[1.45] text-[var(--ai-text)] sm:text-[36px] md:text-[42px]"
            >
              درباره ارزیابی
            </h1>

            <p className="mt-5 max-w-[34rem] text-[14.5px] leading-[2.1] text-[var(--ai-muted)]">
              {heroLead}
            </p>

            <div className="mt-7">
              <PrimaryButton href={aiLinks.startAssessment} size="lg">
                شروع ارزیابی
              </PrimaryButton>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <AboutVisual />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Why it matters                                                      */
/* ------------------------------------------------------------------ */

export function WhyItMattersSection() {
  return (
    <section id={S.why} aria-labelledby="a-why-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="a-why-heading"
          pill="چرا مهم است"
          title="این ارزیابی چرا مهم است؟"
          lead="بر اساس پژوهش‌های جهانی، موفقیت در AI فقط به ابزار بستگی ندارد؛ بلکه به نحوه خلق ارزش، بازطراحی کار، توانمندسازی تیم‌ها و مقیاس‌دهی صحیح وابسته است."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyCards.map((c, i) => (
            <Reveal key={c.title} delay={i * 70} className="h-full">
              <IconCard {...c} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-5 flex justify-center">
          <p className="flex items-center gap-2 text-[11.5px] text-[var(--ai-dim)]">
            <Info className="h-3.5 w-3.5 shrink-0 text-[var(--ai-orange-soft)]" />
            {whyFootnote}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Who is behind it                                                    */
/* ------------------------------------------------------------------ */

/** The company's own mark, linking out to its site.
 *
 *  The box sizes to its contents rather than being a fixed square: the Rayka
 *  artwork is a wordmark roughly 2.5× wider than it is tall, so a square
 *  would clip it. */
function CompanyMarkLink({
  company,
  name,
  site,
  siteLabel,
}: {
  company: 'paapeli' | 'rayka';
  name: string;
  site: string;
  siteLabel: string;
}) {
  return (
    <Link
      href={site}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`وب‌سایت ${name} (${siteLabel})`}
      title={siteLabel}
      className="flex h-14 min-w-[3.5rem] shrink-0 items-center justify-center rounded-2xl border border-[var(--ai-green-line)] bg-[var(--ai-green-tint)] px-3.5 transition-colors hover:border-[var(--ai-orange-soft)] hover:bg-[var(--ai-orange-tint)]"
    >
      {company === 'paapeli' ? (
        <PaapeliMark className="h-7 w-7 text-[var(--ai-green)]" />
      ) : (
        <RaykaWordmark className="h-5 w-auto max-w-[5.5rem] text-[var(--ai-green)]" />
      )}
    </Link>
  );
}

export function WhoSection() {
  return (
    <section id={S.who} aria-labelledby="a-who-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="a-who-heading"
          pill="تیم"
          title="چه کسانی پشت این ارزیابی هستند؟"
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {companies.map((c, i) => (
            <Reveal key={c.key} delay={i * 90} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[19px] font-bold text-[var(--ai-text)]">{c.name}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-[1.9] text-[var(--ai-muted)]">
                      {c.role}
                    </p>
                  </div>

                  <CompanyMarkLink
                    company={c.key}
                    name={c.name}
                    site={c.site}
                    siteLabel={c.siteLabel}
                  />
                </div>

                <p className="mt-5 flex-1 text-[13px] leading-[2.1] text-[var(--ai-muted)]">
                  {c.body}
                </p>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <li
                      key={t.label}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-3 py-2 text-[11.5px] text-[var(--ai-muted)]"
                    >
                      <t.icon className="h-[14px] w-[14px] text-[var(--ai-green)]" strokeWidth={1.7} />
                      {t.label}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Why the partnership matters                                         */
/* ------------------------------------------------------------------ */

const HEX = '50,4 91,27 91,73 50,96 9,73 9,27';

export function PartnershipSection() {
  return (
    <section id={S.partnership} aria-labelledby="a-partnership-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="a-partnership-heading"
          pill="همکاری"
          title="چرا همکاری رایکا و پاپلی مهم است؟"
          lead={partnershipLead}
        />

        {/* Two capabilities meeting at a shared core. */}
        <Reveal className="mt-10 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-6 py-8 text-center">
            <h3 className="text-[17px] font-bold text-[var(--ai-text)]">رایکا</h3>
            <p className="mt-2 text-[12.5px] text-[var(--ai-muted)]">نگاه مدیریتی</p>
          </div>

          <div className="av-core relative mx-auto h-[124px] w-[124px] shrink-0 self-center">
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
              <polygon
                points={HEX}
                fill="var(--ai-green)"
                fillOpacity="0.1"
                stroke="var(--ai-green)"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <polygon
                points={HEX}
                fill="none"
                stroke="var(--ai-orange)"
                strokeOpacity="0.45"
                strokeWidth="1"
                strokeLinejoin="round"
                className="av-halo"
              />
            </svg>
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[12px] font-semibold leading-[1.6] text-[var(--ai-text)]">
              ارزش واقعی از AI
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-6 py-8 text-center">
            <h3 className="text-[17px] font-bold text-[var(--ai-text)]">پاپلی</h3>
            <p className="mt-2 text-[12.5px] text-[var(--ai-muted)]">توانمندی فناوری</p>
          </div>
        </Reveal>

        {/* The chain that produces it. Chevrons point left: RTL reading. */}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {partnershipCards.map((c, i) => (
            <div key={c.title} className="relative">
              <Reveal delay={i * 90} className="h-full">
                <IconCard {...c} />
              </Reveal>
              {i < partnershipCards.length - 1 ? (
                <ChevronLeft
                  aria-hidden="true"
                  className="absolute -left-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-[var(--ai-green)] md:block"
                  strokeWidth={2.5}
                />
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Research                                                            */
/* ------------------------------------------------------------------ */

export function ResearchSection() {
  return (
    <section id={S.research} aria-labelledby="a-research-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="a-research-heading"
          pill="پژوهش"
          title="پژوهش‌ها چه می‌گویند؟"
          lead="این ارزیابی صرفاً یک فرم اینترنتی نیست؛ منطق آن بر پایه بینش‌های معتبر جهانی درباره تحول AI شکل گرفته است."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {researchQuotes.map((q, i) => (
            <Reveal key={q.title} delay={i * 80} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[15px] font-bold leading-[1.7] text-[var(--ai-text)]">
                    {q.title}
                  </h3>
                  <Quote
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-[var(--ai-orange-soft)]"
                    strokeWidth={2}
                  />
                </div>

                <blockquote className="mt-3 flex-1 text-[12.5px] leading-[2] text-[var(--ai-muted)]">
                  {q.body}
                </blockquote>

                <figcaption
                  dir="ltr"
                  className="mt-5 border-t border-[var(--ai-border-soft)] pt-4 text-right text-[11px] text-[var(--ai-dim)]"
                >
                  {q.source}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-5 flex justify-center">
          <p className="flex items-center gap-2 text-center text-[12.5px] text-[var(--ai-muted)]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--ai-green)]" strokeWidth={2} />
            {researchNote}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* What you get                                                        */
/* ------------------------------------------------------------------ */

export function OutcomeSection() {
  return (
    <section id={S.outcome} aria-labelledby="a-outcome-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="a-outcome-heading"
          pill="خروجی"
          title="این ارزیابی چه چیزی به شما می‌دهد؟"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {outcomeCards.map((c, i) => (
            <Reveal key={c.title} delay={i * 70} className="h-full">
              <IconCard {...c} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
