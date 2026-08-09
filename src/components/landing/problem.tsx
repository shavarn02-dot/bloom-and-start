import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";
import { SketchCheck, SketchConnector, SketchGlyph } from "@/components/leadgen/sketches";
import { useInView } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/**
 * Old way → new way.
 *
 * The left column accumulates mess as the reader scrolls: more windows, more
 * notes, more spreadsheet rows. The right column stays a single calm path.
 * Motion is scroll-linked, so reduced-motion visitors simply see the end state.
 */

const oldSteps = [
  { kind: "window" as const, label: "Google" },
  { kind: "window" as const, label: "Open the website" },
  { kind: "doc" as const, label: "Research, guess, note it down" },
  { kind: "mail" as const, label: "Hunt for an email" },
  { kind: "sheet" as const, label: "Paste into the spreadsheet" },
  { kind: "window" as const, label: "Repeat" },
];

const newSteps = [
  "Describe the business once",
  "LeadGen builds the search",
  "Companies and contacts come back",
  "A short list, scored for you",
];

export function Problem() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="old-way" className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
          <Reveal className="max-w-2xl">
            <SectionLabel>The problem</SectionLabel>
            <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.6rem]">
              Finding leads shouldn't feel like a second job.
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
              Most teams already know who they want to sell to. What they don't have is a
              calm way to go from that knowledge to a short, workable list of names.
            </p>
          </Reveal>

          {/* Tilted pinboard — the research mess, propped up like a board on a wall. */}
          <Reveal variant="scale" delay={80} className="relative">
            <img
              src={researchBoard}
              alt="A pinboard covered in handwritten notes and printed company lists"
              width={1280}
              height={960}
              loading="lazy"
              decoding="async"
              className="w-full rotate-[-1.6deg] object-cover shadow-lift"
              style={{ clipPath: "polygon(0 3%, 98% 0, 100% 96%, 2% 100%)" }}
            />
            <Annotation className="mt-4 block rotate-1 text-[18px]">
              Somewhere in here is your next customer.
            </Annotation>
          </Reveal>
        </div>

        <div ref={ref} className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">

          {/* OLD WAY — gets messier the further you read. */}
          <div>
            <p className="font-mono text-[12px] tracking-[0.18em] text-muted-foreground uppercase">
              The old way
            </p>
            <ol className="relative mt-6 space-y-3">
              {oldSteps.map((step, i) => (
                <li
                  key={step.label}
                  className={cn(
                    "flex items-center gap-3 transition-all duration-500",
                    inView ? "translate-x-0 opacity-100" : i % 2 === 0 ? "-translate-x-3 opacity-0" : "translate-x-3 opacity-0",
                  )}
                  style={{
                    marginLeft: `${Math.min(i, 4) * 14}px`,
                    transitionDelay: `${i * 140}ms`,
                  }}
                >
                  <SketchGlyph kind={step.kind} className="shrink-0" />
                  <span className="text-[15.5px] text-secondary-foreground">
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>

            {/* Spreadsheet rows multiplying underneath the loop. */}
            <div className="mt-7 max-w-sm space-y-1.5" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-px bg-border-strong transition-opacity duration-500",
                    inView ? "opacity-70" : "opacity-0",
                  )}
                  style={{
                    width: `${45 + ((i * 37) % 55)}%`,
                    transitionDelay: `${700 + i * 110}ms`,
                  }}
                />
              ))}
            </div>

            <Annotation className="mt-6 block -rotate-1 text-[19px]">
              Twelve tabs open, still nobody worth emailing.
            </Annotation>
          </div>

          {/* NEW WAY — one line, no clutter. */}
          <Reveal delay={120} className="lg:pt-10">
            <p className="font-mono text-[12px] tracking-[0.18em] text-primary uppercase">
              With LeadGen
            </p>
            <div className="mt-6 flex flex-col items-start">
              {newSteps.map((step, i) => (
                <div key={step} className="w-full">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[12px] text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[16.5px] text-foreground">{step}</span>
                    {i === newSteps.length - 1 && <SketchCheck className="ml-1" />}
                  </div>
                  {i < newSteps.length - 1 && (
                    <div className="ml-1 py-1">
                      <SketchConnector />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
