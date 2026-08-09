import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { Annotation } from "@/components/leadgen/marks";
import { PageHeader, Panel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LeadGen AI" },
      {
        name: "description",
        content: "Account details, plan limits and campaign preferences.",
      },
      { property: "og:title", content: "Settings — LeadGen AI" },
      {
        property: "og:description",
        content: "Account details and current plan limits.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [name, setName] = useState("Sarthak Shavarn");
  const [email, setEmail] = useState("sarthak@example.com");
  const [company, setCompany] = useState("LeadGen AI");
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("leadgen_user_name");
    const savedEmail = localStorage.getItem("leadgen_user_email");
    const savedCompany = localStorage.getItem("leadgen_user_company");

    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
    if (savedCompany) setCompany(savedCompany);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    localStorage.setItem("leadgen_user_name", name);
    localStorage.setItem("leadgen_user_email", email);
    localStorage.setItem("leadgen_user_company", company);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }, 400);
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Your account and current plan." />

      <Panel title="Account Settings">
        <form className="divide-y divide-border" onSubmit={handleSubmit}>
          <div className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-center">
            <label htmlFor="name" className="text-[13px] font-medium text-secondary-foreground">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-9 w-full rounded-md border border-input bg-paper px-3 text-[13.5px] text-foreground outline-none focus:border-ring"
            />
          </div>

          <div className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-center">
            <label htmlFor="email" className="text-[13px] font-medium text-secondary-foreground">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-9 w-full rounded-md border border-input bg-paper px-3 text-[13.5px] text-foreground outline-none focus:border-ring"
            />
          </div>

          <div className="grid gap-2 px-4 py-3.5 sm:grid-cols-[220px_1fr] sm:items-center">
            <label htmlFor="company" className="text-[13px] font-medium text-secondary-foreground">
              Company Name
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              className="h-9 w-full rounded-md border border-input bg-paper px-3 text-[13.5px] text-foreground outline-none focus:border-ring"
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSaved ? (
                <>
                  <Check className="size-4" /> Saved!
                </>
              ) : (
                "Save changes"
              )}
            </button>
            {isSaved && (
              <span className="text-[13px] text-emerald-600 font-medium">Account settings updated successfully.</span>
            )}
          </div>
        </form>
      </Panel>

      <Panel title="Plan Details">
        <div className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-foreground">Free Tier Plan</p>
            <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
              Active
            </span>
          </div>
          <ul className="space-y-1.5 text-[13.5px] text-muted-foreground">
            <li>✓ Up to 3 business profiles</li>
            <li>✓ Up to 50 leads per campaign</li>
            <li>✓ Up to 10 campaigns per month</li>
            <li>✓ CSV export, lead filtering, real-time email verification</li>
          </ul>
          <Annotation className="block">No credit card required.</Annotation>
        </div>
      </Panel>
    </div>
  );
}
