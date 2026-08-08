import laptopComposite from "@/assets/laptop-composite.png";
import { Annotation, HandUnderline } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";

/**
 * Moment 04 — the single surreal editorial composite on the page.
 * A real founder sitting on the product. Used exactly once.
 */

export function LaptopMoment() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-24 bg-cream"
        style={{ clipPath: "polygon(0 8%, 100% 0, 100% 92%, 0 100%)" }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-4 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-24">
        <Reveal>
          <h2 className="max-w-md text-[2rem] leading-[1.1] font-semibold sm:text-[2.5rem]">
            You sit on top of it. <HandUnderline>Not inside it.</HandUnderline>
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
            LeadGen AI is a tool you look down at, not a system you get buried
            in. Give it context, let it work, then make the calls yourself.
          </p>
          <Annotation className="mt-6 block -rotate-1 text-[19px]">
            You stay in charge of the list.
          </Annotation>
        </Reveal>

        <Reveal variant="scale" delay={120}>
          <img
            src={laptopComposite}
            alt="A founder sitting on the edge of an oversized laptop"
            width={1408}
            height={1008}
            loading="lazy"
            decoding="async"
            className="mx-auto w-full max-w-xl object-contain drop-shadow-[var(--shadow-contact)]"
          />
        </Reveal>
      </div>
    </section>
  );
}
