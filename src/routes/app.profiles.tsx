import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/app/profiles")({
  head: () => ({
    meta: [
      { title: "Business profiles — LeadGen AI" },
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

function Profiles() {
  const [hasProfile, setHasProfile] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    offering: "",
    targetRole: "",
    targetLocation: "",
    icp: "",
    companySize: "",
    budget: "",
    website: "",
  });

  const fields = [
    { key: "name", label: "Business name", placeholder: "e.g. Acme Corp", type: "input" },
    { key: "industry", label: "Industry", placeholder: "e.g. SaaS / Marketing", type: "input" },
    { key: "offering", label: "What your business does", placeholder: "e.g. B2B lead generation software", type: "area" },
    { key: "targetRole", label: "Target role", placeholder: "e.g. Founder, Marketing Director", type: "input" },
    { key: "targetLocation", label: "Target location", placeholder: "e.g. India, USA, Global", type: "input" },
    { key: "icp", label: "ICP description", placeholder: "Describe your ideal customer profile...", type: "area" },
    { key: "companySize", label: "Company size", placeholder: "e.g. 10-100 employees", type: "input" },
    { key: "budget", label: "Budget range", placeholder: "e.g. $1k-$10k", type: "input" },
    { key: "website", label: "Website", placeholder: "e.g. https://yourcompany.com", type: "input" },
  ] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Business profiles"
        description="Configure your business profile to guide AI lead discovery."
      />

      {hasProfile ? (
        <Panel title={formData.name || "New Business Profile"}>
          <form className="divide-y divide-border" onSubmit={handleSubmit}>
            {fields.map((f) => (
              <div key={f.key} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-start">
                <label
                  htmlFor={f.key}
                  className="text-[13px] font-medium text-secondary-foreground"
                >
                  {f.label}
                </label>
                {f.type === "area" ? (
                  <textarea
                    id={f.key}
                    value={formData[f.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    rows={2}
                    className="w-full resize-none rounded-md border border-input bg-paper px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-ring"
                  />
                ) : (
                  <input
                    id={f.key}
                    value={formData[f.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="h-9 w-full rounded-md border border-input bg-paper px-3 text-[13.5px] text-foreground outline-none focus:border-ring"
                  />
                )}
              </div>
            ))}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Save profile
              </button>
              {saved && <span className="text-[13px] font-medium text-emerald-600">Saved successfully!</span>}
            </div>
          </form>
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            sketch="profile"
            title="Create your business profile."
            copy="Tell LeadGen AI what your business does and who you're trying to reach to refine your lead search."
            note="Saved profiles can be selected during campaign creation."
            action={
              <button
                type="button"
                onClick={() => setHasProfile(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" /> Create business profile
              </button>
            }
          />
        </Panel>
      )}
    </div>
  );
}
