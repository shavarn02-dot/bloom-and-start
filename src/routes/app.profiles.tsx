import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/primitives";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { API_BASE, authFetch } from "@/lib/api";

export const Route = createFileRoute("/app/profiles")({
  head: () => ({
    meta: [
      { title: "Business profiles — LeadFlowX" },
      {
        name: "description",
        content:
          "Describe what your business does and who you sell to. Profiles are reused by every campaign.",
      },
      { property: "og:title", content: "Business profiles — LeadGen AI" },
      {
        property: "og:description",
        content: "The business context that drives every search.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Profiles,
});

export interface BusinessProfile {
  id: string;
  name: string;
  website?: string;
  description?: string;
  target_customer?: string;
  created_at: string;
}

function Profiles() {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    website: "",
    offering: "",
    targetRole: "",
    targetLocation: "",
    icp: "",
  });

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const resp = await authFetch(`${API_BASE}/api/profiles`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          setProfiles(data);
        }
      }
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const resp = await authFetch(`${API_BASE}/api/profiles`, {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          website: formData.website.trim(),
          description: formData.offering.trim(),
          target_customer: `${formData.targetRole} | ${formData.targetLocation} | ${formData.icp}`.trim(),
        }),
      });

      if (resp.ok) {
        await loadProfiles();
        setIsCreating(false);
        setFormData({
          name: "",
          website: "",
          offering: "",
          targetRole: "",
          targetLocation: "",
          icp: "",
        });
      }
    } catch (err) {
      console.error("Failed to save business profile:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const resp = await authFetch(`${API_BASE}/api/profiles/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete profile:", err);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Business profiles"
        description="Configure your business profiles to guide AI prospect discovery."
        action={
          !isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" /> New Profile
            </button>
          )
        }
      />

      {isCreating && (
        <Panel title="New Business Profile">
          <form className="divide-y divide-border" onSubmit={handleSubmit}>
            <div className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-center">
              <label htmlFor="name" className="text-[13px] font-medium text-secondary-foreground">
                Business Name *
              </label>
              <input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Corp"
                className="h-9 w-full rounded-md border border-input bg-paper px-3 text-[13.5px] text-foreground outline-none focus-ring-animate transition-colors duration-200 hover:border-border-strong"
              />
            </div>

            <div className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-center">
              <label htmlFor="website" className="text-[13px] font-medium text-secondary-foreground">
                Website URL
              </label>
              <input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="e.g. https://yourcompany.com"
                className="h-9 w-full rounded-md border border-input bg-paper px-3 text-[13.5px] text-foreground outline-none focus-ring-animate transition-colors duration-200 hover:border-border-strong"
              />
            </div>

            <div className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-start">
              <label htmlFor="offering" className="text-[13px] font-medium text-secondary-foreground">
                What your business does
              </label>
              <textarea
                id="offering"
                value={formData.offering}
                onChange={(e) => setFormData({ ...formData, offering: e.target.value })}
                placeholder="Describe your product, service, or offering..."
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-paper px-3 py-2 text-[13.5px] text-foreground outline-none focus-ring-animate transition-colors duration-200 hover:border-border-strong"
              />
            </div>

            <div className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-center">
              <label htmlFor="targetRole" className="text-[13px] font-medium text-secondary-foreground">
                Target Customer / Role
              </label>
              <input
                id="targetRole"
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                placeholder="e.g. Marketing Directors, Founders"
                className="h-9 w-full rounded-md border border-input bg-paper px-3 text-[13.5px] text-foreground outline-none focus-ring-animate transition-colors duration-200 hover:border-border-strong"
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-3.5">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSubmitting && (
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Save Business Profile
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="inline-flex h-9 items-center rounded-md border border-border px-3.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-cream"
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      {isLoading ? (
        <FormSkeleton rows={6} />
      ) : profiles.length > 0 ? (
        <div className="space-y-4">
          {profiles.map((p) => (
            <Panel key={p.id} title={p.name}>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <span className="text-[14px] font-semibold text-foreground">{p.name}</span>
                    {p.website && (
                      <a href={p.website} target="_blank" rel="noreferrer" className="text-[12.5px] text-muted-foreground underline hover:text-foreground">
                        {p.website}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-red-600 transition-all duration-200 hover:text-red-700 hover:scale-105"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>

                {p.description && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Offering</p>
                    <p className="text-[13.5px] text-foreground mt-0.5">{p.description}</p>
                  </div>
                )}

                {p.target_customer && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Target Audience / ICP</p>
                    <p className="text-[13.5px] text-foreground mt-0.5">{p.target_customer}</p>
                  </div>
                )}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        !isCreating && (
          <Panel>
            <EmptyState
              sketch="profile"
              title="Create your business profile."
              copy="Tell LeadGen AI what your business does and who you're trying to reach to refine your lead search."
              note="Saved profiles can be selected during campaign creation."
              action={
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="size-4" /> Create business profile
                </button>
              }
            />
          </Panel>
        )
      )}
    </div>
  );
}
