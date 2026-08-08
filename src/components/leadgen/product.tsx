import { Check, Circle, Download, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExampleDataBadge } from "@/components/leadgen/marks";
import {
  campaignSteps,
  exampleLeads,
  exampleProfile,
  type ExampleLead,
} from "@/data/example";

/** Shared chrome for a piece of real product UI shown on the marketing page. */
export function ProductFrame({
  title,
  children,
  className,
  labelled = true,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  labelled?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-paper shadow-paper",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-cream/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-border-strong" />
          <span className="text-[12px] font-medium text-muted-foreground">{title}</span>
        </div>
        {labelled && <ExampleDataBadge />}
      </div>
      {children}
    </div>
  );
}

export function BusinessProfilePanel({ compact = false }: { compact?: boolean }) {
  const rows: [string, string][] = [
    ["What your business does", exampleProfile.offering],
    ["Target role", exampleProfile.targetRole],
    ["Target location", exampleProfile.targetLocation],
    ["Company size", exampleProfile.companySize],
    ...(compact
      ? []
      : ([
          ["ICP description", exampleProfile.icp],
          ["Budget range", exampleProfile.budget],
          ["Website", exampleProfile.website],
        ] as [string, string][])),
  ];

  return (
    <div className="divide-y divide-border">
      {rows.map(([label, value]) => (
        <div key={label} className="px-4 py-3">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function CampaignProgressPanel({
  progress = 63,
  animated = true,
}: {
  progress?: number;
  animated?: boolean;
}) {
  return (
    <div className="px-4 py-4">
      <p className="text-[13px] font-semibold text-foreground">Finding your leads</p>
      <ul className="mt-3 space-y-2.5">
        {campaignSteps.map((step) => (
          <li key={step.label} className="flex items-center gap-2.5 text-[13px]">
            {step.state === "done" ? (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            ) : step.state === "active" ? (
              <span className="inline-flex size-4 items-center justify-center rounded-full border border-primary">
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-primary",
                    animated && "animate-pulse",
                  )}
                />
              </span>
            ) : (
              <Circle className="size-4 text-border-strong" strokeWidth={1.5} />
            )}
            <span
              className={cn(
                step.state === "todo" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
          {animated && (
            <span className="absolute inset-y-0 left-0 w-8 animate-sweep bg-primary-soft/60" />
          )}
        </div>
        <span className="text-[12px] font-medium tabular-nums text-muted-foreground">
          {progress}%
        </span>
      </div>
    </div>
  );
}

export function MatchBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1 w-10 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="text-[12.5px] font-medium tabular-nums text-foreground">
        {value}
      </span>
    </span>
  );
}

export function StatusPill({ status }: { status: ExampleLead["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11.5px] font-medium",
        status === "Contacted"
          ? "border-primary/30 bg-primary-soft/50 text-primary"
          : status === "Not a fit"
            ? "border-border bg-muted text-muted-foreground"
            : "border-border bg-cream text-secondary-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function LeadTable({
  leads = exampleLeads,
  onSelect,
  dense = false,
}: {
  leads?: ExampleLead[];
  onSelect?: (lead: ExampleLead) => void;
  dense?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-border bg-cream/40">
            {["Lead", "Company", "Role", "Location", "Match", "Status"].map((h) => (
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
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onSelect?.(lead)}
              className={cn(
                "transition-colors duration-150",
                onSelect && "cursor-pointer hover:bg-cream/60",
                dense ? "text-[13px]" : "text-[13.5px]",
              )}
            >
              <td className="px-4 py-3 font-medium text-foreground">
                {lead.firstName} {lead.lastName}
              </td>
              <td className="px-4 py-3 text-secondary-foreground">{lead.company}</td>
              <td className="px-4 py-3 text-muted-foreground">{lead.role}</td>
              <td className="px-4 py-3 text-muted-foreground">{lead.location}</td>
              <td className="px-4 py-3">
                <MatchBadge value={lead.match} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={lead.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      <div className="flex h-8 min-w-40 flex-1 items-center gap-2 rounded-md border border-border bg-paper px-2.5">
        <Search className="size-3.5 text-muted-foreground" />
        <span className="text-[12.5px] text-muted-foreground">Search leads</span>
      </div>
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] text-secondary-foreground">
        <Filter className="size-3.5" /> Filter
      </span>
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] text-secondary-foreground">
        Sort: Match
      </span>
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] text-secondary-foreground">
        <Download className="size-3.5" /> Export CSV
      </span>
    </div>
  );
}
