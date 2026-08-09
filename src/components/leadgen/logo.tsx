import { cn } from "@/lib/utils";

/**
 * LeadFlowX Premium Unique Logo Component
 * Combines dynamic lead flow nodes, energy stream, and modern typography.
 */
export function LeadFlowXLogo({
  className,
  iconOnly = false,
  size = "md",
}: {
  className?: string | undefined;
  iconOnly?: boolean | undefined;
  size?: "sm" | "md" | "lg" | undefined;
}) {
  const sizeClasses = {
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none font-sans", className)}>
      {/* Unique LeadFlowX Icon Mark */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-950 p-1.5 shadow-md border border-emerald-400/30 transition-transform duration-300 hover:scale-105",
          sizeClasses[size]
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full text-white"
        >
          <defs>
            <linearGradient id="lfx-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="lfx-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#A7F3D0" />
            </linearGradient>
          </defs>

          {/* Connected Lead Nodes (Flow Stream) */}
          <circle cx="8" cy="8" r="3" fill="url(#lfx-grad-2)" />
          <circle cx="24" cy="24" r="3.5" fill="url(#lfx-grad-2)" />
          <circle cx="24" cy="8" r="2.5" fill="#A7F3D0" opacity="0.8" />
          
          {/* Dynamic Flow Paths (The "X" Flow) */}
          <path
            d="M9.5 9.5L22.5 22.5"
            stroke="url(#lfx-grad-1)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M22.5 9.5L16 16L13 13"
            stroke="url(#lfx-grad-2)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Target Pulse Point */}
          <circle cx="16" cy="16" r="2" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <span className={cn("font-bold tracking-tight text-foreground flex items-center", textClasses[size])}>
          Lead<span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">FlowX</span>
        </span>
      )}
    </div>
  );
}
