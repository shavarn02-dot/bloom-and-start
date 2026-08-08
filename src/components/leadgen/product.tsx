import { Check, Circle, Download, FileText, Filter, Globe, Search, ShieldCheck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-reveal";
import { ExampleDataBadge } from "@/components/leadgen/marks";
import {
  campaignSteps,
  exampleDocuments,
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

export function BusinessProfilePanel({
  compact = false,
  revealCount,
}: {
  compact?: boolean;
  /** Show only the first N rows, revealed one after another. */
  revealCount?: number;
}) {
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

  const shown = revealCount === undefined ? rows : rows.slice(0, revealCount);

  return (
    <div className="divide-y divide-border">
      {shown.map(([label, value], i) => (
        <div
          key={label}
          className={cn("px-4 py-3", revealCount !== undefined && "animate-row-in")}
          style={
            revealCount !== undefined ? { animationDelay: `${i * 70}ms` } : undefined
          }
        >
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
  activeIndex,
}: {
  progress?: number;
  animated?: boolean;
  /** Overrides the static example states so motion can drive the sequence. */
  activeIndex?: number;
}) {
  const steps = campaignSteps.map((step, i) => {
    if (activeIndex === undefined) return step;
    return {
      label: step.label,
      state: i < activeIndex ? "done" : i === activeIndex ? "active" : "todo",
    } as (typeof campaignSteps)[number];
  });

  return (
    <div className="px-4 py-4">
      <p className="text-[13px] font-semibold text-foreground">Finding your leads</p>
      <ul className="mt-3 space-y-2.5">
        {steps.map((step) => (
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
                "transition-colors duration-300",
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
          {animated && progress < 100 && (
            <span className="absolute inset-y-0 left-0 w-8 animate-sweep bg-primary-soft/60" />
          )}
        </div>
        <span className="text-[12px] font-medium tabular-nums text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

export function MatchBadge({
  value,
  animate = false,
}: {
  value: number;
  animate?: boolean;
}) {
  const shown = useCountUp(value, animate);
  const display = animate ? shown : value;

  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1 w-10 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${display}%` }}
        />
      </span>
      <span className="text-[12.5px] font-medium tabular-nums text-foreground">
        {display}
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
  animateRows = false,
  animateScores = false,
  showVerification = false,
}: {
  leads?: ExampleLead[];
  onSelect?: (lead: ExampleLead) => void;
  dense?: boolean;
  /** Rows arrive one after another, the way results land in a real campaign. */
  animateRows?: boolean;
  animateScores?: boolean;
  showVerification?: boolean;
}) {
  const headers = showVerification
    ? ["Lead", "Company", "Role", "Email", "Match", "Status"]
    : ["Lead", "Company", "Role", "Location", "Match", "Status"];

  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-border bg-cream/40">
            {headers.map((h) => (
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
          {leads.map((lead, i) => (
            <tr
              key={lead.id}
              onClick={() => onSelect?.(lead)}
              className={cn(
                "transition-colors duration-150 hover:bg-cream/50",
                onSelect && "cursor-pointer",
                animateRows && "animate-row-in",
                dense ? "text-[13px]" : "text-[13.5px]",
              )}
              style={animateRows ? { animationDelay: `${i * 110}ms` } : undefined}
            >
              <td className="px-4 py-3 font-medium text-foreground">
                {lead.firstName} {lead.lastName}
              </td>
              <td className="px-4 py-3 text-secondary-foreground">{lead.company}</td>
              <td className="px-4 py-3 text-muted-foreground">{lead.role}</td>
              {showVerification ? (
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[12.5px]",
                      lead.emailStatus === "Verified"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <ShieldCheck className="size-3.5" strokeWidth={2} />
                    {lead.emailStatus}
                  </span>
                </td>
              ) : (
                <td className="px-4 py-3 text-muted-foreground">{lead.location}</td>
              )}
              <td className="px-4 py-3">
                <MatchBadge value={lead.match} animate={animateScores} />
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

/** Real upload surface: website URL, PDF attachments and a processing state. */
export function UploadPanel() {
  return (
    <div className="divide-y divide-border">
      <div className="px-4 py-4">
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
          Website URL
        </p>
        <div className="mt-2 flex h-9 items-center gap-2 rounded-md border border-border bg-paper px-2.5">
          <Globe className="size-3.5 text-muted-foreground" />
          <span className="text-[13px] text-secondary-foreground">
            {exampleProfile.website}
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong bg-cream/50 px-4 py-6 text-center">
          <Upload className="size-4 text-muted-foreground" strokeWidth={1.8} />
          <p className="text-[13px] font-medium text-foreground">
            Drop a PDF, or browse
          </p>
          <p className="text-[12px] text-muted-foreground">
            Decks, catalogues and one-pagers all work.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {exampleDocuments.map((doc, i) => (
          <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
            <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-foreground">
                {doc.name}
              </span>
              <span className="block text-[11.5px] text-muted-foreground">
                {doc.size} · added {doc.added}
              </span>
            </span>
            {i === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-primary">
                <Check className="size-3.5" strokeWidth={2.6} /> Processed
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <span className="relative h-1 w-12 overflow-hidden rounded-full bg-muted">
                  <span className="absolute inset-y-0 left-0 w-5 animate-sweep rounded-full bg-primary/70" />
                </span>
                Reading
              </span>
            )}
          </li>
        ))}
      </ul>
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
