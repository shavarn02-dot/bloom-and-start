import { useEffect, useRef, useState } from "react";
import founder01Asset from "@/assets/founder-cutout.png.asset.json";
import founder02Asset from "@/assets/founder-02.png.asset.json";
import founder03Asset from "@/assets/founder-03.png.asset.json";
import founder04Asset from "@/assets/founder-04.png.asset.json";
import founder05Asset from "@/assets/founder-05.png.asset.json";
import founder06Asset from "@/assets/founder-06.png.asset.json";
import founder07Asset from "@/assets/founder-07.png.asset.json";
import founder08Asset from "@/assets/founder-08.png.asset.json";
import { Annotation } from "@/components/leadgen/marks";
import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/**
 * Rotating editorial portrait system for the hero.
 *
 * The handwritten lines are NOT testimonials or customer claims — they are the
 * thought we want forming in the visitor's own head while they read the page.
 * Portraits are illustrative, and each expression is paired with the thought
 * that matches it.
 */

type Portrait = {
  src: string;
  /** Who the portrait reads as — used for alt text only. */
  alt: string;
  /** The visitor's internal thought, not a quote from this person. */
  thought: string;
  arrow?: boolean;
  /** Extremely subtle polygon variation behind the subject. */
  plate: string;
  /** Fine-tunes framing so every crop sits in the same bounding box. */
  fit?: string;
};

const PORTRAITS: Portrait[] = [
  {
    src: founder01,
    alt: "A business owner, photographed for illustration",
    thought: "This could really grow my business.",
    arrow: true,
    plate: "bg-primary-soft/50",
  },
  {
    src: founder02,
    alt: "A business owner, photographed for illustration",
    thought: "What if I could finally reach the right customers?",
    plate: "bg-primary-soft/35",
  },
  {
    src: founder03,
    alt: "A business owner, photographed for illustration",
    thought: "I could spend less time searching.",
    plate: "bg-primary-soft/40",
  },
  {
    src: founder04,
    alt: "A business owner, photographed for illustration",
    thought: "More of the right people. Less wasted time.",
    plate: "bg-highlight/30",
  },
  {
    src: founder05,
    alt: "A business owner, photographed for illustration",
    thought: "I don't need more contacts. I need the right ones.",
    plate: "bg-primary-soft/55",
  },
  {
    src: founder06,
    alt: "A business owner, photographed for illustration",
    thought: "This could change how I find customers.",
    plate: "bg-primary-soft/35",
  },
  {
    src: founder07,
    alt: "A business owner, photographed for illustration",
    thought: "Maybe finding new customers doesn't have to be this hard.",
    plate: "bg-primary-soft/45",
  },
  {
    src: founder08,
    alt: "A business owner, photographed for illustration",
    thought: "I could finally focus on selling.",
    arrow: true,
    plate: "bg-highlight/25",
  },
];

const HOLD_MS = 4400;
/** Portrait reveals shortly after the copy sequence has begun. */
const FIRST_REVEAL_MS = 720;

export function HeroPortraits() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const paused = useRef(false);

  // Initial staged reveal of the first portrait.
  useEffect(() => {
    if (reduced) {
      setStarted(true);
      return;
    }
    const t = window.setTimeout(() => setStarted(true), FIRST_REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [reduced]);

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => {
      if (paused.current) return;
      setIndex((i) => {
        setPrevious(i);
        return (i + 1) % PORTRAITS.length;
      });
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [started]);

  const advance = () => {
    setPrevious(index);
    setIndex((i) => (i + 1) % PORTRAITS.length);
  };

  const current = PORTRAITS[index] ?? PORTRAITS[0]!;

  return (
    <div
      className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {/* Angular plate behind the subject — same geometry, subtle tint shift. */}
      {PORTRAITS.map((p, i) => (
        <div
          key={`plate-${i}`}
          aria-hidden="true"
          className={cn(
            "lg-portrait absolute inset-x-2 top-6 bottom-10",
            p.plate,
          )}
          data-state={i === index && started ? "active" : "idle"}
          style={{ clipPath: "polygon(14% 0, 100% 6%, 88% 100%, 0 92%)" }}
        />
      ))}

      {/* Reserved, fixed bounding box — no layout shift between portraits. */}
      <div
        className="relative aspect-[912/1200] w-[86%] max-w-[380px] mx-auto lg:mx-0 lg:w-[92%] lg:max-w-[460px]"
        onClick={advance}
      >
        {PORTRAITS.map((p, i) => (
          <img
            key={p.src}
            src={p.src}
            alt={i === index ? p.alt : ""}
            width={912}
            height={1200}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            aria-hidden={i === index ? undefined : true}
            data-state={
              i === index
                ? started
                  ? "active"
                  : "idle"
                : i === previous
                  ? "exit"
                  : "idle"
            }
            className={cn(
              "lg-portrait absolute inset-0 z-10 h-full w-full object-contain object-bottom",
              i === index && started && "drop-shadow-[var(--shadow-contact)]",
              p.fit,
            )}
            style={{ clipPath: "polygon(6% 0, 100% 3%, 94% 97%, 0 100%)" }}
          />
        ))}
      </div>

      {/* Visitor's thought — handwritten, upper right, clear of the face. */}
      <div className="pointer-events-none absolute top-0 right-0 z-20 hidden w-[230px] -translate-y-full pb-1 text-right lg:block">
        {started && (
          <Annotation
            key={index}
            className="animate-thought-in block text-[19px] leading-snug -rotate-[1.5deg] text-foreground/75"
          >
            {current.thought}
            {current.arrow && (
              <svg
                viewBox="0 0 24 12"
                className="ml-1.5 inline-block h-3 w-6 text-foreground/60"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6c6 0 10-2 14-2 3 0 5 1 6 2-2 2-4 3-6 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </Annotation>
        )}
      </div>

      {/* Mobile: thought sits below the portrait so it never covers a face. */}
      <div className="mt-4 flex min-h-[3.25rem] items-start justify-center lg:hidden">
        {started && (
          <Annotation
            key={`m-${index}`}
            className="animate-thought-in block max-w-[19rem] text-center text-[18px] leading-snug -rotate-[1deg] text-foreground/75"
          >
            {current.thought}
            {current.arrow && (
              <svg
                viewBox="0 0 24 12"
                className="ml-1.5 inline-block h-3 w-6 text-foreground/60"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6c6 0 10-2 14-2 3 0 5 1 6 2-2 2-4 3-6 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </Annotation>
        )}
      </div>
    </div>
  );
}
