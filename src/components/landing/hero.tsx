import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import founder from "@/assets/founder-cutout.png";
import { Annotation, HandArrow, HandUnderline } from "@/components/leadgen/marks";
import {
  BusinessProfilePanel,
  CampaignProgressPanel,
  LeadTable,
  ProductFrame,
} from "@/components/leadgen/product";
import { exampleLeads } from "@/data/example";
import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/**
 * Hero product loop, roughly 11 seconds end to end.
 * Profile → strategy → discovery → rows arriving → scores → verification,
 * then it resets. Only the product UI moves; the photograph never does.
 */
const STAGES = [
  { key: "profile", caption: "Business profile", ms: 1900 },
  { key: "strategy", caption: "Search strategy", ms: 1900 },
  { key: "discovery", caption: "Discovering companies", ms: 1900 },
  { key: "rows", caption: "Leads arriving", ms: 1800 },
  { key: "scores", caption: "Scoring leads", ms: 1800 },
  { key: "verified", caption: "Verifying contacts", ms: 2000 },
] as const;

export function Hero() {
  const [stage, setStage] = useState(0);
  const reduced = usePrefersReducedMotion();
  const current = STAGES[stage] ?? STAGES[0];

  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(
      () => setStage((s) => (s + 1) % STAGES.length),
      current.ms,
    );
    return () => window.clearTimeout(id);
  }, [stage, current.ms, reduced]);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-40 lg:pb-24">
      {/* Editorial polygon environment — flat warm shapes, no gradients or glows. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <svg
          className="absolute top-0 right-0 h-full w-[62%] text-cream"
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
        >
          <polygon points="120,0 600,0 600,800 40,800 210,420" fill="currentColor" />
          <polygon
            points="300,0 600,0 600,300 380,180"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
        <div className="paper-grain absolute inset-0 opacity-60" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,53%)_minmax(0,47%)] lg:gap-8">
        {/* Copy */}
        <div className="lg:pt-6">
          <p className="font-hand text-[22px] text-primary">
            Built for people who actually sell.
          </p>
          <h1 className="mt-3 text-[2.6rem] leading-[1.06] font-semibold sm:text-[3.4rem] lg:text-[3.75rem]">
            Find the people your{" "}
            <HandUnderline>business should be talking to.</HandUnderline>
          </h1>

          <p className="mt-6 max-w-lg text-[16.5px] leading-relaxed text-muted-foreground">
            Tell us what your business does and who you're trying to reach. LeadGen AI
            helps turn that context into a focused list of prospects worth exploring.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              className="lg-cta group inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[var(--shadow-lift)]"
            >
              Start finding leads
              <span className="lg-cta-arrow ml-2">→</span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-11 items-center rounded-md border border-border-strong bg-paper px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-cream"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-[13px] text-muted-foreground">
            No credit card required · Free to start
          </p>
        </div>

        {/* Composition: cutout + live product layer */}
        <div className="relative">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            {/* Angular plate behind the subject */}
            <div
              aria-hidden="true"
              className="absolute inset-x-2 top-6 bottom-10 bg-primary-soft/50"
              style={{ clipPath: "polygon(14% 0, 100% 6%, 88% 100%, 0 92%)" }}
            />
            <img
              src={founder}
              alt="A small-business founder using LeadGen AI"
              width={912}
              height={1200}
              className="relative z-10 mx-auto w-[78%] max-w-[340px] object-contain drop-shadow-[var(--shadow-contact)] lg:w-[86%] lg:max-w-[400px]"
              style={{
                clipPath: "polygon(6% 0, 100% 3%, 94% 97%, 0 100%)",
              }}
            />

            <Annotation className="absolute top-4 right-0 z-20 hidden lg:block">
              Let's find them →
            </Annotation>

          </div>

          {/* Product layer overlaps the subject */}
          <div className="group relative z-20 -mt-10 lg:absolute lg:right-0 lg:-bottom-6 lg:mt-0 lg:w-[74%]">
            <ProductFrame
              title={current.caption}
              className="shadow-lift transition-transform duration-300 group-hover:-translate-y-1"
            >
              <div key={stage} className="animate-fade-up">
                {stage === 0 && <BusinessProfilePanel compact revealCount={4} />}
                {stage === 1 && <StrategyPanel />}
                {stage === 2 && <CampaignProgressPanel progress={44} />}
                {stage === 3 && (
                  <LeadTable leads={exampleLeads.slice(0, 3)} dense animateRows />
                )}
                {stage === 4 && (
                  <LeadTable leads={exampleLeads.slice(0, 3)} dense animateScores />
                )}
                {stage === 5 && (
                  <LeadTable
                    leads={exampleLeads.slice(0, 3)}
                    dense
                    animateRows
                    showVerification
                  />
                )}
              </div>
            </ProductFrame>

            <div className="mt-3 flex items-center gap-1.5">
              {STAGES.map((s, i) => (
                <span
                  key={s.key}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === stage ? "w-6 bg-primary" : "w-2.5 bg-border-strong",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-14 hidden max-w-6xl items-center gap-2 px-8 lg:flex">
        <HandArrow className="rotate-6" animated={!reduced} />
        <Annotation>Real product screens, not illustrations.</Annotation>
      </div>
    </section>
  );
}

function StrategyPanel() {
  const items = [
    "Manufacturers, 50–500 staff",
    "Operations & procurement roles",
    "India, UK, EU",
    "Sourcing sustainable fabric",
  ];
  return (
    <div className="px-4 py-4">
      <p className="text-[13px] font-semibold text-foreground">Search strategy</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li
            key={item}
            className="flex animate-row-in items-start gap-2 text-[13px] text-secondary-foreground"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
