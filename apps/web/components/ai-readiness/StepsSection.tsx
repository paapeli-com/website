import { Container, SectionHeading } from './primitives';
import { Reveal } from './Reveal';
import { aiSections } from './links';
import { steps } from './content';

export function StepsSection() {
  return (
    <section id={aiSections.steps} aria-labelledby="steps-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading id="steps-heading" pill="چگونه کار می‌کند؟" title="در سه گام" />

        {/* Extra top margin leaves room for the number badges straddling
            each card's top border. */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 90} className="h-full">
              <article className="relative h-full rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 pb-6 pt-8">
                <span className="absolute -top-4 right-1/2 flex h-8 w-8 translate-x-1/2 items-center justify-center rounded-full border border-[var(--ai-orange-line)] bg-[var(--ai-surface-2)] text-[14px] font-semibold text-[var(--ai-orange-soft)]">
                  {step.number}
                </span>

                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--ai-green-line)] bg-[var(--ai-green-tint)]">
                    <step.icon
                      className="h-[18px] w-[18px] text-[var(--ai-green)]"
                      strokeWidth={1.75}
                    />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-[var(--ai-text)]">{step.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-[1.95] text-[var(--ai-muted)]">
                      {step.body}
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
