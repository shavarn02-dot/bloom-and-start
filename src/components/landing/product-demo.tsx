import { useState } from "react";
import { SectionLabel } from "@/components/leadgen/marks";
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
    <section id="product" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py:28">
      <div className="max-w-2xl">
        <SectionLabel>See it working</SectionLabel>
        <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
          The whole workflow, on one screen.
        </h2>
        <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
          Move through the three screens you'll actually use. These are the real product
          surfaces, filled with clearly labelled example content.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-pressed={active === tab.id}
            className={cn(
              "inline-flex h-9 items-center rounded-md border px-3.5 text-[13px] font-medium transition-colors duration-200",
              active === tab.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-paper text-secondary-foreground hover:bg-cream",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ProductFrame title={current.title} className="shadow-lift">
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
