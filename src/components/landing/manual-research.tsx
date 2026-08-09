import manualResearch from "@/assets/manual-research.jpg";
import { Annotation, HandUnderline } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";
import { SketchArrow, SketchGlyph } from "@/components/leadgen/sketches";

/**
 * Moment 02 — the manual research scene.
 *
 * Photography does the talking: one real business owner, one laptop, and the
 * loop of tabs annotated around him. No cards, no product UI. The section ends
 * by handing the tedious part over to LeadGen, which sets up How it works.
 */

const loop = [
  { kind: "window", label: "Search again" },
  { kind: "window", label: "Open website" },
  { kind: "doc", label: "Find contact" },
  { kind: "mail", label: "Check email" },
  { kind: "sheet", label: "Copy into sheet" },
  { kind: "window", label: "Repeat" },
] as const;


export function ManualResearch() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 pt-16 pb-8 sm:px-8 lg:pt-24">
        <Reveal className="max-w-2xl">
          <h2 className="text-[2rem] leading-[1.12] font-semibold sm:text-[2.6rem]">
            Most of lead research is just{" "}
            <HandUnderline>opening tabs</HandUnderline>.
          </h2>
        </Reveal>
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-12">
        <Reveal variant="scale">
          <img
            src={manualResearch}
            alt="A business owner researching companies on a laptop at his desk"
            width={1600}
            height={1104}
            loading="lazy"
            decoding="async"
            className="w-full object-cover"
            style={{ clipPath: "polygon(0 2%, 97% 0, 100% 97%, 3% 100%)" }}
          />
        </Reveal>

        <div className="relative min-w-0 lg:pb-6">
          <SketchArrow className="hidden lg:mb-1 lg:block" />

          <ol className="space-y-3">
            {loop.map((item, i) => (
              <Reveal
                as="li"
                key={item.label}
                delay={i * 90}
                className="flex items-center gap-3"
              >
                <SketchGlyph kind={item.kind} className="shrink-0" />
                <span className="text-[15.5px] text-secondary-foreground">
                  {item.label}
                </span>
              </Reveal>
            ))}
          </ol>
          <Annotation className="mt-5 block -rotate-1 text-[19px]">
            …and then do it again for the next company.
          </Annotation>
        </div>
      </div>

      <Reveal className="mx-auto max-w-6xl px-5 pt-14 pb-4 text-center sm:px-8 lg:pt-20">
        <p className="mx-auto max-w-2xl text-[1.6rem] leading-snug font-semibold sm:text-[2.1rem]">
          You didn't start a business to do this all day.
        </p>
        <p className="mx-auto mt-3 max-w-lg text-[15.5px] text-muted-foreground">
          LeadGen does the tedious part. You keep the part that actually needs you:
          deciding who is worth a conversation.
        </p>
      </Reveal>

    </section>
  );
}
