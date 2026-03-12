import { PAGE_ROUTE_MAP } from "@/platform/routes";

/**
 * Resolve a logical page name to its canonical URL within Red River OS.
 *
 * Uses the centralised route map from src/platform/routes.js.
 * Falls back to the legacy /{PageName} pattern for any unmapped pages.
 *
 * @param pageName  The page key as registered in pages.config.js
 */
export function createPageUrl(pageName: string): string {
    const mapped = PAGE_ROUTE_MAP[pageName as keyof typeof PAGE_ROUTE_MAP];
    if (mapped) return mapped;
    // Legacy fallback for pages not yet in the route map
    return "/" + pageName.replace(/ /g, "-");
}
