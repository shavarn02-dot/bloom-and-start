import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";

export function TrustSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
      <Reveal>
        <div className="rounded-lg border border-border bg-cream px-6 py-12 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>Instead of testimonials</SectionLabel>
            <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.4rem]">
              We'd rather show you the product.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
              See how the workflow works before deciding whether it's right for your
              business.
            </p>
            <a
              href="#product"
              className="group mt-7 inline-flex h-11 items-center rounded-md border border-border-strong bg-paper px-5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-background hover:-translate-y-0.5"
            >
              Walk through the product
              <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </a>
            <Annotation className="mt-6 block">
              "If we're asking you to trust it, you should be able to see it first."
            </Annotation>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
