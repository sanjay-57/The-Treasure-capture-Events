import type { Docs } from './docs'
import type { Engine } from './engine/engine'
import { STORES } from './engine/stores'

export type SeedMode = 'demo' | 'empty'

/**
 * Fills the database from the stores' own reset actions, so the server starts with
 * exactly the demo the frontend shows in mock mode. `empty` keeps only the CMS
 * defaults and the photographer plans.
 */
export function seed(engine: Engine, docs: Docs, mode: SeedMode) {
  docs.wipe()
  const { changes } = engine.dryRun(engine.slice(), () => {
    STORES.ttc.getState().resetDemo()
    STORES.studio.getState().resetStudioDemo()
    STORES.os.getState().resetOsDemo()
  })
  engine.commit(mode === 'demo' ? changes : changes.filter(c => c.coll === 'cms' || c.coll === 'plans'))
  return changes.length
}
