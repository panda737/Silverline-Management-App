import { cn } from "@/lib/utils";

/**
 * The Silverline signature-S mark — the same artwork as the favicon. The PNG
 * already carries its own rounded-square silhouette and transparent corners,
 * so it must NOT be clipped (rounded-full would slice the tile into a circle).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.png"
      alt=""
      aria-hidden
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
