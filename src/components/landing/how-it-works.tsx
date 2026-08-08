import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";
import {
  BusinessProfilePanel,
  CampaignProgressPanel,
  LeadTable,
  LeadToolbar,
  ProductFrame,
} from "@/components/leadgen/product";
import { exampleLeads } from "@/data/example";

const steps = [
  {
    number: "01",
    title: "Describe your business",
    copy: "Your offer, your buyers, your regions. Upload a PDF if the detail already lives in a document.",
    note: "Start with what you already know.",
    render: () => (
      <ProductFrame title="Business profile">
        <BusinessProfilePanel compact />
      </ProductFrame>
    ),
  },
  {
    number: "02",
    title: "Let LeadGen search",
    copy: "A search strategy is built from your context, then companies are discovered, contacts verified and leads scored.",
    note: null,
    render: () => (
      <ProductFrame title="Campaign progress">
        <CampaignProgressPanel progress={63} />
      </ProductFrame>
    ),
  },
  {
    number: "03",
    title: "Work your list",
    copy: "Review, filter, inspect and export the leads that matter. Everything is a plain table you can act on.",
    note: null,
    render: () => (
      <ProductFrame title="Your leads">
        <LeadToolbar />
        <LeadTable leads={exampleLeads.slice(0, 4)} dense />
      </ProductFrame>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <Reveal>
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-4 max-w-2xl text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            Three steps, and none of them are a chatbot.
          </h2>
        </Reveal>

        <div className="mt-12 space-y-14 lg:space-y-20">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14"
            >
              <Reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
                <p className="font-mono text-[13px] tracking-[0.14em] text-primary">
                  {step.number}
                </p>
                <h3 className="mt-2 text-[1.5rem] font-semibold">{step.title}</h3>
                <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
                  {step.copy}
                </p>
                {step.note && (
                  <Annotation className="mt-4 block">"{step.note}"</Annotation>
                )}
              </Reveal>
              <Reveal
                variant={i % 2 === 1 ? "wipe" : "scale"}
                delay={100}
                className={i % 2 === 1 ? "lg:order-1" : ""}
              >
                {step.render()}
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
