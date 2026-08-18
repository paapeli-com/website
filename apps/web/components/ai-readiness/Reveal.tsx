'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fades + lifts its children into place the first time they scroll into view.
 *
 * The hidden state is plain CSS with no media query around it, and the whole
 * decision — animate, or show immediately — is made here in JS. An earlier
 * version gated the hidden state behind `prefers-reduced-motion:
 * no-preference`; when the OS asked for reduced motion that block never
 * applied and the effect silently vanished with nothing to inspect. Now the
 * element always reports what it decided via `data-reveal`, so the state is
 * visible in devtools.
 *
 * Crawlers and no-JS visitors are covered too: the markup is server-rendered
 * either way, and a <noscript> override in the page unhides everything.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'hidden' | 'shown' | 'static'>('hidden');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the OS setting, and degrade on anything without the observer.
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setState('static');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('shown');
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ai-reveal ${className ?? ''}`}
      data-reveal={state}
      style={delay && state !== 'static' ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
