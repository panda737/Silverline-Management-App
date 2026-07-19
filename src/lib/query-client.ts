import { QueryClient } from "@tanstack/react-query";

/**
 * Module-level singleton so plain action functions (not hooks) can invalidate
 * queries — the SPA equivalent of Next's revalidatePath. staleTime keeps
 * back-navigation instant while ensuring data refetches shortly after focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
