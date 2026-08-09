import { useRef, useState } from "react";
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
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeRect = tabRefs.current[active]?.getBoundingClientRect();
  const parentRect = tabRefs.current[active]?.parentElement?.getBoundingClientRect();
  const pillLeft = activeRect && parentRect ? activeRect.left - parentRect.left : 0;
  const pillWidth = activeRect?.width ?? 0;

  return (
    <section id="product" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
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

      <div className="relative mt-10 flex flex-wrap gap-2">
        {/* Sliding active pill */}
        <span
          className="tab-pill pointer-events-none absolute top-0 h-9 rounded-md bg-primary"
          style={{
            left: pillLeft,
            width: pillWidth,
            opacity: pillWidth > 0 ? 1 : 0,
          }}
          aria-hidden="true"
        />

        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el; }}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-pressed={active === tab.id}
            className={cn(
              "relative z-10 inline-flex h-9 items-center rounded-md border px-3.5 text-[13px] font-medium transition-colors duration-200",
              active === tab.id
                ? "border-transparent text-primary-foreground"
                : "border-border bg-paper text-secondary-foreground hover:bg-cream",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ProductFrame title={current.title} className="shadow-lift transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
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
