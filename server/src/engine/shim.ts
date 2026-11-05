/**
 * The stores are created with persist(createJSONStorage(() => localStorage)). On the
 * server they must not persist anywhere (the database is the truth), so give them a
 * storage that remembers nothing. Imported before any store module.
 */
const none: Storage = {
  length: 0,
  clear() {},
  getItem: () => null,
  key: () => null,
  removeItem() {},
  setItem() {},
}
const g = globalThis as { localStorage?: Storage; sessionStorage?: Storage }
for (const k of ['localStorage', 'sessionStorage'] as const) {
  let has = false
  try {
    has = !!g[k]
  } catch {
    has = false
  }
  if (!has) Object.defineProperty(globalThis, k, { value: none, configurable: true })
}
export {}
