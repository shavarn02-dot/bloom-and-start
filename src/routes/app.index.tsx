import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Plus, Target, Building2, Sparkles } from "lucide-react";
import { Annotation } from "@/components/leadgen/marks";
import { PageHeader, Panel, PrimaryAction } from "@/components/dashboard/primitives";
import { CampaignListSkeleton, UsageCardsSkeleton } from "@/components/dashboard/skeletons";
import { StatusPill } from "@/components/leadgen/product";
import { API_BASE, type Campaign } from "@/lib/api";
import type { BusinessProfile } from "@/routes/app.profiles";

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
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [campResp, profResp] = await Promise.all([
          fetch(`${API_BASE}/api/campaigns`),
          fetch(`${API_BASE}/api/profiles`),
        ]);

        if (campResp.ok) {
          const campData = await campResp.json();
          if (Array.isArray(campData)) setCampaigns(campData);
        }

        if (profResp.ok) {
          const profData = await profResp.json();
          if (Array.isArray(profData)) setProfiles(profData);
        }
      } catch (err) {
        console.warn("Failed to fetch overview data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
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

      {/* Step 1 Onboarding Card: Business Profile Prompt */}
      {!isLoading && profiles.length === 0 && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                <Sparkles className="size-3" /> Step 1: Recommended Setup
              </div>
              <h3 className="text-[16px] font-semibold text-foreground">
                Create your Business Profile first
              </h3>
              <p className="text-[13.5px] text-muted-foreground max-w-xl leading-relaxed">
                Define what your business does and who your target audience is. This context is automatically used by our AI scraper to score prospects and tailor search queries.
              </p>
            </div>
            <Link
              to="/app/profiles"
              className="inline-flex shrink-0 h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13.5px] font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
            >
              <Building2 className="size-4" /> Create Profile →
            </Link>
          </div>
        </div>
      )}

      <Panel title="Recent campaigns">
        {isLoading ? (
          <CampaignListSkeleton rows={4} />
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
            {campaigns.map((c, i) => (
              <li key={c.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-row-in">
                <Link
                  to="/app/leads"
                  search={{ campaign: c.id }}
                  className="group flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-cream/60"
                >
                  <div className="min-w-0 flex-1">
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
                    <ArrowRight className="size-4 text-border-strong transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {isLoading ? (
        <UsageCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <UsageCard label="Business profiles" used={profiles.length} limit={3} />
          <UsageCard label="Campaigns this month" used={campaigns.length} limit={10} />
          <UsageCard label="Leads per campaign" used={0} limit={50} />
        </div>
      )}

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
    <div className="rounded-lg border border-border bg-paper p-4 hover-lift">
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
      <p className="mt-2 text-[1.4rem] font-semibold tabular-nums">
        {used}
        <span className="text-[13px] font-normal text-muted-foreground"> / {limit}</span>
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
        />
      </div>
    </div>
  );
}
