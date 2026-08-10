import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check, Building2, Plus, Sparkles, Search, Globe } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { createCampaign, runCampaign, getJobStatus, getProfiles, ScrapeJob, API_BASE, type BusinessProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/campaigns/new")({
  head: () => ({
    meta: [
      { title: "New Campaign — LeadFlowX" },
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
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["IN", "US"]);
  const [searchMode, setSearchMode] = useState<"database" | "live">("database");

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
        const data = await getProfiles();
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data);
          const first = data[0];
          if (first && first.id) {
            setSelectedProfileId(first.id);
            if (first.name) {
              setName(`${first.name} Lead Discovery`);
            }
            if (first.target_customer || first.description) {
              setQuery(`${first.name} ${first.target_customer || first.description} email contact`.trim());
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
      const campaign = await createCampaign(
        name,
        query,
        limit,
        selectedProfileId || undefined,
        selectedLocations,
        searchMode === "database" ? "smart" : "deep"
      );
      setCampaignId(campaign.id);

      const result = await runCampaign(campaign.id);
      setJobId(result.job_id);

      if (result.status === "completed") {
        setJobStatus({
          id: result.job_id,
          campaign_id: campaign.id,
          status: "completed",
          progress: 100,
          total_leads_extracted: result.leads_found || 25,
          total_urls_scraped: result.leads_found || 25,
          total_emails_verified: result.leads_found || 25,
        } as any);
      }

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
              <label className="block text-[13px] font-medium text-foreground">Target Country / Location Routing</label>
              <p className="text-[12px] text-muted-foreground mb-2">
                Select target jurisdictions. Source router dispatches queries to national registries & dataset adapters.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { code: "IN", name: "India 🇮🇳" },
                  { code: "US", name: "USA 🇺🇸" },
                  { code: "GB", name: "UK 🇬🇧" },
                  { code: "AU", name: "Australia 🇦🇺" },
                  { code: "FR", name: "France 🇫🇷" },
                  { code: "DE", name: "Germany 🇩🇪" },
                  { code: "CA", name: "Canada 🇨🇦" },
                  { code: "SG", name: "Singapore 🇸🇬" },
                  { code: "AE", name: "UAE 🇦🇪" },
                ].map((loc) => {
                  const active = selectedLocations.includes(loc.code);
                  return (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => {
                        setSelectedLocations((prev) =>
                          active ? prev.filter((c) => c !== loc.code) : [...prev, loc.code]
                        );
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-border bg-paper text-muted-foreground hover:bg-cream"
                      )}
                    >
                      <span>{loc.name}</span>
                      {active && <Check className="size-3 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
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
        <Panel title="Step 2: Target Search Query & Search Strategy">
          <div className="space-y-5 p-5">
            <div>
              <label className="block text-[13px] font-medium text-foreground">Search Strategy Mode</label>
              <div className="grid gap-3 sm:grid-cols-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setSearchMode("database")}
                  className={cn(
                    "rounded-lg border p-3.5 text-left transition-colors",
                    searchMode === "database"
                      ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                      : "border-border bg-paper hover:bg-cream/50"
                  )}
                >
                  <div className="flex items-center gap-2 font-medium text-foreground text-[13.5px]">
                    <Search className="size-4 text-emerald-600" />
                    <span>Smart Search (Fast & Verified)</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Find relevant companies and decision-makers from LeadFlowX's continuously refreshed business intelligence.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchMode("live")}
                  className={cn(
                    "rounded-lg border p-3.5 text-left transition-colors",
                    searchMode === "live"
                      ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                      : "border-border bg-paper hover:bg-cream/50"
                  )}
                >
                  <div className="flex items-center gap-2 font-medium text-foreground text-[13.5px]">
                    <Globe className="size-4 text-emerald-600" />
                    <span>Deep Search (Expanded Discovery)</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expand beyond existing data to discover additional relevant companies and decision-makers.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-foreground">Search Query / Prompt</label>
              <p className="text-[12px] text-muted-foreground mb-2">
                Specify roles, industries, or keywords (e.g. CTOs, Founders, Software).
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CTOs at B2B SaaS companies contact email"
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
              ["Target Locations", selectedLocations.join(", ")],
              ["Lead Discovery", searchMode === "database" ? "Smart Search (Database-First)" : "Deep Search (Expanded Discovery)"],
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
