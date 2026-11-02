/*
 * Server entry for build-time pre-rendering (roadmap 7.2). Built with
 * `vite build --ssr src/entry-server.tsx` and driven by scripts/prerender.mjs,
 * which writes dist/<route>/index.html for every public route.
 * Always renders the English version; Tamil is client-rendered.
 */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'
import { beginSsrHead, endSsrHead, type SsrHead } from './lib/ssrHead'
import * as seo from './lib/seo'
import { STORIES } from './lib/gallery'

export { seo }

/** Gallery story pages, prerendered alongside the public routes (same list as scripts/sitemap.mjs). */
export const storyPaths = STORIES.map(s => `/gallery/${s.slug}`)

export function render(url: string): { html: string; head: SsrHead } {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined
  beginSsrHead()
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={(basename ?? '') + url} basename={basename}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  return { html, head: endSsrHead() }
}
