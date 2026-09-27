"use client";

import { useState } from "react";

import { ApplyDialog } from "@/components/careers/ApplyDialog";
import { PositionCard } from "@/components/careers/PositionCard";
import { LandingFooter } from "@/components/LandingFooter";
import { LandingNavbar } from "@/components/LandingNavbar";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import { careersContent, localeDigits, type ApplyTarget } from "@/lib/careers";
import type { Locale } from "@/lib/seo";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Careers.                                                            */
/*                                                                     */
/* A dark page between the site's own navbar and footer: the openings  */
/* are the point, and everything above them is there to say who would  */
/* enjoy the work. Applying never leaves the page, because a form on   */
/* a second page is one more place to lose a candidate.                */
/*                                                                     */
/* The copy for all three languages lives in lib/careers.ts.           */
/* ------------------------------------------------------------------ */

export default function CareersPage() {
  const { isRTL, language } = useLanguage();
  const content = careersContent(language);

  const [tab, setTab] = useState<"open" | "archived">("open");
  /* The position the form is open for, and null while it is shut. */
  const [target, setTarget] = useState<ApplyTarget | null>(null);

  const open = content.positions.filter((position) => position.status === "open");
  const archived = content.positions.filter((position) => position.status === "archived");
  const shown = tab === "open" ? open : archived;

  const tabClass = (active: boolean) =>
    cn(
      "flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
      active ? "bg-primary text-primary-foreground" : "text-white/55 hover:text-white",
    );

  return (
    <div className="min-h-screen bg-[#070f1c]" dir={isRTL ? "rtl" : "ltr"}>
      <LandingNavbar overlay />

      <main>
        {/* ------------------------------- Hero ------------------------------ */}
        <section className="relative isolate overflow-hidden bg-[#0a1420] px-4 pb-16 pt-32 sm:pt-40">
          {/* A single warm light behind the headline, nothing else. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,122,0,0.13),transparent_70%)]"
          />

          <div className="container mx-auto">
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                {content.hero.badge}
              </span>

              <h1 className="mt-6 text-balance text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                {content.hero.title}
                <span className="mt-2 block text-primary">{content.hero.titleAccent}</span>
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 sm:text-lg">
                {content.hero.lead}
              </p>
            </div>

            {/* What the work is like, in three cards. */}
            <RevealOnScroll>
              <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
                {content.values.map((value) => (
                  <div
                    key={value.step}
                    className="rounded-2xl border border-white/[0.06] bg-[#101828] p-6 text-start"
                  >
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary/10 px-2 text-sm font-bold text-primary">
                      {value.step}
                    </span>
                    <h2 className="mt-4 text-base font-bold text-white">{value.title}</h2>
                    <p className="mt-2 text-xs text-white/50">{value.body}</p>
                  </div>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ----------------------------- Openings ---------------------------- */}
        <section className="bg-[#070f1c] py-16 md:py-24">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  {content.roles.heading}
                </h2>
                <p className="mt-2 text-sm text-white/45">{content.roles.lead}</p>
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-[#101828] p-1.5">
                <button type="button" onClick={() => setTab("open")} className={tabClass(tab === "open")}>
                  {content.roles.openTab}
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-xs",
                      tab === "open" ? "bg-black/25 text-white" : "bg-white/10 text-white/60",
                    )}
                  >
                    {localeDigits(open.length, language as Locale)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("archived")}
                  className={tabClass(tab === "archived")}
                >
                  {content.roles.archiveTab}
                </button>
              </div>
            </div>

            <div className="mt-10 space-y-6">
              {shown.length ? (
                shown.map((position) => (
                  <RevealOnScroll key={position.id}>
                    <PositionCard
                      position={position}
                      applyLabel={content.roles.apply}
                      onApply={() => setTarget(position)}
                    />
                  </RevealOnScroll>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1524] p-12 text-center text-sm text-white/45">
                  {content.roles.emptyArchive}
                </div>
              )}
            </div>

            {/* ------------------------ Open application ----------------------- */}
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0f1728] p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {content.general.label}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-white md:text-2xl">
                    {content.general.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/60">{content.general.body}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setTarget(content.general)}
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[#101828] transition-colors hover:bg-white/90"
                >
                  {content.general.action}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      <ApplyDialog target={target} copy={content.form} onClose={() => setTarget(null)} />
    </div>
  );
}
