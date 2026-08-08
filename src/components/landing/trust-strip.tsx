const facts = ["No credit card", "Free to start", "Multi-provider AI", "CSV export"];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-4 sm:gap-x-12 sm:px-8">
        {facts.map((fact, i) => (
          <div key={fact} className="flex items-center gap-8 sm:gap-12">
            {i > 0 && (
              <span aria-hidden="true" className="hidden h-3 w-px bg-border sm:block" />
            )}
            <span className="text-[13px] font-medium text-secondary-foreground">
              {fact}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
