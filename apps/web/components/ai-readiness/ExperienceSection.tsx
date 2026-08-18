import { Mic, Sparkles } from 'lucide-react';
import { Container, SectionHeading } from './primitives';
import { Reveal } from './Reveal';
import { aiSections } from './links';
import { sampleAnswers, sampleQuestion } from './content';

/** Fixed amplitudes — a random walk would break SSR/client hydration. */
const WAVEFORM = [
  3, 6, 4, 9, 14, 8, 5, 11, 18, 24, 16, 9, 6, 12, 21, 30, 22, 13, 7, 5, 10, 17, 26, 34, 25, 15, 8,
  4, 7, 13, 20, 28, 19, 11, 6, 9, 15, 23, 31, 21, 12, 7, 4, 8, 14, 22, 29, 18, 10, 6, 3, 7, 12, 19,
  27, 17, 9, 5, 8, 14, 21, 15, 8, 4, 6, 11, 17, 10, 6, 3,
];

function Waveform() {
  return (
    <div className="flex h-14 items-center justify-center gap-[3px]" aria-hidden="true">
      {WAVEFORM.map((height, i) => (
        <span
          key={i}
          className="w-[2px] shrink-0 rounded-full bg-[var(--ai-green)]"
          style={{
            height: `${Math.max(height, 3)}px`,
            // Fade the tails so the trace reads as a clip, not a hard edge.
            opacity: 0.25 + 0.6 * Math.sin((i / (WAVEFORM.length - 1)) * Math.PI),
          }}
        />
      ))}
    </div>
  );
}

export function ExperienceSection() {
  return (
    <section
      id={aiSections.experience}
      aria-labelledby="experience-heading"
      className="py-12 md:py-16"
    >
      <Container>
        <SectionHeading
          id="experience-heading"
          pill="تجربه تعاملی"
          title="پرسشنامه‌ای مبتنی بر هوش مصنوعی"
          lead="می‌توانید به فارسی تایپ کنید، گزینه انتخاب کنید یا با دستیار هوشمند صحبت کنید."
        />

        <Reveal className="mx-auto mt-10 max-w-[820px] rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-6 sm:p-8">
          {/* Question */}
          <div className="flex items-start gap-3 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-4 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--ai-green-line)] bg-[var(--ai-green-tint)]">
              <Sparkles className="h-4 w-4 text-[var(--ai-green)]" strokeWidth={1.75} />
            </span>
            <p className="text-[14px] leading-[1.9] text-[var(--ai-text)]">{sampleQuestion}</p>
          </div>

          {/* Answer chips */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sampleAnswers.map((answer) => (
              <span
                key={answer}
                className="flex h-11 items-center justify-center rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface-2)] text-[13.5px] text-[var(--ai-text)]"
              >
                {answer}
              </span>
            ))}
          </div>

          {/* Voice */}
          <div className="mt-6 flex flex-col items-center">
            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--ai-green-btn)] px-6 text-[13.5px] font-semibold text-white">
              <Mic className="h-4 w-4" strokeWidth={2} />
              پاسخ با صدا
            </span>

            <span className="mt-4 inline-flex items-center rounded-full border border-[var(--ai-border)] bg-[var(--ai-surface-2)] px-4 py-2 text-[12.5px] text-[var(--ai-muted)]">
              می‌خواهید سوال را با مثال توضیح دهم؟
            </span>

            <div className="mt-2 w-full max-w-[620px] overflow-hidden">
              <Waveform />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
