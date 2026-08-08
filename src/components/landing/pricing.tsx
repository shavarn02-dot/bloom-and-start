import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SectionLabel } from "@/components/leadgen/marks";

const features = [
  "Up to 3 business profiles",
  "Up to 50 leads per campaign",
  "Up to 10 campaigns per month",
  "CSV export",
  "Lead filtering",
  "Lead detail view",
];

export function Pricing() {
  return (
    <section id="pricing" className="border-y border-border bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            Free, with limits we state up front.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
            One plan today. When paid plans exist, they'll be described just as plainly.
          </p>
        </div>

        <div className="mt-10 max-w-md rounded-lg border border-border bg-cream p-7">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[15px] font-semibold text-foreground">Free</h3>
            <span className="text-[13px] text-muted-foreground">
              No credit card required
            </span>
          </div>
          <p className="mt-4 text-[3rem] leading-none font-semibold">$0</p>

          <ul className="mt-7 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[14px]">
                <Check className="size-4 shrink-0 text-primary" strokeWidth={2.4} />
                <span className="text-secondary-foreground">{f}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/app"
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
          >
            Start finding leads&nbsp;→
          </Link>
        </div>
      </div>
    </section>
  );
}
