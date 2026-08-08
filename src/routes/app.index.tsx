import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { Annotation, ExampleDataBadge } from "@/components/leadgen/marks";
import { PageHeader, Panel, PrimaryAction } from "@/components/dashboard/primitives";
import { exampleCampaigns } from "@/data/example";
import { StatusPill } from "@/components/leadgen/product";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Overview — LeadGen AI" },
      {
        name: "description",
        content: "Your campaigns at a glance and a single place to start the next one.",
      },
      { property: "og:title", content: "Overview — LeadGen AI" },
      {
        property: "og:description",
        content: "Your campaigns at a glance in the LeadGen AI workspace.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Good morning."
        description="What are we looking for today?"
        action={
          <PrimaryAction to="/app/campaigns/new">
            <Plus className="mr-1.5 size-4" /> New Campaign
          </PrimaryAction>
        }
      />

      <Panel
        title="Recent campaigns"
        aside={<ExampleDataBadge />}
      >
        <ul className="divide-y divide-border">
          {exampleCampaigns.map((c) => (
            <li key={c.id}>
              <Link
                to="/app/campaigns"
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-cream/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    {c.name}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {c.profile} · {c.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[12.5px] tabular-nums text-muted-foreground">
                    {c.leads} leads
                  </span>
                  <StatusPill status={c.status === "Completed" ? "Contacted" : "New"} />
                  <ArrowRight className="size-4 text-border-strong" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        <UsageCard label="Business profiles" used={1} limit={3} />
        <UsageCard label="Campaigns this month" used={3} limit={10} />
        <UsageCard label="Leads per campaign" used={48} limit={50} />
      </div>

      <Annotation className="block">
        Free plan limits — they're the same ones listed on the pricing page.
      </Annotation>
    </div>
  );
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-paper p-4">
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
      <p className="mt-2 text-[1.4rem] font-semibold tabular-nums">
        {used}
        <span className="text-[13px] font-normal text-muted-foreground"> / {limit}</span>
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
        />
      </div>
    </div>
  );
}
