import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { PageHeader, Panel, PrimaryAction } from "@/components/dashboard/primitives";
import { CampaignListSkeleton } from "@/components/dashboard/skeletons";
import { API_BASE, type Campaign } from "@/lib/api";

export const Route = createFileRoute("/app/campaigns/")({
  head: () => ({
    meta: [
      { title: "Campaigns — LeadGen AI" },
      {
        name: "description",
        content: "Every campaign you've run, with live progress for the one in flight.",
      },
      { property: "og:title", content: "Campaigns — LeadGen AI" },
      {
        property: "og:description",
        content: "Track campaign progress from strategy through to scored leads.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Campaigns,
});

function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/campaigns`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          setCampaigns(data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleDeleteCampaign = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE}/api/campaigns/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campaigns"
        description="A campaign is one targeted lead search against your ICP."
        action={
          <PrimaryAction to="/app/campaigns/new">
            <Plus className="mr-1.5 size-4" /> New Campaign
          </PrimaryAction>
        }
      />

      <Panel title="All campaigns">
        {isLoading ? (
          <CampaignListSkeleton rows={5} />
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="size-6" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">No active campaigns</p>
            <p className="text-[13px] text-muted-foreground max-w-sm mx-auto">
              Launch your first campaign to extract verified B2B leads across company websites.
            </p>
            <div className="pt-2">
              <Link
                to="/app/campaigns/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" /> Create Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-border bg-cream/40">
                  {["Campaign Name", "Search Query", "Target Cap", "Created Date", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((c, i) => (
                  <tr key={c.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-row-in text-[13.5px]">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link to="/app/leads" search={{ campaign: c.id }} className="hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[12.5px]">{c.query}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {c.requested_limit} leads
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          c.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : c.status === "running" || c.status === "queued"
                            ? "bg-amber-100 text-amber-700 animate-pulse"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(c.id)}
                        className="text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110 p-1"
                        title="Delete campaign"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
