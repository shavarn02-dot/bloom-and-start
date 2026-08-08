import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ExampleDataBadge } from "@/components/leadgen/marks";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/primitives";
import { exampleProfile } from "@/data/example";

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

const fields = [
  { label: "Business name", value: exampleProfile.name, type: "input" },
  { label: "Industry", value: exampleProfile.industry, type: "input" },
  { label: "What your business does", value: exampleProfile.offering, type: "area" },
  { label: "Target role", value: exampleProfile.targetRole, type: "input" },
  { label: "Target location", value: exampleProfile.targetLocation, type: "input" },
  { label: "ICP description", value: exampleProfile.icp, type: "area" },
  { label: "Company size", value: exampleProfile.companySize, type: "input" },
  { label: "Budget range", value: exampleProfile.budget, type: "input" },
  { label: "Website", value: exampleProfile.website, type: "input" },
] as const;

function Profiles() {
  const [hasProfile, setHasProfile] = useState(true);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Business profiles"
        description="Up to 3 profiles on the free plan."
        action={
          <button
            type="button"
            onClick={() => setHasProfile((v) => !v)}
            className="inline-flex h-9 items-center rounded-md border border-border bg-paper px-3.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-cream"
          >
            {hasProfile ? "Preview empty state" : "Show example profile"}
          </button>
        }
      />

      {hasProfile ? (
        <Panel title="Loomwork Supply" aside={<ExampleDataBadge />}>
          <form className="divide-y divide-border" onSubmit={(e) => e.preventDefault()}>
            {fields.map((f) => (
              <div key={f.label} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-start">
                <label
                  htmlFor={f.label}
                  className="text-[13px] font-medium text-secondary-foreground"
                >
                  {f.label}
                </label>
                {f.type === "area" ? (
                  <textarea
                    id={f.label}
                    defaultValue={f.value}
                    rows={2}
                    className="w-full resize-none rounded-md border border-input bg-paper px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-ring"
                  />
                ) : (
                  <input
                    id={f.label}
                    defaultValue={f.value}
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
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-cream"
              >
                <Plus className="size-4" /> New profile
              </button>
            </div>
          </form>
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            sketch="profile"
            title="Create your first business profile."
            copy="Tell LeadGen what your business does and who you're trying to reach. Everything else builds on this."
            note="Start with what you already know."
            action={
              <button
                type="button"
                onClick={() => setHasProfile(true)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create business profile
              </button>
            }
          />
        </Panel>
      )}
    </div>
  );
}
