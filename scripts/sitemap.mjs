/**
 * Writes public/sitemap.xml and public/robots.txt from indexablePaths() in
 * src/lib/seo.ts (routes, gallery stories, district landing pages), each in
 * English and Tamil (?lang=ta). Run with `pnpm seo:sitemap` after adding pages or stories.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { indexablePaths, sitemapXml, robotsTxt } = await import('../src/lib/seo.ts')

const paths = indexablePaths()
const today = new Date().toLocaleDateString('en-CA')
writeFileSync(path.join(root, 'public/sitemap.xml'), sitemapXml(paths, today))
writeFileSync(path.join(root, 'public/robots.txt'), robotsTxt())
console.log(`sitemap.xml: ${paths.length} pages × 2 languages = ${paths.length * 2} urls · robots.txt written`)
