import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check, Building2, Plus, Sparkles } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { createCampaign, runCampaign, getJobStatus, ScrapeJob, API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { BusinessProfile } from "@/routes/app.profiles";

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

  // Profiles State
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

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

  // Fetch profiles on mount
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const resp = await fetch(`${API_BASE}/api/profiles`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            setProfiles(data);
            setSelectedProfileId(data[0].id);
            // Pre-fill default name & query if profile exists
            if (data[0].name) {
              setName(`${data[0].name} Lead Discovery`);
            }
            if (data[0].target_customer || data[0].description) {
              setQuery(`${data[0].name} ${data[0].target_customer || data[0].description} email contact`.trim());
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load business profiles:", err);
      } finally {
        setIsLoadingProfiles(false);
      }
    }
    fetchProfiles();
  }, []);

  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    const prof = profiles.find((p) => p.id === profileId);
    if (prof) {
      setName(`${prof.name} Prospect Search`);
      setQuery(`${prof.name} ${prof.target_customer || prof.description || ''} email contact`.trim());
    }
  };

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
      const campaign = await createCampaign(name, query, limit, selectedProfileId || undefined);
      setCampaignId(campaign.id);

      const result = await runCampaign(campaign.id);
      setJobId(result.job_id);

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
        description="Select business profile, customize search query, and launch live web scraping."
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
        <Panel title="Step 1: Select Profile & Campaign Name">
          <div className="space-y-5 p-5">
            {/* Business Profile Selector */}
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">
                Business Profile Context
              </label>
              {isLoadingProfiles ? (
                <FormSkeleton rows={3} />
              ) : profiles.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="w-full rounded-md border border-border bg-paper px-3 py-2 text-[13.5px] outline-none focus:border-primary"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.target_customer ? `(${p.target_customer})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[12px] text-muted-foreground">
                    Selected profile provides business context & ICP scoring parameters to the scraping engine.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 bg-cream/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Building2 className="size-4 text-primary" />
                    <span>No business profiles found yet.</span>
                  </div>
                  <Link
                    to="/app/profiles"
                    className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
                  >
                    <Plus className="size-3.5" /> Create Profile
                  </Link>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-foreground">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mumbai Marketing Agencies"
                className="mt-1.5 w-full rounded-md border border-border bg-paper px-3 py-2 text-[13.5px] outline-none focus-ring-animate transition-colors duration-200 hover:border-border-strong"
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
                className="mt-1.5 w-32 rounded-md border border-border bg-paper px-3 py-2 text-[13.5px] outline-none focus-ring-animate transition-colors duration-200 hover:border-border-strong"
              />
            </div>
          </div>
        </Panel>
      )}

      {step === 1 && (
        <Panel title="Step 2: Target Search Query & ICP">
          <div className="space-y-4 p-5">
            <div>
              <label className="block text-[13px] font-medium text-foreground">Web Search Query</label>
              <p className="text-[12px] text-muted-foreground mb-2">
                The AI scraping engine uses this search query on public web search engines to discover prospective companies.
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. B2B SaaS companies Bangalore email contact"
                className="w-full rounded-md border border-border bg-paper px-3 py-2.5 text-[13.5px] outline-none focus-ring-animate transition-colors duration-200 hover:border-border-strong font-mono"
              />
            </div>
          </div>
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Step 3: Confirm & Launch">
          <dl className="divide-y divide-border">
            {[
              ["Business Profile", profiles.find((p) => p.id === selectedProfileId)?.name || "Default Profile"],
              ["Campaign Name", name],
              ["Search Query", query],
              ["Target Cap", `${limit} leads`],
              ["Lead Discovery", "Live AI Web Search"],
              ["Contact Verification", "Real-Time Email Check"],
              ["Matching Engine", "ICP Quality Scoring"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-2 px-5 py-3.5">
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
                  <span className="inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </div>
              )}
              <div>
                <h4 className="text-[15px] font-semibold text-foreground">
                  {jobStatus?.status === "completed"
                    ? "Scraping Completed Successfully!"
                    : jobStatus?.status === "failed"
                    ? "Scraping Execution Failed"
                    : "AI Web Search Engine Running..."}
                </h4>
                <p className="text-[13px] text-muted-foreground">
                  {jobStatus?.status === "completed"
                    ? `Extracted & verified ${jobStatus.total_leads_extracted || 0} leads.`
                    : "Crawling company websites, extracting contact emails, and scoring ICP matches."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[12.5px] font-medium text-foreground">
                <span>Progress</span>
                <span>{jobStatus?.progress || (step === 3 ? 15 : 0)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${jobStatus?.progress || (step === 3 ? 15 : 0)}%` }}
                />
              </div>
            </div>

            {jobStatus?.status === "completed" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/app/leads", search: { campaign: campaignId || "" } })}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[13.5px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  View Extracted Leads →
                </button>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Navigation Buttons */}
      {step < 3 && (
        <div className="flex justify-between pt-4">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-md border border-border px-4 py-2 text-[13.5px] font-medium text-foreground transition-all duration-200 hover:bg-cream hover:-translate-y-0.5 disabled:opacity-40"
          >
            Back
          </button>

          {step < 2 ? (
            <button
              type="button"
              disabled={step === 0 && !name.trim()}
              onClick={() => setStep((s) => Math.min(2, s + 1))}
              className="rounded-md bg-primary px-4 py-2 text-[13.5px] font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleLaunch}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-[13.5px] font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSubmitting && (
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Start Finding Leads →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
