import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/leadgen/wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Find the people your business should be talking to.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { label: "Overview", href: "#product" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Lead quality", href: "#lead-quality" },
            { label: "Pricing", href: "#pricing" },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            { label: "FAQ", href: "#faq" },
            { label: "Data handling", href: "#security" },
            { label: "Business context", href: "#context" },
          ]}
        />
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Get started</h3>
          <Link
            to="/app"
            className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start finding leads&nbsp;→
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card required.
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} LeadGen AI</p>
          <p>Built for people who actually sell.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
