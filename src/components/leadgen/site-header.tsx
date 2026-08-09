import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/leadgen/wordmark";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#faq" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const doc = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 12);
      setProgress(doc > 0 ? Math.min(1, y / doc) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-200 ease-out",
        scrolled
          ? "border-b border-border bg-paper/85 shadow-[0_1px_2px_oklch(0.24_0.012_60/0.04)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between px-5 transition-all duration-200 sm:px-8",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <Link to="/" aria-label="LeadFlowX home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/login"
            className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="group inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
          >
            Start finding leads
            <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-paper text-foreground transition-colors hover:bg-cream md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Scroll progress line */}
      <div
        className="scroll-progress absolute bottom-0 left-0 h-[2px] bg-primary"
        style={{ "--scroll-progress": progress } as React.CSSProperties}
        aria-hidden="true"
      />

      {open && (
        <div className="border-t border-border bg-paper px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground">
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground"
            >
              Start finding leads&nbsp;→
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
