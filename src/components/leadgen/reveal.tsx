import type { ElementType, ReactNode } from "react";
import { useInView } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "wipe" | "scale" | "polygon" | "fade";

/**
 * Editorial reveal wrapper. Motion is expressed purely in CSS
 * (see styles.css) so prefers-reduced-motion disables it globally.
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  /** milliseconds */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      data-visible={inView ? "true" : "false"}
      className={cn("lg-reveal min-w-0", `lg-reveal-${variant}`, className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
