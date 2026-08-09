import { useInView } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const facts = ["No credit card", "Free to start", "Multi-provider AI", "CSV export"];

export function TrustStrip() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="bg-paper" ref={ref}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-4 sm:gap-x-12 sm:px-8">
        {facts.map((fact, i) => (
          <div key={fact} className="flex items-center gap-8 sm:gap-12">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "hidden h-3 w-px bg-border transition-opacity duration-500 sm:block",
                  inView ? "opacity-100" : "opacity-0",
                )}
                style={{ transitionDelay: `${i * 80}ms` }}
              />
            )}
            <span
              className={cn(
                "text-[13px] font-medium text-secondary-foreground transition-all duration-500",
                inView ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
              )}
              style={{ transitionDelay: `${120 + i * 80}ms` }}
            >
              {fact}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
