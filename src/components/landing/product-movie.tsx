import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import {
  BusinessProfilePanel,
  CampaignProgressPanel,
  LeadTable,
  LeadToolbar,
  ProductFrame,
} from "@/components/leadgen/product";
import { exampleLeads } from "@/data/example";
import { useScrollProgress } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const stages = [
  {
    key: "profile",
    label: "Business profile",
    caption: "You describe the business once.",
  },
  {
    key: "strategy",
    label: "Search strategy",
    caption: "Roles, regions and company shapes are worked out.",
  },
  {
    key: "discovery",
    label: "Discovery",
    caption: "Companies and people are gathered from public sources.",
  },
  {
    key: "verification",
    label: "Verification",
    caption: "Contact details are checked before they reach you.",
  },
  {
    key: "scoring",
    label: "Scoring",
    caption: "Each lead is weighed against your context.",
  },
  {
    key: "results",
    label: "Lead results",
    caption: "A plain table you can filter, inspect and export.",
  },
] as const;

/**
 * Signature scroll-driven section: the whole workflow plays out as the
 * visitor scrolls one tall block. Reduced-motion visitors simply see the
 * final stage, since the section is scroll-linked rather than autoplaying.
 */
export function ProductMovie() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const index = Math.min(
    stages.length - 1,
    Math.floor(progress * stages.length * 0.999),
  );
  const active = stages[index] ?? stages[0];
  const campaignProgress = Math.round(20 + progress * 80);

  return (
    <section id="product-movie" className="border-y border-border bg-cream">
      <div ref={ref} className="relative h-[320vh]">
        <div className="sticky top-0 flex min-h-screen items-center">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-14">
            <div>
              <SectionLabel>The product, end to end</SectionLabel>
              <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
                One button. A lot happens behind it.
              </h2>

              <ol className="mt-8 space-y-1">
                {stages.map((stage, i) => (
                  <li key={stage.key} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-2.5 h-px shrink-0 transition-all duration-500",
                        i <= index ? "w-8 bg-primary" : "w-4 bg-border-strong",
                      )}
                    />
                    <span
                      className={cn(
                        "py-1 text-[15px] transition-colors duration-500",
                        i === index
                          ? "font-semibold text-foreground"
                          : i < index
                            ? "text-secondary-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {stage.label}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                {active.caption}
              </p>
              <Annotation className="mt-4 block">
                "A lot happens behind one button."
              </Annotation>
            </div>

            <div>
              <ProductFrame title={active.label} className="shadow-lift">
              <div key={active.key} className="animate-fade-up">
                  {index === 0 && <BusinessProfilePanel revealCount={7} />}
                  {index === 1 && <StrategyList />}
                  {index === 2 && (
                    <CampaignProgressPanel
                      progress={campaignProgress}
                      activeIndex={2}
                    />
                  )}
                  {index === 3 && (
                    <LeadTable
                      leads={exampleLeads.slice(0, 4)}
                      dense
                      animateRows
                      showVerification
                    />
                  )}
                  {index === 4 && (
                    <LeadTable leads={exampleLeads.slice(0, 4)} dense animateScores />
                  )}
                  {index === 5 && (
                    <>
                      <LeadToolbar />
                      <LeadTable leads={exampleLeads.slice(0, 5)} dense animateRows />
                    </>
                  )}
                </div>
              </ProductFrame>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StrategyList() {
  const items = [
    "Roles: Head of Operations, Procurement Lead",
    "Regions: India, UK, EU",
    "Company size: 50–500 staff",
    "Signals: replacing conventional cotton suppliers",
  ];
  return (
    <div className="px-4 py-4">
      <p className="text-[13px] font-semibold text-foreground">
        What we'll look for
      </p>
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
