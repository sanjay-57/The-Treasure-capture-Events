import fs from 'node:fs'
import path from 'node:path'
import { buildApp } from './app'
import { loadConfig } from './config'
import { startJobs } from './jobs/backup'
import { banner } from './lan'
import type { SeedMode } from './seed'

const cfg = loadConfig()
const { app, ctx, firstAdmin } = await buildApp(cfg, { logger: true, seed: (process.env.SEED as SeedMode) || 'demo' })

if (cfg.serveSite && !fs.existsSync(path.join(cfg.distDir, 'index.html'))) {
  app.log.warn('dist/ is missing: run `npm run lan:start` from the repo root (it builds the site first).')
}

await app.listen({ port: cfg.port, host: cfg.host })
const stopJobs = startJobs(ctx, m => app.log.info(m))
console.log(await banner(cfg.port, firstAdmin))
if (!cfg.serveSite) console.log(`  API only (dev). Open the site through Vite: npm run dev:lan  → http://localhost:8443\n`)

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.once(sig, async () => {
    stopJobs()
    await app.close()
    process.exit(0)
  })
}
