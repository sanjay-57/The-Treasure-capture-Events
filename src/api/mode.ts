/**
 * mock (default): stores live in this browser only, as in the Figma Make preview.
 * lan: stores load from and write to the server on the studio laptop (server/, docs/backend-plan.md).
 */
export const BACKEND: 'mock' | 'lan' = import.meta.env?.VITE_BACKEND === 'lan' ? 'lan' : 'mock'
export const isLan = () => BACKEND === 'lan'
