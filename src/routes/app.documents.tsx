import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { ExampleDataBadge } from "@/components/leadgen/marks";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/primitives";
import { exampleDocuments } from "@/data/example";

export const Route = createFileRoute("/app/documents")({
  head: () => ({
    meta: [
      { title: "Documents — LeadGen AI" },
      {
        name: "description",
        content:
          "Attach PDFs so LeadGen has more context about your business when building a search strategy.",
      },
      { property: "og:title", content: "Documents — LeadGen AI" },
      {
        property: "og:description",
        content: "PDF context for sharper search strategies.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Documents,
});

function Documents() {
  const [hasDocs, setHasDocs] = useState(true);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        description="PDFs are read as extra business context. Nothing is shared with other accounts."
        action={
          <button
            type="button"
            onClick={() => setHasDocs((v) => !v)}
            className="inline-flex h-9 items-center rounded-md border border-border bg-paper px-3.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-cream"
          >
            {hasDocs ? "Preview empty state" : "Show example documents"}
          </button>
        }
      />

      <label className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-border-strong bg-cream/50 px-6 py-10 text-center transition-colors hover:bg-cream">
        <Upload className="size-5 text-muted-foreground" strokeWidth={1.8} />
        <span className="mt-3 text-[14px] font-medium text-foreground">
          Add a PDF
        </span>
        <span className="mt-1 text-[13px] text-muted-foreground">
          A deck, a catalogue, a one-pager — whatever describes your business best.
        </span>
        <input type="file" accept="application/pdf" className="sr-only" />
      </label>

      {hasDocs ? (
        <Panel title="Uploaded" aside={<ExampleDataBadge />}>
          <ul className="divide-y divide-border">
            {exampleDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <span className="truncate text-[13.5px] font-medium text-foreground">
                    {doc.name}
                  </span>
                </span>
                <span className="shrink-0 text-[12.5px] text-muted-foreground">
                  {doc.size} · {doc.added}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            sketch="doc"
            title="No documents uploaded."
            copy="Add a PDF to give LeadGen more context about your business."
            note="Anything you'd hand a new salesperson works here."
          />
        </Panel>
      )}
    </div>
  );
}
