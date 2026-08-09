import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-md bg-muted",
        className,
      )}
    />
  );
}

export function CampaignListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBar className="h-4 w-[45%]" />
            <SkeletonBar className="h-3 w-[65%]" />
          </div>
          <SkeletonBar className="hidden h-6 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="hidden w-full sm:block">
      <div className="border-b border-border bg-cream/40 px-4 py-2.5">
        <div className="flex gap-4">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="h-3 w-16" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <SkeletonBar className="h-4 w-28" />
            <SkeletonBar className="h-4 w-32" />
            <SkeletonBar className="h-4 w-28" />
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MobileCardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="divide-y divide-border sm:hidden">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBar className="h-4 w-[60%]" />
              <SkeletonBar className="h-3 w-[80%]" />
              <SkeletonBar className="h-3 w-[45%]" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <SkeletonBar className="h-4 w-16" />
              <SkeletonBar className="h-5 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function UsageCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-paper p-4">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="mt-2 h-7 w-16" />
          <SkeletonBar className="mt-3 h-1 w-full" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="h-10 w-full" />
        </div>
      ))}
      <SkeletonBar className="h-10 w-32" />
    </div>
  );
}
