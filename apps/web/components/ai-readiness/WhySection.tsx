import { Container, SectionHeading } from './primitives';
import { Reveal } from './Reveal';
import { aiSections } from './links';
import { whyCards } from './content';

export function WhySection() {
  return (
    <section id={aiSections.why} aria-labelledby="why-heading" className="py-12 md:py-16">
      <Container>
        <SectionHeading
          id="why-heading"
          pill="از گزارش تا ارزیابی"
          title="آیا فقط دانستن وضعیت بازار کافی است؟"
          lead="سؤال بعدی این است: سازمان شما در این مسیر دقیقاً کجا ایستاده است؟"
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {whyCards.map((card, i) => (
            <Reveal key={card.number} delay={i * 90} className="h-full">
              <article className="relative flex h-full flex-col items-center rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-6 pb-12 pt-9 text-center transition-colors duration-200 hover:border-[var(--ai-green-hover)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ai-green-line)] bg-[var(--ai-green-tint)]">
                  <card.icon className="h-5 w-5 text-[var(--ai-green)]" strokeWidth={1.75} />
                </span>

                <h3 className="mt-5 text-[16px] font-bold text-[var(--ai-text)]">{card.title}</h3>
                <p className="mt-2.5 max-w-[15rem] text-[13px] leading-[2] text-[var(--ai-muted)]">
                  {card.body}
                </p>

                <span className="absolute bottom-5 left-6 text-[14px] font-semibold text-[var(--ai-orange-num)]">
                  {card.number}
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
