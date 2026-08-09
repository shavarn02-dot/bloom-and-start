import { Link } from "@tanstack/react-router";
import { HeroPortraits } from "@/components/landing/hero-portraits";
import { HandUnderline } from "@/components/leadgen/marks";

/**
 * Editorial hero: copy + cutout portrait over an irregular polygon field.
 * No floating product UI — just the photograph, the background, and the
 * handwritten annotation.
 */

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-40 lg:pb-24">
      {/* Editorial polygon environment — flat warm shapes, no gradients or glows. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <svg
          className="absolute top-0 right-0 h-full w-[62%] text-cream"
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
        >
          <polygon points="120,0 600,0 600,800 40,800 210,420" fill="currentColor" />
          <polygon
            points="300,0 600,0 600,300 380,180"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
        <div className="paper-grain absolute inset-0 opacity-60" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,53%)_minmax(0,47%)] lg:gap-8">
        {/* Copy */}
        <div className="lg:pt-6">
          <p className="animate-hero-eyebrow font-hand text-[22px] text-primary">
            Built for people who actually sell.
          </p>
          <h1 className="animate-hero-headline mt-3 text-[2.6rem] leading-[1.06] font-semibold sm:text-[3.4rem] lg:text-[3.75rem]">
            Find the people your{" "}
            <HandUnderline>business should be talking to.</HandUnderline>
          </h1>

          <p className="animate-hero-subcopy mt-6 max-w-lg text-[16.5px] leading-relaxed text-muted-foreground">
            Tell us what your business does and who you're trying to reach. LeadFlowX
            helps turn that context into a focused list of prospects worth exploring.
          </p>

          <div className="animate-hero-cta mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              className="lg-cta group inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5"
            >
              Start finding leads
              <span className="lg-cta-arrow ml-2">→</span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-11 items-center rounded-md border border-border-strong bg-paper px-5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-cream hover:-translate-y-0.5"
            >
              See how it works
            </a>
          </div>

          <p className="animate-hero-trust mt-5 text-[13px] text-muted-foreground">
            No credit card required · Free to start
          </p>
        </div>

        {/* Rotating portraits + the visitor's handwritten thought */}
        <div className="relative flex items-center justify-center lg:items-start lg:justify-end">
          <HeroPortraits />
        </div>
      </div>
    </section>
  );
}

