import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { LeadTable, ProductFrame } from "@/components/leadgen/product";

export function LeadQuality() {
  return (
    <section id="lead-quality" className="border-y border-border bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
          <div>
            <SectionLabel>Lead quality</SectionLabel>
            <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
              Not every contact is a lead.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              LeadGen AI evaluates prospects against the business context you provide
              instead of presenting an undifferentiated list of contacts.
            </p>
            <Annotation className="mt-5 block">
              The score is a starting point, not a verdict.
            </Annotation>
          </div>

          <ProductFrame title="Your leads — sorted by match">
            <LeadTable />
          </ProductFrame>
        </div>
      </div>
    </section>
  );
}
