import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";
import { useInView } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const symptoms = [
  "Hours lost scrolling directories that were out of date last year.",
  "Spreadsheets of contacts nobody has read since they were pasted in.",
  "Lists that are technically people, but not remotely your buyers.",
];

export function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center">
        <div>
          <Reveal>
            <SectionLabel>The problem</SectionLabel>
            <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
              Finding leads shouldn't feel like a second job.
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
              Most teams already know who they want to sell to. What they don't have is a
              calm way to go from that knowledge to a short, workable list of names.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {symptoms.map((s, i) => (
              <Reveal as="li" key={s} delay={i * 110} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="mt-2 h-px w-5 shrink-0 bg-border-strong" />
                <span className="text-secondary-foreground">{s}</span>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal variant="scale" as="figure" className="relative rounded-lg border border-border bg-cream p-6">
          <DeskSketch />
          <figcaption className="mt-4 flex items-start gap-2">
            <Annotation>Twelve tabs open, still nobody worth emailing.</Annotation>
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Hand-drawn line illustration — no stock art, no AI graphics.
 * Strokes draw themselves once, then hold still.
 */
function DeskSketch() {
  const { ref, inView } = useInView<SVGSVGElement>({ threshold: 0.35 });

  return (
    <svg
      ref={ref}
      viewBox="0 0 420 260"
      className={cn("w-full text-border-strong lg-sketch", inView && "lg-sketch-on")}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 214c60-8 120-10 186-8 62 2 122 6 186 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="96" y="82" width="150" height="106" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M96 168h150" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M112 100h58M112 114h96M112 128h74M112 142h88"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M262 118c22-6 40-4 56 6M262 138c26-4 46 0 62 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="320" cy="80" r="16" stroke="currentColor" strokeWidth="2" />
      <path d="M331 91l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M44 150c10-14 24-20 40-18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M52 186c8 4 18 6 30 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
