import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { ExampleDataBadge } from "@/components/leadgen/marks";
import { PageHeader, Panel, PrimaryAction } from "@/components/dashboard/primitives";
import { CampaignProgressPanel } from "@/components/leadgen/product";
import { exampleCampaigns } from "@/data/example";

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
  const running = exampleCampaigns.find((c) => c.status === "Running");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campaigns"
        description="A campaign is one search run against one business profile."
        action={
          <PrimaryAction to="/app/campaigns/new">
            <Plus className="mr-1.5 size-4" /> New Campaign
          </PrimaryAction>
        }
      />

      {running && (
        <Panel title="Running now" aside={<ExampleDataBadge />}>
          <div className="border-b border-border px-4 py-3">
            <p className="text-[14px] font-medium">{running.name}</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {running.profile} · started {running.createdAt}
            </p>
          </div>
          <CampaignProgressPanel progress={running.progress} />
        </Panel>
      )}

      <Panel title="All campaigns" aside={<ExampleDataBadge />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-border bg-cream/40">
                {["Campaign", "Profile", "Leads", "Created", "Status"].map((h) => (
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
              {exampleCampaigns.map((c) => (
                <tr key={c.id} className="text-[13.5px]">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link to="/app/leads" className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-secondary-foreground">{c.profile}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {c.leads}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.createdAt}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
