import { SectionLabel } from "@/components/leadgen/marks";

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
  return (
    <section className="border-y border-border bg-cream">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <SectionLabel>Under the hood</SectionLabel>
          <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            One path, five deliberate stages.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
            LeadGen AI routes work across several AI providers. If one reaches its limit,
            the next one picks the job up — the workflow stays the same either way.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5">
          {flow.map((stage, i) => (
            <li key={stage.title} className="bg-paper p-5">
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
