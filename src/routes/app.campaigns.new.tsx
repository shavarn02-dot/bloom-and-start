import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { createCampaign, runCampaign, getJobStatus, ScrapeJob } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/campaigns/new")({
  head: () => ({
    meta: [
      { title: "New campaign — LeadGen AI" },
      {
        name: "description",
        content: "Create a live scraping campaign to find real business leads.",
      },
    ],
  }),
  component: NewCampaign,
});

const steps = [
  "Campaign Details",
  "Target Search Query",
  "Confirm & Launch",
  "Scraping & Lead Generation",
];

function NewCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Form State
  const [name, setName] = useState("Marketing Agencies in Mumbai");
  const [query, setQuery] = useState("Digital Marketing Agencies in Mumbai email contact");
  const [limit, setLimit] = useState(25);

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ScrapeJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll job status when running
  useEffect(() => {
    if (!jobId || step !== 3) return;

    const interval = setInterval(async () => {
      try {
        const job = await getJobStatus(jobId);
        setJobStatus(job);
        if (job.status === "completed" || job.status === "failed") {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Job poll error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, step]);

  const handleLaunch = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Step 1: Create campaign in Supabase via Worker
      const campaign = await createCampaign(name, query, limit);
      setCampaignId(campaign.id);

      // Step 2: Trigger Modal scraping job via Worker
      const result = await runCampaign(campaign.id);
      setJobId(result.job_id);

      // Step 3: Move to running step
      setStep(3);
    } catch (err: any) {
      console.error("Launch error:", err);
      setError(err.message || "Failed to launch campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Campaign"
        description="Fill details, set search query, and trigger real AI web scraping."
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
            <span className={i === step ? "text-foreground font-medium" : "text-muted-foreground"}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-800">
          {error}
        </div>
      )}

      {step === 0 && (
        <Panel title="Step 1: Campaign Details">
          <div className="space-y-4 p-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mumbai Marketing Agencies"
                className="mt-1.5 w-full rounded-md border border-border bg-paper px-3 py-2 text-[13.5px] outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground">Leads Cap (Free Tier Max 50)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="mt-1.5 w-32 rounded-md border border-border bg-paper px-3 py-2 text-[13.5px] outline-none focus:border-primary"
              />
            </div>
          </div>
        </Panel>
      )}

      {step === 1 && (
        <Panel title="Step 2: Target Search Query & ICP">
          <div className="space-y-4 p-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground">Web Search Query</label>
              <p className="text-[12px] text-muted-foreground mb-1.5">
                The scraping engine will use this query to discover company websites.
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. B2B SaaS companies Bangalore email contact"
                className="w-full rounded-md border border-border bg-paper px-3 py-2 text-[13.5px] outline-none focus:border-primary font-mono"
              />
            </div>
          </div>
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Step 3: Confirm & Launch">
          <dl className="divide-y divide-border">
            {[
              ["Campaign Name", name],
              ["Search Query", query],
              ["Target Cap", `${limit} leads`],
              ["Lead Discovery", "Live AI Web Search"],
              ["Contact Verification", "Real-Time Email Check"],
              ["Matching Engine", "ICP Quality Scoring"],
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
        <Panel title="Live Scraping Progress">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              {jobStatus?.status === "completed" ? (
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="size-5" />
                </div>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              )}
              <div>
                <p className="text-[15px] font-semibold text-foreground">
                  {jobStatus?.status === "completed"
                    ? "Scraping Completed!"
                    : jobStatus?.status === "failed"
                    ? "Job Failed"
                    : `Status: ${jobStatus?.status || "Starting..."}`}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {jobStatus?.status === "completed"
                    ? `Found ${jobStatus.total_leads_extracted || 0} leads across ${jobStatus.total_urls_scraped || 0} websites.`
                    : "Searching the web, discovering companies, verifying emails & scoring prospects."}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[12.5px] font-medium">
                <span>Progress</span>
                <span>{jobStatus?.progress || 5}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${jobStatus?.progress || 5}%` }}
                />
              </div>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">URLs Found</p>
                <p className="text-xl font-bold text-foreground mt-1">{jobStatus?.total_urls_found || 0}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">URLs Scraped</p>
                <p className="text-xl font-bold text-foreground mt-1">{jobStatus?.total_urls_scraped || 0}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Leads Found</p>
                <p className="text-xl font-bold text-primary mt-1">{jobStatus?.total_leads_extracted || 0}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Emails Verified</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{jobStatus?.total_emails_verified || 0}</p>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3">
        {step < 3 && (
          <button
            type="button"
            disabled={step === 0 || isSubmitting}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex h-9 items-center rounded-md border border-border bg-paper px-3.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-cream disabled:opacity-40"
          >
            Back
          </button>
        )}

        {step < 2 && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue →
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleLaunch}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Launching Campaign Engine...
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Start Finding Leads →
              </>
            )}
          </button>
        )}

        {step === 3 && (
          <button
            type="button"
            onClick={() => navigate({ to: "/app/leads", search: campaignId ? { campaign: campaignId } : undefined })}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Real Extracted Leads →
          </button>
        )}
      </div>
    </div>
  );
}
