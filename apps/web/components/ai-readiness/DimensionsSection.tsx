import type { LucideIcon } from 'lucide-react';
import { Container, SectionHeading } from './primitives';
import { Reveal } from './Reveal';
import { aiSections } from './links';
import { dimensionCards } from './content';

function DimensionCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <article className="flex h-full flex-col items-center rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-5 py-7 text-center transition-colors duration-200 hover:border-[var(--ai-green-hover)]">
      <Icon className="h-6 w-6 text-[var(--ai-green)]" strokeWidth={1.6} />
      <h3 className="mt-4 text-[15px] font-bold text-[var(--ai-text)]">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-[1.95] text-[var(--ai-muted)]">{body}</p>
    </article>
  );
}

export function DimensionsSection() {
  // Four across, then three centred beneath — the 4 + 3 split from the design.
  const firstRow = dimensionCards.slice(0, 4);
  const secondRow = dimensionCards.slice(4);

  return (
    <section
      id={aiSections.dimensions}
      aria-labelledby="dimensions-heading"
      className="py-12 md:py-16"
    >
      <Container>
        <SectionHeading
          id="dimensions-heading"
          pill="ابعاد ارزیابی"
          title="آمادگی AI فقط داشتن فناوری نیست"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {firstRow.map((card, i) => (
            <Reveal key={card.title} delay={i * 70} className="h-full">
              <DimensionCard {...card} />
            </Reveal>
          ))}
        </div>

        <div className="mx-auto mt-5 grid max-w-[880px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {secondRow.map((card, i) => (
            <Reveal key={card.title} delay={i * 70} className="h-full">
              <DimensionCard {...card} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
