import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/**
 * Signature shaded underline: a slightly irregular, hand-drawn highlight
 * brushed behind a short phrase. Never use it on whole paragraphs.
 * The stroke draws itself left → right the first time it enters view.
 */
export function HandUnderline({
  children,
  tone = "highlight",
  className,
}: {
  children: ReactNode;
  tone?: "highlight" | "primary";
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.6 });

  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      <span className="relative z-10">{children}</span>
      <svg
        data-visible={inView ? "true" : "false"}
        className={cn(
          "lg-draw absolute inset-x-[-0.14em] bottom-[-0.06em] z-0 h-[0.52em] w-[calc(100%+0.28em)]",
          tone === "highlight" ? "text-highlight" : "text-primary-soft",
        )}
        viewBox="0 0 300 24"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M3 17.5c34-5.2 74-8.1 121-8.6 46-.5 90 1.7 173 6.4-38 3.9-84 5.6-141 5.2-46-.3-94-1.1-140-3z"
          fill="currentColor"
          opacity="0.72"
        />
        <path
          d="M8 12.2c40-3.4 96-5.6 152-5.2 40 .3 82 1.6 136 4.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
    </span>
  );
}

/** Tiny handwritten margin note. */
export function Annotation({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-hand text-lg leading-tight text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Hand-drawn arrow used beside annotations. */
export function HandArrow({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 90 40"
      className={cn(
        "h-8 w-20 text-border-strong",
        animated && "animate-nudge",
        className,
      )}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 30c14-16 34-24 58-22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 3c6 2.6 10 4 13 5-2.6 3-4.4 6.6-6 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Every table, chart or progress state built from static rows carries this.
 * Example content must never be presented as real customer activity.
 */
export function ExampleDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-cream px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-border-strong" />
      Example data
    </span>
  );
}

/** Small caps section label. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
