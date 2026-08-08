import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { ExampleDataBadge } from "@/components/leadgen/marks";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { LeadTable, MatchBadge, StatusPill } from "@/components/leadgen/product";
import { exampleLeads, type ExampleLead } from "@/data/example";
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
        content:
          "Search, filter, sort and export the leads a campaign returned, and open any lead for full detail.",
      },
      { property: "og:title", content: "Your leads — LeadGen AI" },
      {
        property: "og:description",
        content: "A plain table of scored leads you can filter and export.",
      },
      { name: "robots", content: "noindex" },
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

  const leads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exampleLeads
      .filter((l) => (status === "All" ? true : l.status === status))
      .filter((l) =>
        q
          ? `${l.firstName} ${l.lastName} ${l.company} ${l.role} ${l.location}`
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => (sortDesc ? b.match - a.match : a.match - b.match));
  }, [query, status, sortDesc]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your leads"
        description="From the campaign “Mid-size textile manufacturers”."
      />

      <Panel aside={undefined}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <label className="flex h-8 min-w-44 flex-1 items-center gap-2 rounded-md border border-border bg-paper px-2.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="sr-only">Search leads</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads"
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
            onClick={() => exportCsv(leads)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-paper px-2.5 text-[12.5px] text-secondary-foreground transition-colors hover:bg-cream"
          >
            <Download className="size-3.5" /> Export CSV
          </button>

          <ExampleDataBadge className="ml-auto" />
        </div>

        {leads.length === 0 ? (
          <p className="px-4 py-12 text-center text-[14px] text-muted-foreground">
            No leads match those filters.
          </p>
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

              <div className="px-4 py-4">
                <ExampleDataBadge />
              </div>
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
  a.download = "leadgen-leads-example.csv";
  a.click();
  URL.revokeObjectURL(url);
}
