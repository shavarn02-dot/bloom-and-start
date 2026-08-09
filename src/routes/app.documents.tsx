import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileText, Upload, Trash2, Loader2 } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/primitives";
import { API_BASE } from "@/lib/api";

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

interface AppDocument {
  id: string;
  name: string;
  mime_type?: string;
  status: string;
  created_at: string;
}

function Documents() {
  const [userDocs, setUserDocs] = useState<AppDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/documents`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          setUserDocs(data);
        }
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;
    setIsUploading(true);

    try {
      const resp = await fetch(`${API_BASE}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          mime_type: file.type || "application/pdf",
        }),
      });

      if (resp.ok) {
        await loadDocuments();
      }
    } catch (err) {
      console.error("Failed to upload document:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE}/api/documents/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setUserDocs((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        description="PDFs are used as extra business context for AI lead targeting."
      />

      <label className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-border-strong bg-cream/50 px-6 py-10 text-center transition-colors hover:bg-cream">
        {isUploading ? (
          <Loader2 className="size-5 text-primary animate-spin" />
        ) : (
          <Upload className="size-5 text-muted-foreground" strokeWidth={1.8} />
        )}
        <span className="mt-3 text-[14px] font-medium text-foreground">
          {isUploading ? "Saving document..." : "Upload a PDF"}
        </span>
        <span className="mt-1 text-[13px] text-muted-foreground">
          A deck, catalogue, or company overview to enrich your lead criteria.
        </span>
        <input
          type="file"
          accept="application/pdf"
          disabled={isUploading}
          className="sr-only"
          onChange={handleFileUpload}
        />
      </label>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground text-[13.5px]">
          <Loader2 className="size-4 animate-spin mr-2" /> Loading documents...
        </div>
      ) : userDocs.length > 0 ? (
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
                <div className="flex items-center gap-4">
                  <span className="shrink-0 text-[12.5px] text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-700 transition-colors p-1"
                    title="Delete document"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
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
