import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { Annotation, ExampleDataBadge } from "@/components/leadgen/marks";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { BusinessProfilePanel, CampaignProgressPanel } from "@/components/leadgen/product";
import { exampleProfile } from "@/data/example";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/campaigns/new")({
  head: () => ({
    meta: [
      { title: "New campaign — LeadGen AI" },
      {
        name: "description",
        content:
          "Create a campaign in four steps: pick a profile, review the audience, confirm, generate leads.",
      },
      { property: "og:title", content: "New campaign — LeadGen AI" },
      {
        property: "og:description",
        content: "A structured four-step campaign form — no chat window.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewCampaign,
});

const steps = [
  "Select business profile",
  "Review target audience",
  "Confirm campaign",
  "Generate leads",
];

function NewCampaign() {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="New campaign"
        description="Four steps. Everything is editable before you run it."
      />

      <ol className="flex flex-wrap gap-x-6 gap-y-2">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-2 text-[13px]">
            <span
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                i < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === step
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3" strokeWidth={3} /> : i + 1}
            </span>
            <span className={i === step ? "text-foreground" : "text-muted-foreground"}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Panel title="Select business profile">
          <ul className="divide-y divide-border">
            <li className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="text-[14px] font-medium">{exampleProfile.name}</p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {exampleProfile.industry} · {exampleProfile.website}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary-soft/40 px-2.5 py-1 text-[12.5px] font-medium text-primary">
                <Check className="size-3.5" strokeWidth={3} /> Selected
              </span>
            </li>
          </ul>
          <div className="border-t border-border px-4 py-3">
            <Link to="/app/profiles" className="text-[13px] text-primary hover:underline">
              Create another profile
            </Link>
          </div>
        </Panel>
      )}

      {step === 1 && (
        <Panel title="Review target audience" aside={<ExampleDataBadge />}>
          <BusinessProfilePanel />
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Confirm campaign">
          <dl className="divide-y divide-border">
            {[
              ["Campaign name", "Mid-size textile manufacturers"],
              ["Business profile", exampleProfile.name],
              ["Target roles", exampleProfile.targetRole],
              ["Regions", exampleProfile.targetLocation],
              ["Leads to find", "50 (free plan maximum)"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                <dt className="text-[13px] text-muted-foreground">{k}</dt>
                <dd className="text-[13.5px] font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Finding your leads" aside={<ExampleDataBadge />}>
          <CampaignProgressPanel progress={63} />
          <div className="border-t border-border px-4 py-3">
            <Annotation>You can leave this page — it keeps running.</Annotation>
          </div>
        </Panel>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex h-9 items-center rounded-md border border-border bg-paper px-3.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-cream disabled:opacity-40"
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {step === 2 ? "Generate leads →" : "Continue →"}
          </button>
        ) : (
          <Link
            to="/app/leads"
            className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View leads →
          </Link>
        )}
      </div>
    </div>
  );
}
