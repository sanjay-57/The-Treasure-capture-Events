/**
 * Build-time pre-rendering (roadmap 7.2). Run by `pnpm build:static` after the
 * client build (dist/) and the SSR build (node_modules/.cache/prerender/).
 * Writes dist/<route>/index.html for every public route, with the route's
 * title, description, canonical and Open Graph tags in the head, so crawlers
 * get real text. English only: the store defaults to English, Tamil stays a
 * client render. src/main.tsx hydrates when the prerendered path matches.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'node_modules/.cache/prerender')

// Server render: production React, and empty in-memory Web Storage so components
// that read sessionStorage/localStorage in a useState initializer render their
// first-visit state (zustand persist then simply starts from its defaults).
process.env.NODE_ENV ??= 'production'
class MemoryStorage {
  #m = new Map()
  get length() { return this.#m.size }
  key(i) { return [...this.#m.keys()][i] ?? null }
  getItem(k) { return this.#m.has(k) ? this.#m.get(k) : null }
  setItem(k, v) { this.#m.set(k, String(v)) }
  removeItem(k) { this.#m.delete(k) }
  clear() { this.#m.clear() }
}
for (const name of ['localStorage', 'sessionStorage']) {
  if (!(name in globalThis)) Object.defineProperty(globalThis, name, { value: new MemoryStorage(), configurable: true })
}

const { render, seo, storyPaths } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href)

// Same list the sitemap uses (src/lib/seo.ts indexablePaths); older seo.ts had only PUBLIC_ROUTES.
const routes = [...new Set(typeof seo.indexablePaths === 'function' ? seo.indexablePaths() : [...seo.PUBLIC_ROUTES, ...storyPaths])]

const template = readFileSync(path.join(dist, 'index.html'), 'utf8')
if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html is not the plain vite shell (already prerendered?). Run `vite build` first.')
const base = (process.env.FIGMA_PUBLIC_URL ?? '').replace(/\/$/, '')

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function setMeta(html, attr, key, content) {
  const tag = `<meta ${attr}="${key}" content="${esc(content)}" />`
  const re = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`)
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function page(route, { html, head }) {
  const langUrl = typeof seo.langUrl === 'function' ? seo.langUrl : p => seo.SITE_URL + p
  const url = langUrl(route, 'en')
  let out = template
  if (head.title) out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(head.title)}</title>`)
  if (head.description) {
    out = setMeta(out, 'name', 'description', head.description)
    out = setMeta(out, 'property', 'og:description', head.description)
  }
  if (head.title) out = setMeta(out, 'property', 'og:title', head.title)
  out = setMeta(out, 'property', 'og:url', url)
  out = setMeta(out, 'property', 'og:locale', 'en_IN')
  const links = [`<link rel="canonical" href="${esc(url)}" />`]
  // hreflang alternates, matching the sitemap: Tamil is the same path with ?lang=ta.
  if (typeof seo.langUrl === 'function') {
    for (const [hreflang, l] of [['en', 'en'], ['ta', 'ta'], ['x-default', 'en']]) {
      links.push(`<link rel="alternate" hreflang="${hreflang}" href="${esc(langUrl(route, l))}" />`)
    }
  }
  out = out.replace('</head>', `    ${links.join('\n    ')}\n  </head>`)
  // If the host falls back to this file for another path, drop the prerendered
  // markup before first paint; main.tsx then client-renders as before.
  const guard = `<script>(function(){var r=document.getElementById('root'),p=location.pathname.replace(/\\/+$/,'')||'/';if(r&&r.dataset.prerendered!==p)r.innerHTML=''})()</script>`
  const prerendered = (base + route).replace(/\/+$/, '') || '/'
  return out.replace('<div id="root"></div>', `<div id="root" data-prerendered="${esc(prerendered)}">${html}</div>${guard}`)
}

const fileFor = route => (route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html'))
const write = (route, html) => {
  mkdirSync(path.dirname(fileFor(route)), { recursive: true })
  writeFileSync(fileFor(route), html)
}

let ok = 0
const failed = []
const notFound = []
for (const route of routes) {
  try {
    const result = render(route)
    // A listed path with no matching <Route> renders NotFound; don't ship that as the page.
    if (result.head.title?.startsWith('Page not found')) {
      notFound.push(route)
      continue
    }
    write(route, page(route, result))
    ok++
  } catch (err) {
    // A component that touches the DOM during render: ship the plain shell for
    // this path (client render, as before) and keep going.
    failed.push(route)
    console.warn(`prerender ${route} failed, shipping the client-rendered shell: ${err?.message ?? err}`)
    if (route !== '/') write(route, template)
  }
}
rmSync(ssrDir, { recursive: true, force: true })
console.log(
  `prerendered ${ok}/${routes.length} routes` +
    (failed.length ? ` · client shell (render error): ${failed.join(', ')}` : '') +
    (notFound.length ? ` · skipped ${notFound.length} with no <Route> yet (NotFound): ${notFound.slice(0, 3).join(', ')}${notFound.length > 3 ? ', …' : ''}` : ''),
)
if (process.env.PRERENDER_STRICT && (failed.length || notFound.length)) process.exitCode = 1
