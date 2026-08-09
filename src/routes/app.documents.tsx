import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Upload, Plus } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/primitives";

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

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  added: string;
}

function Documents() {
  const [userDocs, setUserDocs] = useState<UploadedDoc[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newDoc: UploadedDoc = {
      id: "doc_" + Date.now(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      added: new Date().toLocaleDateString(),
    };
    setUserDocs((prev) => [newDoc, ...prev]);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        description="PDFs are used as extra business context for AI lead targeting."
      />

      <label className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-border-strong bg-cream/50 px-6 py-10 text-center transition-colors hover:bg-cream">
        <Upload className="size-5 text-muted-foreground" strokeWidth={1.8} />
        <span className="mt-3 text-[14px] font-medium text-foreground">
          Upload a PDF
        </span>
        <span className="mt-1 text-[13px] text-muted-foreground">
          A deck, catalogue, or company overview to enrich your lead criteria.
        </span>
        <input type="file" accept="application/pdf" className="sr-only" onChange={handleFileUpload} />
      </label>

      {userDocs.length > 0 ? (
        <Panel title="Uploaded documents">
          <ul className="divide-y divide-border">
            {userDocs.map((doc) => (
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
            title="No documents uploaded yet."
            copy="Add a PDF to give LeadGen AI richer context for prospect search and scoring."
            note="Supported formats: PDF (up to 10MB)"
          />
        </Panel>
      )}
    </div>
  );
}
