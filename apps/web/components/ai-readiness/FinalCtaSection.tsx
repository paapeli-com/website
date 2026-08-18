import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Container } from './primitives';
import { Reveal } from './Reveal';
import { aiLinks, aiSections } from './links';

/**
 * Layered flow lines that fill the lower half of the CTA panel. Two of the
 * nine strands are drawn in Paapeli orange instead of white — enough to warm
 * the panel, not enough to read as a second brand colour.
 */
function FlowLines() {
  return (
    <svg
      viewBox="0 0 1200 320"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 h-[70%] w-full"
      aria-hidden="true"
    >
      {Array.from({ length: 9 }, (_, i) => {
        const offset = i * 17;
        const isAccent = i === 3 || i === 6;
        return (
          <path
            key={i}
            d={`M-40 ${300 - offset}
                C 180 ${250 - offset}, 300 ${120 - offset * 0.4}, 520 ${150 - offset * 0.7}
                S 900 ${300 - offset * 1.2}, 1240 ${140 - offset}`}
            fill="none"
            stroke={isAccent ? '#ff7900' : '#ffffff'}
            strokeOpacity={isAccent ? 0.22 : 0.06 + i * 0.022}
            strokeWidth="1.4"
          />
        );
      })}
    </svg>
  );
}

/** The closing green panel. Both the landing page and the methodology page
 *  end on it, so the copy and the secondary link are props. */
export function FinalCtaSection({
  title = 'گزارش را خواندید. حالا سازمان خودتان را بسنجید',
  body = 'ارزیابی اولیه رایگان است و حدود ۱۰ دقیقه زمان می‌برد.',
  secondaryLabel = 'مطالعه دوباره گزارش شماره ۰',
  secondaryHref = aiLinks.report,
}: {
  title?: string;
  body?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
} = {}) {
  return (
    <section
      id={aiSections.finalCta}
      aria-labelledby="final-cta-heading"
      className="pb-16 pt-4 md:pb-24"
    >
      <Container>
        <Reveal className="relative overflow-hidden rounded-3xl bg-[image:linear-gradient(135deg,#0c5b3f_0%,#149063_55%,#0d6448_100%)] px-6 py-14 text-center sm:px-12">
          <FlowLines />

          <div className="relative">
            <h2
              id="final-cta-heading"
              className="text-[24px] font-bold leading-[1.6] text-white sm:text-[32px] md:text-[36px]"
            >
              {title}
            </h2>

            <p className="mt-4 text-[14px] leading-[2] text-white/75">{body}</p>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Link
                href={aiLinks.startAssessment}
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#0d2f22] px-10 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#0a2419] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f6b4a]"
              >
                شروع ارزیابی
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </Link>

              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-1.5 text-[13px] text-white/70 transition-colors hover:text-white"
              >
                {secondaryLabel}
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
