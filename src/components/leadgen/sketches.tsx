import { useInView } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/**
 * LeadGen sketch system.
 *
 * One shared hand-drawn vocabulary: slightly imperfect strokes, charcoal by
 * default, tinted with the green accent or warm highlight only when the mark
 * carries meaning. Every mark draws itself once on scroll, then holds still.
 * Palette is inherited via currentColor — never hardcoded.
 */

function useDraw(threshold = 0.4) {
  return useInView<SVGSVGElement>({ threshold });
}

type MarkProps = { className?: string };

/** Curved arrow pointing right-down: connects an annotation to a thing. */
export function SketchArrow({
  className,
  flip = false,
}: MarkProps & { flip?: boolean }) {
  const { ref, inView } = useDraw(0.5);
  return (
    <svg
      ref={ref}
      viewBox="0 0 120 60"
      className={cn(
        "lg-sketch h-12 w-24 text-border-strong",
        flip && "-scale-x-100",
        inView && "lg-sketch-on",
        className,
      )}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 12c30 4 56 18 74 36"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M62 46c8 2 13 2 17 2-1-4-1-9 0-14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Magnifying glass — the search idea. Lens nudges gently once visible. */
export function SketchSearch({ className }: MarkProps) {
  const { ref, inView } = useDraw(0.5);
  return (
    <svg
      ref={ref}
      viewBox="0 0 64 64"
      className={cn(
        "lg-sketch h-10 w-10 text-primary",
        inView && "lg-sketch-on",
        className,
      )}
      fill="none"
      aria-hidden="true"
    >
      <g className={inView ? "animate-nudge" : undefined}>
        <circle cx="27" cy="26" r="16" stroke="currentColor" strokeWidth="2.2" />
        <path d="M39 38l16 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Hand-drawn check — a verified, qualified thing. */
export function SketchCheck({ className }: MarkProps) {
  const { ref, inView } = useDraw(0.5);
  return (
    <svg
      ref={ref}
      viewBox="0 0 40 40"
      className={cn(
        "lg-sketch h-6 w-6 text-primary",
        inView && "lg-sketch-on",
        className,
      )}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 22c4 3 7 6 10 10 5-12 12-21 20-27"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Loose circle drawn around a word or number. */
export function SketchCircle({ className }: MarkProps) {
  const { ref, inView } = useDraw(0.6);
  return (
    <svg
      ref={ref}
      viewBox="0 0 200 90"
      preserveAspectRatio="none"
      className={cn(
        "lg-sketch absolute inset-0 h-full w-full text-highlight",
        inView && "lg-sketch-on",
        className,
      )}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 10c56-8 118-4 148 14 22 13 8 40-30 50-44 12-118 10-142-8-18-13-8-40 26-50"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/** Small window/spreadsheet/document outlines used as annotation glyphs. */
export function SketchGlyph({
  kind,
  className,
}: MarkProps & { kind: "window" | "sheet" | "doc" | "mail" | "target" }) {
  const { ref, inView } = useDraw(0.5);
  return (
    <svg
      ref={ref}
      viewBox="0 0 48 48"
      className={cn(
        "lg-sketch h-7 w-7 text-border-strong",
        inView && "lg-sketch-on",
        className,
      )}
      fill="none"
      aria-hidden="true"
    >
      {kind === "window" && (
        <>
          <rect x="5" y="9" width="38" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M5 18h38" stroke="currentColor" strokeWidth="1.6" />
          <path d="M11 13.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {kind === "sheet" && (
        <>
          <rect x="6" y="8" width="36" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M6 20h36M6 30h36M20 8v32M31 8v32" stroke="currentColor" strokeWidth="1.4" />
        </>
      )}
      {kind === "doc" && (
        <>
          <path
            d="M12 6h16l8 8v28H12z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M18 24h14M18 31h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {kind === "mail" && (
        <>
          <rect x="5" y="12" width="38" height="25" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M6 14l18 13 18-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
      {kind === "target" && (
        <>
          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" />
          <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="24" cy="24" r="2" stroke="currentColor" strokeWidth="2.4" />
        </>
      )}
    </svg>
  );
}

/**
 * Vertical connector between two blueprint nodes. Draws downward on scroll,
 * which is what carries the eye through the "context → leads" diagram.
 */
export function SketchConnector({ className }: MarkProps) {
  const { ref, inView } = useDraw(0.7);
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 64"
      className={cn(
        "lg-sketch h-14 w-6 text-border-strong",
        inView && "lg-sketch-on",
        className,
      )}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3c3 14-3 26 0 42"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 39c2 8 4 13 5 18 2-6 3-11 5-17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
