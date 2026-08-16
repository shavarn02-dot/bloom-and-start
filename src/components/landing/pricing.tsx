import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";

const plans = [
  {
    name: "Free",
    eyebrow: "No credit card required",
    price: "₹0",
    cadence: "forever",
    description: "Start finding source-backed leads with a small monthly allowance.",
    features: [
      "3 searches per month",
      "5 unique leads per search",
      "Up to 15 leads per month",
      "CSV export",
      "Lead filtering",
      "Lead detail view",
    ],
    cta: "Start finding leads",
    href: "/app" as const,
    className: "border-border bg-cream",
    ctaClassName: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    name: "Premium",
    eyebrow: "For serious prospecting",
    price: "₹500",
    cadence: "per month",
    description: "Get more searches and a larger set of unique leads for your pipeline.",
    features: [
      "10 searches per month",
      "50 unique leads per search",
      "Up to 500 leads per month",
      "No repeat leads across your searches",
      "CSV export and lead filtering",
      "Secure Razorpay checkout",
    ],
    cta: "Upgrade in dashboard",
    href: "/app/campaigns/new" as const,
    className: "border-primary/40 bg-primary/[0.04] shadow-[var(--shadow-lift)]",
    ctaClassName: "bg-foreground text-background hover:bg-foreground/90",
  },
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            Simple plans for source-backed lead generation.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
            Every search is quota-controlled, and each user receives unique leads so the same result
            is not delivered twice.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {plans.map((plan, planIndex) => (
            <Reveal
              key={plan.name}
              variant="scale"
              delay={planIndex * 100}
              className={`rounded-lg border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${plan.className}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[15px] font-semibold text-foreground">{plan.name}</h3>
                <span className="text-right text-[13px] text-muted-foreground">{plan.eyebrow}</span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <p className="text-[3rem] leading-none font-semibold">{plan.price}</p>
                <span className="text-sm text-muted-foreground">{plan.cadence}</span>
              </div>
              <p className="mt-4 min-h-12 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-7 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={feature}
                    className="flex animate-row-in items-center gap-2.5 text-[14px]"
                    style={{ animationDelay: `${featureIndex * 70}ms` }}
                  >
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3" strokeWidth={2.8} />
                    </span>
                    <span className="text-secondary-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.href}
                className={`lg-cta group mt-8 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-medium transition-all duration-200 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 ${plan.ctaClassName}`}
              >
                {plan.cta}
                <span className="lg-cta-arrow ml-2">→</span>
              </Link>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Premium upgrades are completed securely from the authenticated dashboard through Razorpay.
        </p>
      </div>
    </section>
  );
}
