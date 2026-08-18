import Link from 'next/link';
import { ChevronLeft, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Container, PrimaryButton, SectionHeading } from '../primitives';
import { Reveal } from '../Reveal';
import { aiLinks, methodologySections as S } from '../links';
import { IRAN_PATH } from '../iran';
import { MethodologyVisual } from './MethodologyVisual';
import {
  dataSources,
  heroLead,
  maturityLevels,
  methodologyDimensions,
  pillars,
  pipeline,
  pipelineNote,
  referenceSources,
  transparency,
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

export function MethodologyHero() {
  return (
    <section
      id={S.top}
      aria-labelledby="m-hero-heading"
      className="ai-readiness-glow relative overflow-hidden"
    >
      <Container className="relative pb-12 pt-12 md:pb-16 md:pt-16">
        {/* Copy first → right-hand column in RTL, matching the landing page. */}
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-8 lg:gap-14">
          <Reveal>
            <h1
              id="m-hero-heading"
              className="text-[30px] font-bold leading-[1.45] text-[var(--ai-text)] sm:text-[36px] md:text-[42px]"
            >
              روش‌شناسی ارزیابی
              <br />
              آمادگی AI
            </h1>

            <p className="mt-5 max-w-[34rem] text-[14.5px] leading-[2.1] text-[var(--ai-muted)]">
              {heroLead}
            </p>

            <div className="mt-7">
              <PrimaryButton href={aiLinks.startAssessment} size="lg">
                شروع ارزیابی
              </PrimaryButton>
            </div>

            <Link
              href={aiLinks.landing}
              className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-[var(--ai-dim)] transition-colors hover:text-[var(--ai-text)]"
            >
              بازگشت به صفحه اصلی
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <MethodologyVisual />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pillars                                                             */
/* ------------------------------------------------------------------ */

export function PillarsSection() {
  return (
    <section id={S.pillars} aria-labelledby="m-pillars-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="m-pillars-heading"
          pill="پایه‌های روش‌شناسی"
          title="این روش‌شناسی بر چه پایه‌ای استوار است؟"
          lead="چهار ستون علمی و مدیریتی که چارچوب ارزیابی ما را تشکیل می‌دهند."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 70} className="h-full">
              <IconCard {...p} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Reference frameworks                                                */
/* ------------------------------------------------------------------ */

function IranOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="ایران">
      <path
        d={IRAN_PATH}
        fill="var(--ai-orange)"
        fillOpacity="0.14"
        stroke="var(--ai-orange)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SourcesSection() {
  return (
    <section id={S.sources} aria-labelledby="m-sources-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="m-sources-heading"
          pill="منابع"
          title="منابع و چارچوب‌های مرجع"
          lead="ترکیب چارچوب‌های معتبر جهانی با بومی‌سازی برای سازمان‌های ایرانی."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {referenceSources.map((s, i) => (
            <Reveal key={s.name} delay={i * 70} className="h-full">
              <article className="flex h-full flex-col items-center rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 py-7 text-center">
                <p
                  dir="ltr"
                  className="text-[17px] font-semibold tracking-tight text-[var(--ai-text)]"
                >
                  {s.name}
                </p>
                <p className="mt-3 text-[12.5px] leading-[1.95] text-[var(--ai-muted)]">{s.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-5 flex justify-center">
          <span className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--ai-orange-line)] bg-[var(--ai-orange-tint)] px-4 py-3">
            <IranOutline className="h-5 w-5 shrink-0" />
            <span className="text-[12.5px] text-[var(--ai-muted)]">
              بومی‌سازی برای سازمان‌های ایرانی
            </span>
          </span>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dimensions                                                          */
/* ------------------------------------------------------------------ */

export function MethodologyDimensionsSection() {
  const firstRow = methodologyDimensions.slice(0, 4);
  const secondRow = methodologyDimensions.slice(4);

  return (
    <section id={S.dimensions} aria-labelledby="m-dimensions-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="m-dimensions-heading"
          pill="ابعاد"
          title="ابعاد مورد ارزیابی"
          lead="مدل ما آمادگی سازمان را در هفت بُعد مکمل می‌سنجد تا تصویری یکپارچه و قابل تصمیم‌گیری ارائه دهد."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {firstRow.map((d, i) => (
            <Reveal key={d.title} delay={i * 70} className="h-full">
              <IconCard {...d} />
            </Reveal>
          ))}
        </div>

        <div className="mx-auto mt-5 grid max-w-[880px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {secondRow.map((d, i) => (
            <Reveal key={d.title} delay={i * 70} className="h-full">
              <IconCard {...d} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Maturity ladder                                                     */
/* ------------------------------------------------------------------ */

export function MaturitySection() {
  return (
    <section id={S.maturity} aria-labelledby="m-maturity-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="m-maturity-heading"
          pill="سطوح بلوغ"
          title="پنج سطح بلوغ"
          lead="سازمان‌ها بر اساس عملکرد خود در هر بُعد در یکی از پنج سطح بلوغ قرار می‌گیرند."
        />

        {/* Plain RTL flow: level ۱ sits on the right and the ladder climbs
            leftwards, matching how the rest of the page reads. */}
        <Reveal className="relative mt-12">
          <div
            aria-hidden="true"
            className="absolute inset-x-[10%] top-5 hidden h-px bg-[image:linear-gradient(90deg,var(--ai-border)_0%,var(--ai-green-line)_50%,var(--ai-border)_100%)] md:block"
          />

          <ol className="relative flex flex-col gap-8 md:flex-row md:gap-4">
            {maturityLevels.map((level) => (
              <li key={level.number} className="flex-1 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ai-orange-line)] bg-[var(--ai-bg)] text-[14px] font-semibold text-[var(--ai-orange-soft)]">
                  {level.number}
                </span>
                <h3 className="mt-4 text-[14.5px] font-bold text-[var(--ai-text)]">
                  {level.title}
                </h3>
                <p className="mx-auto mt-2 max-w-[13rem] text-[12px] leading-[1.9] text-[var(--ai-muted)]">
                  {level.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Answer → diagnosis pipeline                                         */
/* ------------------------------------------------------------------ */

export function PipelineSection() {
  return (
    <section id={S.pipeline} aria-labelledby="m-pipeline-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="m-pipeline-heading"
          pill="فرآیند تحلیل"
          title="از پاسخ تا Diagnosis"
          lead="پاسخ‌های شما به‌صورت علمی تحلیل و به بینش‌های عملی تبدیل می‌شود."
        />

        <div className="mt-10 rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-5 sm:p-6">
          <ol className="grid gap-4 md:grid-cols-5 md:gap-0">
            {pipeline.map((step, i) => (
              <li key={step.title} className="relative md:px-3">
                <Reveal delay={i * 80}>
                  <div className="flex h-full flex-col items-center rounded-xl border border-[var(--ai-border-soft)] bg-[var(--ai-bg-soft)] px-4 py-5 text-center">
                    <step.icon className="h-5 w-5 text-[var(--ai-green)]" strokeWidth={1.6} />
                    <h3 className="mt-3 text-[13px] font-bold text-[var(--ai-text)]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[11.5px] leading-[1.85] text-[var(--ai-muted)]">
                      {step.body}
                    </p>
                  </div>
                </Reveal>

                {/* Chevron points left: the flow reads right-to-left. */}
                {i < pipeline.length - 1 ? (
                  <ChevronLeft
                    aria-hidden="true"
                    className="absolute -left-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-[var(--ai-green)] md:block"
                    strokeWidth={2.5}
                  />
                ) : null}
              </li>
            ))}
          </ol>

          <Reveal
            delay={120}
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-[var(--ai-orange-line)] bg-[var(--ai-orange-tint)] px-4 py-3"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ai-orange-soft)]" />
            <p className="text-[12.5px] leading-[1.9] text-[var(--ai-muted)]">{pipelineNote}</p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Data sources                                                        */
/* ------------------------------------------------------------------ */

export function DataSection() {
  return (
    <section id={S.data} aria-labelledby="m-data-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="m-data-heading"
          pill="داده‌ها"
          title="داده‌های مورد استفاده"
          lead="ارزیابی ما بر داده‌های واقعی سازمان شما و مقایسه‌های معتبر استوار است."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dataSources.map((d, i) => (
            <Reveal key={d.title} delay={i * 70} className="h-full">
              <IconCard {...d} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Transparency                                                        */
/* ------------------------------------------------------------------ */

export function TransparencySection() {
  return (
    <section
      id={S.transparency}
      aria-labelledby="m-transparency-heading"
      className="py-12 md:py-16"
    >
      <Container>
        <SectionHeading
          id="m-transparency-heading"
          pill="شفافیت"
          title="شفافیت و حدود استفاده"
          lead="تضمین‌کننده اعتماد و استفاده مسئولانه از نتایج."
        />

        <div className="mx-auto mt-10 grid max-w-[880px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {transparency.map((t, i) => (
            <Reveal key={t.title} delay={i * 70} className="h-full">
              <IconCard {...t} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
