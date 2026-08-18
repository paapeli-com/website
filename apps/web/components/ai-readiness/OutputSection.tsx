import { AlertTriangle, CheckCircle2, ListChecks } from 'lucide-react';
import { Container, ScoreBar, SectionHeading } from './primitives';
import { Reveal } from './Reveal';
import { aiSections } from './links';
import { outputHighlights, outputNarrative, outputScorecard } from './content';

const toneStyles = {
  positive: { icon: CheckCircle2, color: 'text-[var(--ai-green)]' },
  warning: { icon: AlertTriangle, color: 'text-[var(--ai-orange-soft)]' },
  neutral: { icon: ListChecks, color: 'text-[var(--ai-muted)]' },
};

export function OutputSection() {
  return (
    <section id={aiSections.output} aria-labelledby="output-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="output-heading"
          pill="خروجی شما"
          title="در پایان، فقط یک امتیاز نمی‌گیرید"
        />

        <Reveal className="mt-10 rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6 sm:p-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            {/* ---- Narrative + breakdown (right column in RTL) ---- */}
            <div>
              <p className="text-[14px] leading-[2.1] text-[var(--ai-muted)]">{outputNarrative}</p>

              <div className="mt-7 space-y-2.5">
                {outputScorecard.map((d) => (
                  <ScoreBar key={d.label} {...d} />
                ))}
              </div>
            </div>

            {/* ---- Score + highlights (left column in RTL) ---- */}
            <div className="flex flex-col">
              <p className="flex items-baseline gap-2">
                <span className="text-[56px] font-bold leading-none tracking-tight text-[var(--ai-green)]">
                  64
                </span>
                <span className="text-[16px] text-[var(--ai-dim)]">/ 100</span>
              </p>

              <p className="mt-3 flex items-center gap-2 text-[13px] text-[var(--ai-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ai-orange-soft)]" />
                سطح آمادگی: در حال شکل‌گیری
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {outputHighlights.map((group) => {
                  const { icon: Icon, color } = toneStyles[group.tone];
                  return (
                    <div
                      key={group.title}
                      className="rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-4 py-4"
                    >
                      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ai-text)]">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} strokeWidth={2} />
                        {group.title}
                      </p>
                      <ul className="mt-2.5 space-y-1.5">
                        {group.items.map((item) => (
                          <li
                            key={item}
                            className="flex gap-1.5 text-[11.5px] leading-[1.8] text-[var(--ai-muted)]"
                          >
                            <span className="text-[var(--ai-dim)]">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
