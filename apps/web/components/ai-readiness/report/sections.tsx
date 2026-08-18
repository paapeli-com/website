import Link from 'next/link';
import { CheckCircle2, Download, Eye, Info, Lock, Sparkles } from 'lucide-react';

import { Container, GhostButton, PrimaryButton, SectionHeading } from '../primitives';
import { Reveal } from '../Reveal';
import { reportSections as S } from '../links';
import { ReportCover } from './ReportCover';
import {
  archive,
  audience,
  consentLabel,
  editionFacts,
  formFields,
  heroMeta,
  highlights,
  industryOptions,
  managerialMessage,
  orgSizeOptions,
  previewBullets,
  privacyNote,
  report,
} from './content';

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function ReportHero() {
  return (
    <section
      id={S.top}
      aria-labelledby="r-hero-heading"
      className="ai-readiness-glow relative overflow-hidden"
    >
      <Container className="relative pb-12 pt-12 md:pb-16 md:pt-16">
        {/* Copy first → right-hand column in RTL, matching the landing page. */}
        <div className="grid items-center gap-10 md:grid-cols-[1fr_0.85fr] md:gap-8 lg:gap-14">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-1.5 text-[12.5px] text-[var(--ai-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ai-green)]" />
              آخرین نسخه منتشرشده
            </span>

            <h1
              id="r-hero-heading"
              className="mt-6 text-[28px] font-bold leading-[1.5] text-[var(--ai-text)] sm:text-[34px] md:text-[40px]"
            >
              {report.title}
            </h1>

            <p className="mt-3 text-[15px] font-semibold text-[var(--ai-green)]">
              {report.subtitle}
            </p>

            <p className="mt-4 max-w-[36rem] text-[14px] leading-[2.1] text-[var(--ai-muted)]">
              {report.lead}
            </p>

            <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-border)] sm:grid-cols-5">
              {heroMeta.map((m) => (
                <div key={m.label} className="bg-[var(--ai-surface)] px-3 py-4 text-center">
                  <dt className="text-[11px] text-[var(--ai-dim)]">{m.label}</dt>
                  <dd className="mt-1.5 text-[13.5px] font-semibold text-[var(--ai-text)]">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PrimaryButton href={`#${S.download}`} size="lg" trailingIcon={false}>
                <Download className="h-4 w-4" strokeWidth={2} />
                دانلود گزارش
              </PrimaryButton>
              <GhostButton href={`#${S.highlights}`} size="lg" trailingIcon={false}>
                <Eye className="h-4 w-4 text-[var(--ai-muted)]" strokeWidth={1.8} />
                مشاهده خلاصه گزارش
              </GhostButton>
            </div>

            <p className="mt-5 text-[12.5px] text-[var(--ai-dim)]">دریافت گزارش رایگان است.</p>
          </Reveal>

          <Reveal delay={120}>
            <ReportCover />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Highlights                                                          */
/* ------------------------------------------------------------------ */

export function HighlightsSection() {
  return (
    <section id={S.highlights} aria-labelledby="r-highlights-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="r-highlights-heading"
          pill="مهم‌ترین نکات گزارش"
          title="آنچه در این گزارش خواهید خواند"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h, i) => (
            <Reveal key={h.number} delay={i * 70} className="h-full">
              <article className="relative flex h-full flex-col rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 pb-12 pt-6 transition-colors duration-200 hover:border-[var(--ai-green-hover)]">
                <h.icon className="h-6 w-6 text-[var(--ai-green)]" strokeWidth={1.6} />
                <h3 className="mt-4 text-[15px] font-bold text-[var(--ai-text)]">{h.title}</h3>
                <p className="mt-2 text-[12.5px] leading-[1.95] text-[var(--ai-muted)]">
                  {h.body}
                </p>
                <span className="absolute bottom-5 left-5 text-[14px] font-semibold text-[var(--ai-orange-num)]">
                  {h.number}
                </span>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal
          delay={120}
          className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[var(--ai-orange-line)] bg-[var(--ai-orange-tint)] px-5 py-4"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ai-orange-soft)]" />
          <p className="text-[13px] leading-[2] text-[var(--ai-muted)]">{managerialMessage}</p>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Audience                                                            */
/* ------------------------------------------------------------------ */

export function AudienceSection() {
  return (
    <section id={S.audience} aria-labelledby="r-audience-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="r-audience-heading"
          pill="مخاطبان"
          title="این گزارش برای چه کسانی مفید است؟"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map((a, i) => (
            <Reveal key={a.title} delay={i * 70} className="h-full">
              <article className="flex h-full flex-col items-center rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 py-7 text-center transition-colors duration-200 hover:border-[var(--ai-green-hover)]">
                <a.icon className="h-6 w-6 text-[var(--ai-green)]" strokeWidth={1.6} />
                <h3 className="mt-4 text-[15px] font-bold text-[var(--ai-text)]">{a.title}</h3>
                <p className="mt-2 text-[12.5px] leading-[1.95] text-[var(--ai-muted)]">{a.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Edition facts + preview + download form                             */
/* ------------------------------------------------------------------ */

const fieldClass =
  'h-11 w-full rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-3.5 text-[13px] text-[var(--ai-text)] placeholder:text-[var(--ai-dim)] focus:border-[var(--ai-green)] focus:outline-none';

export function DownloadSection() {
  return (
    <section id={S.download} aria-labelledby="r-download-heading" className="py-12 md:py-16">
      <Container>
        <h2 id="r-download-heading" className="sr-only">
          دریافت گزارش
        </h2>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_0.9fr_1.15fr]">
          {/* ---- About this edition (right column in RTL) ---- */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[16px] font-bold text-[var(--ai-text)]">
                  درباره این نسخه گزارش
                </h3>
                <span className="rounded-full border border-[var(--ai-orange-line)] bg-[var(--ai-orange-tint)] px-3 py-1 text-[10.5px] font-medium text-[var(--ai-orange-soft)]">
                  نسخه فعلی
                </span>
              </div>

              <dl className="mt-6 space-y-4">
                {editionFacts.map((f) => (
                  <div key={f.label} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--ai-green-line)] bg-[var(--ai-green-tint)]">
                      <f.icon className="h-4 w-4 text-[var(--ai-green)]" strokeWidth={1.7} />
                    </span>
                    <div>
                      <dt className="text-[11.5px] text-[var(--ai-dim)]">{f.label}</dt>
                      <dd className="mt-0.5 text-[13px] text-[var(--ai-text)]">{f.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          {/* ---- Preview ---- */}
          <Reveal delay={80} className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6">
              <h3 className="text-[16px] font-bold text-[var(--ai-text)]">پیش‌نمایش گزارش</h3>

              <div className="mt-6 flex-1">
                <div className="mx-auto max-w-[190px]">
                  <ReportCover />
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {previewBullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ai-green)]"
                      strokeWidth={2}
                    />
                    <span className="text-[12.5px] leading-[1.9] text-[var(--ai-muted)]">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* ---- Gated download form (left column in RTL) ---- */}
          <Reveal delay={160} className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6 sm:p-7">
              <h3 className="text-[16px] font-bold text-[var(--ai-text)]">دریافت گزارش</h3>
              <p className="mt-2 text-[12.5px] leading-[1.9] text-[var(--ai-muted)]">
                برای دریافت نسخه کامل گزارش، اطلاعات خود را وارد کنید.
              </p>

              {/*
                UI only: there is no submit handler and no endpoint yet, so the
                button is a plain button rather than a submit that would post
                these fields into the URL. Wire it to an API route and switch
                to type="submit" when the backend exists.
              */}
              <form className="mt-5 space-y-3">
                {formFields.map((f) => (
                  <div key={f.name}>
                    <label htmlFor={`rf-${f.name}`} className="sr-only">
                      {f.label}
                    </label>
                    {/* Every field stays RTL so its placeholder sits on the
                        right like the rest of the page. Latin values (email,
                        phone) still render left-to-right inside the field —
                        only the block alignment is RTL. */}
                    <input
                      id={`rf-${f.name}`}
                      name={f.name}
                      type={f.type}
                      autoComplete={f.autoComplete}
                      placeholder={f.label}
                      required
                      className={fieldClass}
                    />
                  </div>
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="rf-industry"
                      className="mb-1.5 block text-[11.5px] text-[var(--ai-dim)]"
                    >
                      صنعت / حوزه فعالیت
                    </label>
                    <select id="rf-industry" name="industry" required className={fieldClass}>
                      <option value="">انتخاب کنید</option>
                      {industryOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="rf-size"
                      className="mb-1.5 block text-[11.5px] text-[var(--ai-dim)]"
                    >
                      اندازه سازمان
                    </label>
                    <select id="rf-size" name="orgSize" required className={fieldClass}>
                      <option value="">انتخاب کنید</option>
                      {orgSizeOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label
                  htmlFor="rf-consent"
                  className="flex cursor-pointer items-start gap-2.5 pt-1 text-[12px] leading-[1.9] text-[var(--ai-muted)]"
                >
                  <input
                    id="rf-consent"
                    name="consent"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--ai-green)]"
                  />
                  {consentLabel}
                </label>

                <p className="flex items-start gap-2 pt-1 text-[11.5px] leading-[1.85] text-[var(--ai-dim)]">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ai-orange-soft)]" />
                  {privacyNote}
                </p>

                <button
                  type="button"
                  className="mt-2 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--ai-green-btn)] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--ai-green-btn-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ai-bg)]"
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                  دریافت و دانلود گزارش
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Archive                                                             */
/* ------------------------------------------------------------------ */

export function ArchiveSection() {
  return (
    <section id={S.archive} aria-labelledby="r-archive-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="r-archive-heading"
          pill="آرشیو گزارش‌ها"
          title="سایر گزارش‌ها و نسخه‌های منتشرشده"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {archive.map((item, i) => {
            const isPublished = item.status === 'published';
            return (
              <Reveal key={item.number} delay={i * 70} className="h-full">
                <article
                  className={`flex h-full flex-col rounded-2xl border bg-[var(--ai-surface)] p-5 ${
                    isPublished
                      ? 'border-[var(--ai-green-line)]'
                      : 'border-[var(--ai-border)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11.5px] text-[var(--ai-dim)]">
                      گزارش شماره {item.number}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                        isPublished
                          ? 'border-[var(--ai-green-line)] bg-[var(--ai-green-tint)] text-[var(--ai-green)]'
                          : 'border-[var(--ai-orange-line)] bg-[var(--ai-orange-tint)] text-[var(--ai-orange-soft)]'
                      }`}
                    >
                      {isPublished ? 'نسخه فعلی' : 'در دست انتشار'}
                    </span>
                  </div>

                  <h3 className="mt-3 text-[14.5px] font-bold leading-[1.8] text-[var(--ai-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[11.5px] leading-[1.85] text-[var(--ai-muted)]">
                    {item.note}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--ai-dim)]">{item.date}</p>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <li
                        key={t}
                        className="rounded-md border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-2 py-1 text-[10px] text-[var(--ai-dim)]"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex-1" />

                  {isPublished ? (
                    <Link
                      href={`#${S.download}`}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ai-green-btn)] text-[12.5px] font-semibold text-white transition-colors hover:bg-[var(--ai-green-btn-hover)]"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={2} />
                      دانلود گزارش
                    </Link>
                  ) : (
                    <span className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] text-[12.5px] text-[var(--ai-dim)]">
                      به‌زودی
                    </span>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120} className="mt-6 flex justify-center">
          <p className="flex items-center gap-2 text-[12px] text-[var(--ai-dim)]">
            <Info className="h-3.5 w-3.5 shrink-0 text-[var(--ai-orange-soft)]" />
            نسخه‌های بعدی به‌ترتیب منتشر می‌شوند؛ با دریافت گزارش شماره {report.number} از انتشار
            آن‌ها باخبر می‌شوید.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
