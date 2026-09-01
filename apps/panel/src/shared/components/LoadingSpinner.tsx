import { cn } from "@/shared/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Branded Paapeli loader — shared, because the shell's own page-loading
 * fallback uses it too and must not import from a feature chunk.
 * The black swirl stays static; the orange circle rotates around the icon center
 * at a continuous, linear speed (~1.1s).
 */
export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        className={cn(sizeClasses[size])}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Loading"
        role="status"
      >
        {/* Static swirl - black in light, white in dark */}
        <path
          d="M17 3C19.2091 3 21 4.79086 21 7C21 8.94683 19.6088 10.5671 17.7666 10.9248L14.6015 11.774C13.2218 12.1441 12.1443 13.2219 11.7744 14.6016L10.9238 17.7744C10.5631 19.6128 8.94411 21 7 21C4.79086 21 3 19.2091 3 17C3 15.0613 4.37913 13.4438 6.20996 13.0771L9.39678 12.2227C10.7763 11.8528 11.854 10.7754 12.2242 9.39594L13.0742 6.22852C13.4337 4.38852 15.0548 3 17 3Z"
          className="fill-[#111111] dark:fill-white"
        />
        {/* Rotating orange circle */}
        <g style={{ transformOrigin: "12px 12px", animation: "paapeli-spin 1.1s linear infinite" }}>
          <path
            d="M3 7C3 4.79086 4.79086 3 7 3C9.20914 3 11 4.79086 11 7C11 9.20914 9.20914 11 7 11C4.79086 11 3 9.20914 3 7Z"
            fill="#FF7900"
          />
        </g>
        <style>{`@keyframes paapeli-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </svg>
    </div>
  );
}
