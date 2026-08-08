import { SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";
import { useInView } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const flow = [
  {
    title: "Your business context",
    copy: "Profile fields, uploaded documents, your website.",
  },
  {
    title: "Search strategy",
    copy: "Roles, regions, company shapes and signals worth looking for.",
  },
  {
    title: "Discovery",
    copy: "Companies and people gathered from public sources.",
  },
  {
    title: "Verification & scoring",
    copy: "Contacts checked, then each lead scored against your context.",
  },
  {
    title: "Your lead list",
    copy: "A table you can filter, inspect and export.",
  },
];

export function AiWorkflow() {
  const { ref, inView } = useInView<HTMLOListElement>({ threshold: 0.3 });

  return (
    <section className="border-y border-border bg-cream">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel>Under the hood</SectionLabel>
          <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            One path, five deliberate stages.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
            LeadGen AI routes work across several AI providers. If one reaches its limit,
            the next one picks the job up — the workflow stays the same either way.
          </p>
        </Reveal>

        {/* Hand-drawn connector that draws itself once the flow is on screen. */}
        <svg
          viewBox="0 0 1000 40"
          className={cn(
            "mt-12 hidden h-8 w-full text-border-strong lg-sketch md:block",
            inView && "lg-sketch-on",
          )}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 26c150-16 320 14 470 2s340-20 490 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>

        <ol
          ref={ref}
          className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5"
        >
          {flow.map((stage, i) => (
            <li
              key={stage.title}
              data-visible={inView ? "true" : "false"}
              className="lg-reveal bg-paper p-5 transition-colors duration-200 hover:bg-cream/50"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <p className="font-mono text-[12px] tracking-[0.14em] text-primary">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-[14.5px] font-semibold text-foreground">
                {stage.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {stage.copy}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
