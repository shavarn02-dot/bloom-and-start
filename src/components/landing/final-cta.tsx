import { Link } from "@tanstack/react-router";
import ctaFounder from "@/assets/cta-founder.jpg";
import { Annotation, HandUnderline } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";

/**
 * Final CTA — Moment 05.
 * Staged reveal: background shape → founder → headline → underline → CTA →
 * handwritten thought. All motion is CSS, so reduced motion disables it.
 */

export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-end gap-8 px-5 pt-20 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pt-28">
        <div className="pb-20 lg:pb-28">
          <Reveal>
            <h2 className="max-w-xl text-[2.3rem] leading-[1.08] font-semibold sm:text-[3rem]">
              Your next customer is <HandUnderline>already out there</HandUnderline>.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-[17px] text-secondary-foreground">
              You just need a better way to find them.
            </p>
          </Reveal>
          <Reveal delay={260} className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/app"
              className="lg-cta group inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[var(--shadow-lift)]"
            >
              Start finding leads
              <span className="lg-cta-arrow ml-2">→</span>
            </Link>
            <span className="text-[13px] text-muted-foreground">
              No credit card required · Free to start
            </span>
          </Reveal>
          <Reveal delay={380}>
            <Annotation className="mt-6 block -rotate-1 text-[19px]">
              "I know what to do next."
            </Annotation>
          </Reveal>
        </div>

        <Reveal variant="scale" className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-x-4 bottom-0 top-6 bg-cream"
            style={{ clipPath: "polygon(8% 0, 100% 6%, 92% 100%, 0 96%)" }}
          />
          <img
            src={ctaFounder}
            alt="A business owner in her workspace, looking ahead"
            width={1408}
            height={1104}
            loading="lazy"
            decoding="async"
            className="relative mx-auto w-full object-cover"
            style={{ clipPath: "polygon(3% 0, 100% 4%, 97% 100%, 0 96%)" }}
          />
        </Reveal>
      </div>
    </section>
  );
}
