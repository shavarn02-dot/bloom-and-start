import { createFileRoute } from "@tanstack/react-router";
import { Annotation } from "@/components/leadgen/marks";
import { PageHeader, Panel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LeadGen AI" },
      {
        name: "description",
        content: "Account details, plan limits and campaign preferences.",
      },
      { property: "og:title", content: "Settings — LeadGen AI" },
      {
        property: "og:description",
        content: "Account details and current plan limits.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Settings,
});

function Settings() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Your account and current plan." />

      <Panel title="Account">
        <form className="divide-y divide-border" onSubmit={(e) => e.preventDefault()}>
          {[
            { label: "Name", type: "text", placeholder: "Your name" },
            { label: "Work email", type: "email", placeholder: "you@company.com" },
            { label: "Company", type: "text", placeholder: "Company name" },
          ].map((f) => (
            <div
              key={f.label}
              className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-center"
            >
              <label
                htmlFor={f.label}
                className="text-[13px] font-medium text-secondary-foreground"
              >
                {f.label}
              </label>
              <input
                id={f.label}
                type={f.type}
                placeholder={f.placeholder}
                className="h-9 w-full rounded-md border border-input bg-paper px-3 text-[13.5px] text-foreground outline-none focus:border-ring"
              />
            </div>
          ))}
          <div className="px-4 py-3.5">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save changes
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Plan">
        <div className="space-y-3 px-4 py-4">
          <p className="text-[14px] font-medium text-foreground">Free</p>
          <ul className="space-y-1.5 text-[13.5px] text-muted-foreground">
            <li>Up to 3 business profiles</li>
            <li>Up to 50 leads per campaign</li>
            <li>Up to 10 campaigns per month</li>
            <li>CSV export, lead filtering, lead detail view</li>
          </ul>
          <Annotation className="block">No card on file, and none needed.</Annotation>
        </div>
      </Panel>
    </div>
  );
}
