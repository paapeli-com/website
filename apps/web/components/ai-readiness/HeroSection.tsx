import { AlertTriangle } from 'lucide-react';
import { Container, GhostButton, PrimaryButton, RadarChart, ScoreBar } from './primitives';
import { Reveal } from './Reveal';
import { aiLinks, aiSections } from './links';
import { heroScorecard } from './content';

export function HeroSection() {
  return (
    <section
      id={aiSections.top}
      aria-labelledby="hero-heading"
      className="ai-readiness-glow relative overflow-hidden"
    >
      <Container className="relative pb-12 pt-12 md:pb-16 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.05fr] md:gap-8 lg:gap-16">
          {/* ---- Copy ---- */}
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-1.5 text-[12.5px] text-[var(--ai-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ai-green)]" />
              ادامه گزارش جامع وضعیت AI در ایران، شماره ۰
            </span>

            <h1
              id="hero-heading"
              className="mt-6 text-[30px] font-bold leading-[1.4] text-[var(--ai-text)] sm:text-[36px] md:text-[42px]"
            >
              حالا نوبت سازمان شماست
            </h1>

            <p className="mt-5 max-w-[34rem] text-[15px] leading-[2.1] text-[var(--ai-muted)]">
              گزارش را خوانده‌اید. حالا در چند دقیقه ببینید سازمان شما برای خلق ارزش واقعی از هوش
              مصنوعی چقدر آماده است.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PrimaryButton href={aiLinks.startAssessment} size="lg">
                شروع ارزیابی آمادگی AI
              </PrimaryButton>
              <GhostButton href={aiLinks.sampleOutput} size="lg">
                مشاهده خروجی نمونه
              </GhostButton>
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--ai-dim)]">
              {[
                'نسخه Quick Scan: حدود ۱۰ دقیقه',
                'رایگان',
                'تحلیل شخصی‌سازی‌شده با هوش مصنوعی',
              ].map((item, i) => (
                <li key={item} className="flex items-center gap-3">
                  {i > 0 ? <span aria-hidden="true">•</span> : null}
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* ---- Scorecard preview ---- */}
          <Reveal
            delay={140}
            className="rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)] sm:p-7"
          >
            <div className="grid items-center gap-6 sm:grid-cols-[1fr_1fr]">
              <div>
                <p className="text-[13px] text-[var(--ai-muted)]">امتیاز آمادگی AI</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-[56px] font-bold leading-none tracking-tight text-[var(--ai-green)]">
                    68
                  </span>
                  <span className="text-[16px] text-[var(--ai-dim)]">/ 100</span>
                </p>
              </div>

              <div className="mx-auto aspect-square w-full max-w-[210px]">
                <RadarChart dimensions={heroScorecard} />
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {heroScorecard.map((d) => (
                <ScoreBar key={d.label} {...d} />
              ))}
            </div>

            {/* The one place orange carries meaning: what is holding you back. */}
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-[var(--ai-orange-line)] bg-[var(--ai-orange-tint)] px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--ai-orange-soft)]" />
              <p className="text-[12.5px] text-[var(--ai-muted)]">
                مهم‌ترین گلوگاه: حاکمیت و سنجش ارزش
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
