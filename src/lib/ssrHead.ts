/*
 * Head tags collected while a route is rendered on the server (scripts/prerender.mjs).
 * useTitle / useSeo set the document head in effects, which never run during
 * server render, so in SSR builds they also report here. On the client this is a no-op.
 */

export interface SsrHead {
  title?: string
  description?: string
  lang?: string
  /** Self-referencing canonical for the page's language (added by useSeo). */
  canonical?: string
  /** hreflang alternates: en, ta (?lang=ta) and x-default. */
  alternates?: { hreflang: string; href: string }[]
}

let current: SsrHead | null = null

export function beginSsrHead() {
  current = {}
}

export function collectSsrHead(patch: SsrHead) {
  if (current) Object.assign(current, patch)
}

export function endSsrHead(): SsrHead {
  const head = current ?? {}
  current = null
  return head
}
