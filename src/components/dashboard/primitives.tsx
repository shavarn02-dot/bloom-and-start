import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Annotation } from "@/components/leadgen/marks";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="text-[1.6rem] leading-tight font-semibold">{title}</h1>
        {description && (
          <p className="mt-1.5 text-[14px] text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PrimaryAction({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13.5px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Panel({
  children,
  className,
  title,
  aside,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  aside?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-paper",
        className,
      )}
    >
      {(title || aside) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          {title && (
            <h2 className="text-[13.5px] font-semibold text-foreground">{title}</h2>
          )}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

/** Empty states carry copy and a hand note — never fabricated content. */
export function EmptyState({
  title,
  copy,
  note,
  action,
  sketch = "list",
}: {
  title: string;
  copy: string;
  note?: string;
  action?: ReactNode;
  sketch?: "list" | "doc" | "profile";
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <EmptySketch kind={sketch} />
      <h3 className="mt-6 text-[15.5px] font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        {copy}
      </p>
      {action && <div className="mt-6">{action}</div>}
      {note && <Annotation className="mt-4 block">{note}</Annotation>}
    </div>
  );
}

function EmptySketch({ kind }: { kind: "list" | "doc" | "profile" }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className="h-16 w-24 text-border-strong"
      fill="none"
      aria-hidden="true"
    >
      {kind === "list" && (
        <>
          <rect x="14" y="14" width="92" height="52" rx="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M26 30h40M26 42h60M26 54h34"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.6"
          />
        </>
      )}
      {kind === "doc" && (
        <>
          <path
            d="M34 8h34l18 18v46H34z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M68 8v18h18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path
            d="M44 40h30M44 52h20"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.6"
          />
        </>
      )}
      {kind === "profile" && (
        <>
          <circle cx="60" cy="30" r="13" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M32 68c4-14 15-21 28-21s24 7 28 21"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
