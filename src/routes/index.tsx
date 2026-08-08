import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/leadgen/site-header";
import { SiteFooter } from "@/components/leadgen/site-footer";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductMovie } from "@/components/landing/product-movie";
import { ProductDemo } from "@/components/landing/product-demo";
import { Documents } from "@/components/landing/documents";
import { LeadQuality } from "@/components/landing/lead-quality";
import { BusinessContext } from "@/components/landing/business-context";
import { AiWorkflow } from "@/components/landing/ai-workflow";
import { Security } from "@/components/landing/security";
import { Pricing } from "@/components/landing/pricing";
import { TrustSection } from "@/components/landing/trust";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";

const title = "LeadGen AI — Find the people your business should be talking to";
const description =
  "Describe your business and your buyers, and LeadGen AI turns that context into a focused list of prospects. Free to start, no credit card required.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        <HowItWorks />
        <ProductMovie />
        <ProductDemo />
        <LeadQuality />
        <BusinessContext />
        <Documents />
        <AiWorkflow />


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
