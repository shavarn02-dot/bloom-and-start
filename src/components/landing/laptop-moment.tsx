import founderSeated from "@/assets/founder-seated.png";
import { Annotation, HandUnderline } from "@/components/leadgen/marks";
import { LeadTable, ProductFrame } from "@/components/leadgen/product";
import { Reveal } from "@/components/leadgen/reveal";
import { SketchArrow } from "@/components/leadgen/sketches";
import { exampleLeads } from "@/data/example";

/**
 * Moment 04 — the one composite on the page.
 * A photographed founder sits on the edge of the real product surface: she is
 * above the interface, not buried inside it. Used exactly once.
 */

export function LaptopMoment() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-16 bg-cream"
        style={{ clipPath: "polygon(0 7%, 100% 0, 100% 93%, 0 100%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 sm:px-8 lg:pt-24 lg:pb-24">
        <Reveal className="max-w-2xl">
          <h2 className="text-[2rem] leading-[1.1] font-semibold sm:text-[2.6rem]">
            You sit on top of the tool. <HandUnderline>Not inside it.</HandUnderline>
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
            Give LeadGen AI context, let it do the research, then make the calls
            yourself. The list is always yours to overrule.
          </p>
        </Reveal>

        <div className="relative mt-16 lg:mt-24">
          {/* Photographed founder perched on the top edge of the product surface. */}
          <Reveal
            variant="fade"
            className="pointer-events-none absolute top-0 right-10 z-20 hidden -translate-y-[84%] sm:block lg:right-24"
          >
            <img
              src={founderSeated}
              alt="A founder seated on the edge of the LeadGen AI interface"
              width={362}
              height={531}
              loading="lazy"
              decoding="async"
              className="w-[168px] object-contain drop-shadow-[var(--shadow-contact)] lg:w-[200px]"
            />
          </Reveal>

          <Reveal variant="scale" delay={100} className="relative z-10">
            <ProductFrame title="Your leads" className="shadow-lift">
              <LeadTable leads={exampleLeads.slice(0, 5)} />
            </ProductFrame>
          </Reveal>

          <div className="mt-6 flex items-start gap-2">
            <SketchArrow flip className="hidden sm:block" />
            <Annotation className="mt-2 block -rotate-1 text-[19px]">
              You stay in charge of the list.
            </Annotation>
          </div>
        </div>
      </div>
    </section>
  );
}
