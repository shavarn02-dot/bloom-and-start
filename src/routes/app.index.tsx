import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Plus, Loader2, Target } from "lucide-react";
import { Annotation } from "@/components/leadgen/marks";
import { PageHeader, Panel, PrimaryAction } from "@/components/dashboard/primitives";
import { StatusPill } from "@/components/leadgen/product";
import { API_BASE, type Campaign } from "@/lib/api";

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const resp = await fetch(`${API_BASE}/api/campaigns`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) {
            setCampaigns(data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch campaigns for overview:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, []);

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

      <Panel title="Recent campaigns">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground text-[13.5px]">
            <Loader2 className="size-4 animate-spin mr-2" /> Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="size-6" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">No campaigns created yet</p>
            <p className="text-[13px] text-muted-foreground max-w-sm mx-auto">
              Start your first campaign to search the web, extract verified contact info, and generate targeted B2B leads.
            </p>
            <div className="pt-2">
              <Link
                to="/app/campaigns/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" /> Create First Campaign
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link
                  to="/app/leads"
                  search={{ campaign: c.id }}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-cream/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-foreground">
                      {c.name}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground font-mono">
                      {c.query} · {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[12.5px] tabular-nums text-muted-foreground">
                      Cap: {c.requested_limit} leads
                    </span>
                    <StatusPill status={c.status === "completed" ? "Contacted" : c.status === "running" ? "Reviewing" : "New"} />
                    <ArrowRight className="size-4 text-border-strong" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        <UsageCard label="Business profiles" used={0} limit={3} />
        <UsageCard label="Campaigns this month" used={campaigns.length} limit={10} />
        <UsageCard label="Leads per campaign" used={0} limit={50} />
      </div>

      <Annotation className="block">
        Free plan limits — 10 campaigns / month, up to 50 leads per campaign.
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
