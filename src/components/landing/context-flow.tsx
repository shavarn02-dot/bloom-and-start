import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";
import {
  SketchCheck,
  SketchConnector,
  SketchGlyph,
  SketchSearch,
} from "@/components/leadgen/sketches";

/**
 * From context to leads — a hand-drawn product blueprint.
 *
 * Deliberately not a card grid: nodes are plain text on paper, joined by
 * sketch connectors that draw themselves as the reader scrolls.
 */

const nodes = [
  { label: "Your business", note: "What you sell, and to whom." },
  { label: "Context", note: "Docs, website, the things you already wrote." },
  { label: "Search", note: "A strategy built from that context." },
  { label: "Companies", note: "Organisations that fit the shape." },
  { label: "Contacts", note: "The person inside who would care." },
  { label: "Qualified leads", note: "Scored against your context." },
];

export function ContextFlow() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 lg:py-24">
        <Reveal className="max-w-2xl">
          <SectionLabel>From context to leads</SectionLabel>
          <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.4rem]">
            One path, drawn end to end.
          </h2>
        </Reveal>

        <div className="mt-12 flex flex-col items-start">
          {nodes.map((node, i) => (
            <div key={node.label} className="w-full">
              <Reveal delay={40} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-[12px] tracking-[0.16em] text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[1.35rem] font-semibold sm:text-[1.6rem]">
                  {node.label}
                </span>
                <span className="text-[14.5px] text-muted-foreground">{node.note}</span>
                {i === 2 && <SketchSearch className="ml-1 h-7 w-7" />}
                {i === nodes.length - 1 && <SketchCheck className="ml-1" />}
              </Reveal>
              {i < nodes.length - 1 && (
                <div className="ml-1 py-1">
                  <SketchConnector />
                </div>
              )}
            </div>
          ))}
        </div>

        <Reveal className="mt-10 flex items-center gap-3">
          <SketchGlyph kind="target" className="text-primary" />
          <Annotation className="text-[19px]">
            Same path every time — that's the point.
          </Annotation>
        </Reveal>
      </div>
    </section>
  );
}
