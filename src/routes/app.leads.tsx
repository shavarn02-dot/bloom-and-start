import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Download, Search, RefreshCw, Loader2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { TableSkeleton, MobileCardSkeleton } from "@/components/dashboard/skeletons";
import { LeadTable, MatchBadge, StatusPill } from "@/components/leadgen/product";
import { exampleLeads, type ExampleLead } from "@/data/example";
import { getCampaignLeads, API_BASE, Lead } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/app/leads")({
  head: () => ({
    meta: [
      { title: "Your leads — LeadGen AI" },
      {
        name: "description",
        content: "Search, filter, sort and export real extracted leads.",
      },
    ],
  }),
  component: Leads,
});

const statuses = ["All", "New", "Reviewing", "Contacted", "Not a fit"] as const;

function Leads() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<ExampleLead | null>(null);

  // Real leads state
  const [realLeads, setRealLeads] = useState<ExampleLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real leads from API
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      // Fetch latest campaign first
      const campResp = await fetch(`${API_BASE}/api/campaigns`);
      if (campResp.ok) {
        const campaigns = await campResp.json();
        if (campaigns && campaigns.length > 0) {
          const latestId = campaigns[0].id;
          const apiLeads: Lead[] = await getCampaignLeads(latestId);

          if (apiLeads && apiLeads.length > 0) {
            const mapped: ExampleLead[] = apiLeads.map((l) => ({
              id: l.id,
              firstName: (l.contact_name ? l.contact_name.split(" ")[0] : "Team") ?? "Team",
              lastName: l.contact_name && l.contact_name.split(" ").length > 1 ? l.contact_name.split(" ").slice(1).join(" ") : "",
              role: l.title || "Decision Maker",
              company: l.company_name,
              industry: "B2B / Services",
              companySize: "10-100",
              location: "India / Global",
              email: l.email || "N/A",
              emailStatus: l.verification_status === "verified" ? "Verified" : "Unverified",
              phone: l.phone || "",
              match: l.confidence || 75,
              source: l.source_url || l.website || "Web Scraping",
              status: "New",
            }));

            setRealLeads(mapped);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.error("Failed to load real leads from API:", err);
    }
    // Fallback to example leads if API is empty
    setRealLeads([]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const activeLeadList = realLeads;

  const leads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeLeadList
      .filter((l) => (status === "All" ? true : l.status === status))
      .filter((l) =>
        q
          ? `${l.firstName} ${l.lastName} ${l.company} ${l.role} ${l.location} ${l.email}`
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => (sortDesc ? b.match - a.match : a.match - b.match));
  }, [query, status, sortDesc, activeLeadList]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your leads"
        description="Search, filter, and export real extracted leads from your live scraping campaigns."
      />

      <Panel aside={undefined}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <label className="flex h-8 min-w-44 flex-1 items-center gap-2 rounded-md border border-border bg-paper px-2.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="sr-only">Search leads</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads..."
              className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof statuses)[number])}
            className="h-8 rounded-md border border-border bg-paper px-2 text-[12.5px] text-secondary-foreground outline-none"
            aria-label="Filter by status"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSortDesc((v) => !v)}
            className="inline-flex h-8 items-center rounded-md border border-border bg-paper px-2.5 text-[12.5px] text-secondary-foreground transition-colors hover:bg-cream"
          >
            Match {sortDesc ? "↓" : "↑"}
          </button>

          <button
            type="button"
            onClick={fetchLeads}
            disabled={isLoading}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-paper px-2.5 text-[12.5px] text-secondary-foreground transition-colors hover:bg-cream"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Leads
          </button>

          <button
            type="button"
            onClick={() => exportCsv(leads)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-paper px-2.5 text-[12.5px] text-secondary-foreground transition-colors hover:bg-cream"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>

        {isLoading ? (
          <>
            <TableSkeleton rows={5} />
            <MobileCardSkeleton cards={4} />
          </>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-[14px] font-semibold text-foreground">No extracted leads yet</p>
            <p className="text-[13px] text-muted-foreground max-w-sm mx-auto">
              {query ? "No leads match your search query." : "Launch a campaign to search company websites and extract verified B2B contacts."}
            </p>
          </div>
        ) : (
          <LeadTable leads={leads} onSelect={setSelected} />
        )}
      </Panel>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selected.firstName} {selected.lastName}
                </SheetTitle>
                <SheetDescription>
                  {selected.role} at {selected.company}
                </SheetDescription>
              </SheetHeader>

              <div className="flex items-center justify-between border-y border-border px-4 py-3">
                <MatchBadge value={selected.match} />
                <StatusPill status={selected.status} />
              </div>

              <dl className="divide-y divide-border px-4">
                {(
                  [
                    ["First name", selected.firstName],
                    ["Last name", selected.lastName],
                    ["Role / title", selected.role],
                    ["Company", selected.company],
                    ["Company industry", selected.industry],
                    ["Company size", selected.companySize],
                    ["Location", selected.location],
                    ["Email", selected.email],
                    ["Email status", selected.emailStatus],
                    ...(selected.phone ? [["Phone", selected.phone]] : []),
                    ["Match score", String(selected.match)],
                    ["Source", selected.source],
                    ["Lead status", selected.status],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="py-3">
                    <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                      {k}
                    </dt>
                    <dd className="mt-1 text-[13.5px] text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function exportCsv(leads: ExampleLead[]) {
  const header = [
    "First name",
    "Last name",
    "Role",
    "Company",
    "Industry",
    "Company size",
    "Location",
    "Email",
    "Email status",
    "Phone",
    "Match",
    "Source",
    "Status",
  ];
  const rows = leads.map((l) => [
    l.firstName,
    l.lastName,
    l.role,
    l.company,
    l.industry,
    l.companySize,
    l.location,
    l.email,
    l.emailStatus,
    l.phone ?? "",
    String(l.match),
    l.source,
    l.status,
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "leadflowx-leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}
