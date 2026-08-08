import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { BusinessProfilePanel, ProductFrame } from "@/components/leadgen/product";
import { Reveal } from "@/components/leadgen/reveal";
import { useInView } from "@/hooks/use-reveal";

/**
 * Business context — the real Business Profile surface is the dominant element
 * here, filling itself in field by field once the section comes into view.
 */
export function BusinessContext() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });

  return (
    <section id="context" className="bg-cream">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-center lg:gap-16">
          <Reveal>
            <SectionLabel>Business context</SectionLabel>
            <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
              The better we understand your business, the better we can search.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              A profile takes a few minutes and is reused across every campaign. Business,
              industry, location, ideal customer, company size, website — that's the whole
              brief.
            </p>
            <Annotation className="mt-5 block -rotate-1 text-[19px]">
              "Start with what you already know."
            </Annotation>
          </Reveal>

          <div ref={ref}>
            <ProductFrame title="Business profile" className="shadow-lift">
              {inView ? (
                <BusinessProfilePanel revealCount={7} />
              ) : (
                <div className="h-[420px]" />
              )}
            </ProductFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
