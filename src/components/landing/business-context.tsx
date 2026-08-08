import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";

const fields = [
  { label: "What your business does", hint: "One or two honest sentences." },
  { label: "Target role", hint: "Who signs off on this." },
  { label: "Target location", hint: "Countries or cities you serve." },
  { label: "ICP description", hint: "The customer you already do well with." },
  { label: "Company size", hint: "Headcount range that fits your offer." },
  { label: "Budget range", hint: "Optional, but it sharpens matching." },
  { label: "Website", hint: "So context can be read from your own pages." },
];

export function BusinessContext() {
  return (
    <section id="context" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
        <Reveal>
          <SectionLabel>Business context</SectionLabel>
          <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            The better we understand your business, the better we can search.
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
            A profile takes a few minutes and is reused across every campaign. You can
            also attach a PDF — a deck, a catalogue, a one-pager — and let LeadGen read
            the detail from there.
          </p>
          <Annotation className="mt-5 block">"Start with what you already know."</Annotation>
        </Reveal>

        <ul className="divide-y divide-border rounded-lg border border-border bg-paper">
          {fields.map((field, i) => (
            <Reveal
              as="li"
              key={field.label}
              delay={i * 70}
              className="flex items-baseline justify-between gap-6 px-5 py-4 transition-colors duration-200 hover:bg-cream/60"
            >
              <span className="text-[14.5px] font-medium text-foreground">
                {field.label}
              </span>
              <span className="text-right text-[13px] text-muted-foreground">
                {field.hint}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
