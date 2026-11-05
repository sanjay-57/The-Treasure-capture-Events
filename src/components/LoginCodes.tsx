import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { CODE_EVENT } from '../api/live'
import { isLan } from '../api/mode'

interface Code {
  id: number
  phone: string
  purpose: 'customer' | 'studio'
  name: string
  code: string
  expiresAt: string
}

const fmt = (p: string) => `${p.slice(0, 5)} ${p.slice(5)}`

/**
 * LAN mode has no SMS: when a customer or photographer asks for a login code, it
 * appears here on every admin screen for staff to read out. Gone once used or expired.
 */
export function LoginCodes() {
  const [codes, setCodes] = useState<Code[]>([])
  const [, tick] = useState(0)

  useEffect(() => {
    if (!isLan()) return
    let live = true
    const load = () => api<Code[]>('/api/admin/codes').then(c => live && setCodes(c), () => {})
    load()
    const onCode = () => load()
    window.addEventListener(CODE_EVENT, onCode)
    const t = window.setInterval(() => {
      tick(n => n + 1)
      setCodes(cs => cs.filter(c => c.expiresAt > new Date().toISOString()))
    }, 15_000)
    return () => {
      live = false
      window.removeEventListener(CODE_EVENT, onCode)
      clearInterval(t)
    }
  }, [])

  if (!isLan() || !codes.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[300px] space-y-2" role="status" aria-live="polite">
      {codes.slice(0, 4).map(c => (
        <div key={c.id} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_18px_50px_-24px_rgba(10,10,11,0.45)]">
          <div className="flex items-center justify-between text-[11.5px] uppercase tracking-wide text-ink/45">
            <span>{c.purpose === 'customer' ? 'Customer login' : 'Photographer login'}</span>
            <span>{Math.max(0, Math.ceil((Date.parse(c.expiresAt) - Date.now()) / 60_000))} min</span>
          </div>
          <div className="mt-1 truncate text-[14px] font-medium text-ink">{c.name}</div>
          <div className="text-[12.5px] text-ink/55">+91 {fmt(c.phone)}</div>
          <div className="mt-2 font-mono text-[30px] font-semibold tracking-[0.3em] text-ruby">{c.code}</div>
        </div>
      ))}
    </div>
  )
}
