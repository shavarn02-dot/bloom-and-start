import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/leadgen/site-header";
import { SiteFooter } from "@/components/leadgen/site-footer";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { ManualResearch } from "@/components/landing/manual-research";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductMovie } from "@/components/landing/product-movie";
import { ProductDemo } from "@/components/landing/product-demo";
import { Documents } from "@/components/landing/documents";
import { LeadQuality } from "@/components/landing/lead-quality";
import { ContextFlow } from "@/components/landing/context-flow";
import { BusinessContext } from "@/components/landing/business-context";
import { LaptopMoment } from "@/components/landing/laptop-moment";
import { Security } from "@/components/landing/security";
import { Pricing } from "@/components/landing/pricing";
import { TrustSection } from "@/components/landing/trust";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";

const title = "LeadGen AI (LeadFlowX) — AI-Powered B2B Lead Prospecting & Lead Generation";
const description =
  "LeadFlowX / LeadGen AI turns your business profile into high-intent B2B prospect lists. AI scraper qualifies, verifies, and ranks leads automatically. Start for free today.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: "LeadFlowX, LeadGen AI, B2B Lead Generation, AI Prospecting, Sales Intelligence, Cold Email Leads, Prospect Finder" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://leadflowx.pages.dev" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [
      { rel: "canonical", href: "https://leadflowx.pages.dev" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
        <Problem />
        <ManualResearch />
        <HowItWorks />
        <ProductMovie />
        <LaptopMoment />
        <LeadQuality />
        <BusinessContext />
        <Documents />
        <ContextFlow />
        <ProductDemo />
        <Security />
        <Pricing />
        <TrustSection />
        <Faq />
        <FinalCta />

      </main>
      <SiteFooter />
    </div>
  );
}

