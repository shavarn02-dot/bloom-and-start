import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-[0.34em] text-[15px] font-semibold tracking-[-0.01em] text-foreground",
        className,
      )}
    >
      <span className="relative inline-flex size-5 items-center justify-center">
        <svg viewBox="0 0 20 20" className="size-5 text-primary" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M13.2 13.2 18 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="8.5" cy="8.5" r="2" fill="currentColor" />
        </svg>
      </span>
      LeadGen<span className="text-muted-foreground">AI</span>
    </span>
  );
}
