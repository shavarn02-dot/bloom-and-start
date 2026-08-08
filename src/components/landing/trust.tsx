import { Annotation, SectionLabel } from "@/components/leadgen/marks";

export function TrustSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
      <div className="rounded-lg border border-border bg-cream px-6 py-12 sm:px-12">
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
            className="mt-7 inline-flex h-11 items-center rounded-md border border-border-strong bg-paper px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-background"
          >
            Walk through the product
          </a>
          <Annotation className="mt-6 block">
            "If we're asking you to trust it, you should be able to see it first."
          </Annotation>
        </div>
      </div>
    </section>
  );
}
