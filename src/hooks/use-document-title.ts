import { useEffect } from "react";

const DEFAULT_TITLE = "Silverline Management Portal";

/**
 * SPA replacement for Next's per-page `export const metadata = { title }` with
 * the root template "%s — Silverline". Every page calls this with the same
 * title string it exported before.
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Silverline` : DEFAULT_TITLE;
  }, [title]);
}
