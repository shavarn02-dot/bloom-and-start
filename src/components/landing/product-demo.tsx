import { useState } from "react";
import { SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";
import {
  BusinessProfilePanel,
  CampaignProgressPanel,
  LeadTable,
  LeadToolbar,
  ProductFrame,
} from "@/components/leadgen/product";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Business profile", title: "Business profile" },
  { id: "progress", label: "Campaign progress", title: "Finding your leads" },
  { id: "leads", label: "Lead results", title: "Your leads" },
] as const;

export function ProductDemo() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("profile");
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <section id="product" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
      <Reveal className="max-w-2xl">
        <SectionLabel>See it working</SectionLabel>
        <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
          The whole workflow, on one screen.
        </h2>
        <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
          Move through the three screens you'll actually use. These are the real product
          surfaces, filled with clearly labelled example content.
        </p>
      </Reveal>

      {/* Segmented control */}
      <div
        role="tablist"
        aria-label="Product screens"
        className="mt-10 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-cream/70 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "inline-flex h-9 items-center rounded-lg px-3.5 text-[13px] font-medium transition-all duration-200 focus-ring-animate",
              active === tab.id
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
                : "text-secondary-foreground hover:bg-paper hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ProductFrame
          title={current.title}
          className="shadow-lift transition-all duration-300 hover:-translate-y-1"
        >
          <div key={active} className="animate-fade-up">
            {active === "profile" && <BusinessProfilePanel />}
            {active === "progress" && <CampaignProgressPanel progress={63} />}
            {active === "leads" && (
              <>
                <LeadToolbar />
                <LeadTable />
              </>
            )}
          </div>
        </ProductFrame>
      </div>
    </section>
  );
}

