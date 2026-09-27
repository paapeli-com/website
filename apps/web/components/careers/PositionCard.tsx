"use client";

import { ArrowRight } from "lucide-react";

import type { Position, Tone } from "@/lib/careers";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* One opening, as a card.                                             */
/*                                                                     */
/* The two positions are shaped differently on purpose: the backend    */
/* one splits into two tracks a candidate picks between, the product   */
/* one lists what we are looking for in a person. Both end on the same */
/* row of chips, so the cards still read as a set.                     */
/* ------------------------------------------------------------------ */

const TONES: Record<Tone, string> = {
  sky: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  orange: "border-primary/25 bg-primary/10 text-primary",
};

const NEUTRAL = "border-white/10 bg-white/5 text-white/60";
const OPEN = "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
const EMPLOYMENT = "border-amber-400/20 bg-amber-400/10 text-amber-300";

function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** One of the two lines that say what the work is and what it asks for. */
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-xs text-white/50">
      <span className="font-medium text-white/75">{label} </span>
      {children}
    </p>
  );
}

export function PositionCard({
  position,
  applyLabel,
  labels,
  onApply,
}: {
  position: Position;
  applyLabel: string;
  labels: { does: string; expects: string };
  onApply: () => void;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.06] bg-[#0f1728] p-6 md:p-8">
      {/* Where, for how long, and the way in. */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className={OPEN}>{position.statusLabel}</Tag>
          <Tag className={TONES[position.teamTone]}>{position.team}</Tag>
          <Tag className={NEUTRAL}>{position.location}</Tag>
          <Tag className={NEUTRAL}>{position.term}</Tag>
          <Tag className={EMPLOYMENT}>{position.employment}</Tag>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {applyLabel}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </button>
          <span className="text-xs text-white/35">{position.applyNote}</span>
        </div>
      </div>

      <h3 className="mt-6 text-xl font-bold leading-snug text-white md:text-2xl">
        {position.title}
        {/* A bullet here reads as a Persian zero next to the digit, so the
            separator is a plain hyphen, the way the badges below spell it. */}
        {position.capacity ? (
          <span className="ms-3 whitespace-nowrap text-sm font-normal text-white/40">
            - {position.capacity}
          </span>
        ) : null}
      </h3>

      <p className="mt-3 text-sm text-white/70">{position.body}</p>

      {/* A position with no tracks carries the two lines itself. */}
      {position.does && position.expects ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-white/[0.06] bg-[#0b1322] p-5 md:grid-cols-2 md:gap-5">
          <Detail label={labels.does}>{position.does}</Detail>
          <Detail label={labels.expects}>{position.expects}</Detail>
        </div>
      ) : null}

      {/* Two parallel tracks, one candidate picks between them. */}
      {position.tracks?.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {position.tracks.map((track) => (
            <div
              key={track.id}
              className="rounded-xl border border-white/[0.06] bg-[#0b1322] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">{track.title}</h4>
                <Tag className={cn(TONES[track.tone], "shrink-0 font-mono")}>{track.stack}</Tag>
              </div>
              <p className="mt-2 text-xs text-white/50">{track.body}</p>

              <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                <Detail label={labels.does}>{track.does}</Detail>
                <Detail label={labels.expects}>{track.expects}</Detail>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* What we are looking for in a person. */}
      {position.highlights?.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {position.highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="rounded-xl border border-white/[0.06] bg-[#0b1322] p-4"
            >
              <p className="text-sm font-semibold text-primary">{highlight.title}</p>
              <p className="mt-1 text-xs text-white/50">{highlight.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-5">
        <span className="text-xs text-white/40">{position.chipsLabel}</span>
        {position.chips.map((chip) => (
          <Tag key={chip.label} className={chip.accent ? TONES.orange : NEUTRAL}>
            {chip.label}
          </Tag>
        ))}
      </div>
    </article>
  );
}
