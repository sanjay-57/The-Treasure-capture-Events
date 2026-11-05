import './shim'
import type { StoreApi } from 'zustand'
import { useStore } from '../../../src/lib/store'
import { useStudioStore } from '../../../src/saas/store'
import { useOsStore, bumpStage } from '../../../src/saas/os/store'
import type { StoreName } from '../../../src/api/collections'

/** The same stores the browser runs. The server drives them as its domain model. */
export const STORES: Record<StoreName, StoreApi<any>> = {
  ttc: useStore as unknown as StoreApi<any>,
  studio: useStudioStore as unknown as StoreApi<any>,
  os: useOsStore as unknown as StoreApi<any>,
}

export { bumpStage }

/** Store fields that are per-device and never come from the server. */
export const DEVICE_STATE: Record<StoreName, Record<string, unknown>> = {
  ttc: { session: null },
  studio: { session: null },
  os: {},
}
