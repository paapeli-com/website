/**
 * The two brand marks, inlined so they inherit `currentColor` and can be
 * rendered white on this page's dark background. The geometry is the supplied
 * artwork verbatim; only the hard-coded brand fills were swapped for
 * currentColor (the secondary tone keeps a lower opacity so each mark still
 * reads as two-tone in monochrome).
 */

export function PaapeliMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* The counter-form keeps a muted trace of Paapeli orange; the main
          swoosh stays white so the lockup still reads as monochrome. */}
      <path
        d="M3 7C3 4.79086 4.79086 3 7 3C9.20914 3 11 4.79086 11 7C11 9.20914 9.20914 11 7 11C4.79086 11 3 9.20914 3 7Z"
        fill="#ff7900"
        opacity="0.62"
      />
      <path
        d="M17 3C19.2091 3 21 4.79086 21 7C21 8.94683 19.6088 10.5671 17.7666 10.9248L14.6015 11.774C13.2218 12.1441 12.1443 13.2219 11.7744 14.6016L10.9238 17.7744C10.5631 19.6128 8.94411 21 7 21C4.79086 21 3 19.2091 3 17C3 15.0613 4.37913 13.4438 6.20996 13.0771L9.39678 12.2227C10.7763 11.8528 11.854 10.7754 12.2242 9.39594L13.0742 6.22852C13.4337 4.38852 15.0548 3 17 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function RaykaWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 310.5 125.9"
      aria-label="Rayka"
      role="img"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <path d="M48.7,69c-1.4-5-3.1-8.7-4.9-11-1.8-2.4-4.7-3.7-8.6-3.9,6.2-.2,11-2.1,14.4-5.5,3.4-3.4,5.2-8.2,5.2-14.2v-16.7c0-5.9-1.8-10.3-5.4-13.2C45.7,1.5,40.8,0,34.5,0H0v105.1h14.2v-47.5h11c2.8,0,4.9,1.2,6.3,3.7,1.4,2.5,2.5,5.3,3.3,8.5l9.1,35.2h15.3l-10.5-36.1h0ZM28.1,47.8h-13.9V7.8h15.6c3.9,0,6.8,1,8.6,2.9,1.8,1.9,2.8,5,2.8,9.2v13.9c0,4.6-1,8.1-2.9,10.5-2,2.4-5.4,3.6-10.2,3.6h0Z" />
        <path d="M116.2,24c-1.2-2.8-3.6-5-7.2-6.5-3.6-1.5-8.8-2.2-15.8-2.2s-11.7,1-15.1,2.9c-3.4,1.9-5.8,4.6-6.9,8s-1.8,7.3-1.8,11.7v8.7h12.3v-7.5c0-5.4.7-9.5,2.2-12.2s4.6-4,9.3-4,3.9.3,5.6.9c1.7.6,3.1,1.6,4.1,2.9,1,1.4,1.5,3.4,1.5,6v4.1c0,3.1-.6,5.6-1.8,7.4-1.2,1.8-3,3.5-5.5,5-2.5,1.5-5.7,3.1-9.6,4.9-6.5,2.8-11.5,6.1-15,9.6-3.5,3.6-5.2,8.2-5.2,14v9.4c0,5.8.9,10.1,2.8,12.8s4.2,4.5,6.9,5.2c2.7.8,5.5,1.1,8.4,1.1,4.3,0,8.2-1,11.8-3s6.1-5,7.4-8.9v10.7h13.5V34.7c0-4.3-.6-7.8-1.9-10.7h0ZM104.2,78.4c0,5.8-1,10.4-3.1,13.8s-5.6,5.1-10.4,5.1-3.1-.3-4.7-.8c-1.6-.5-2.9-1.8-4-3.6s-1.6-4.7-1.6-8.5v-7.6c0-4,1-7.2,2.9-9.4,2-2.2,4.7-4.4,8.3-6.6,2.5-1.4,5-2.8,7.4-4.2s4.2-2.9,5.2-4.7v26.7h0Z" />
        <path d="M167.7,17.1l-14.3,74.1-14.7-74.1h-14.1l19.7,85.9c5.7,20.3-16.7,14.7-20.1,13.7v7.6c4.6,1.1,9.8,1.6,12.6,1.6,6.9,0,12.3-2.1,16.3-6.1,4-4.1,6.8-10.5,8.6-19.3l18.7-83.4h-12.8Z" />
        <path d="M216.5,50.7L242.3,0h-15l-24.5,50.5,25.2,54.6h15.1l-26.7-54.4h0ZM186.9,0v105.1h13.7V0h-13.7Z" />
      </g>
      <g fill="currentColor" opacity="0.7">
        <rect x="69.5" y="0" width="48.5" height="7.8" />
        <path d="M303.5,69.1l-5,25.8,2,10.1h10l-6.9-35.8h0ZM300.5,16.5l-3.7,19c-4.5-16.7-12.4-20.3-24-20.3s-10.4.7-14,2c-3.8,1.4-6.6,3.9-8.4,7.7-1.8,3.7-2.7,9.3-2.7,16.6v38.6c0,7.4.9,12.9,2.7,16.6,1.8,3.7,4.6,6.3,8.4,7.6,3.7,1.3,8.4,2,14,2,11.6,0,19.5-3.7,24-20.3l13.6-69.5h-10,0ZM287.9,81.8c-2.5,13.2-5.8,15.4-15.1,15.4s-11.5-3.2-11.5-13.3v-46.4c0-10.1,1.9-13.3,11.5-13.3s12.6,2.2,15.1,15.4l4.1,21.1-4.1,21.1h0Z" />
      </g>
    </svg>
  );
}

/** The co-branded "Paapeli × Rayka" lockup used in the header and footer. */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-[var(--ai-text)] ${className ?? ''}`}>
      <PaapeliMark className="h-6 w-6" />
      <span className="text-[17px] font-bold tracking-tight">Paapeli</span>
      <span className="text-[15px] text-[var(--ai-dim)]">×</span>
      <RaykaWordmark className="h-[18px] w-auto" />
    </span>
  );
}
