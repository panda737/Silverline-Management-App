import { cn } from "@/lib/utils";

/**
 * The Silverline signature-S mark. The source artwork is a square PNG with a
 * dark background, so it is always rendered circular — matching the logo and
 * the (circularly clipped) favicon.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.png"
      alt=""
      aria-hidden
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}
