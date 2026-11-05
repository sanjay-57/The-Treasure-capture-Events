/**
 * Over plain http://192.168.x.x (the studio Wi-Fi) browsers hide a few APIs that
 * need a secure origin. Fill the two the site relies on so the copy buttons and id
 * makers keep working on phones. Only http://localhost is secure without HTTPS.
 */
export function installPolyfills() {
  if (typeof window === 'undefined' || window.isSecureContext) return

  if (!navigator.clipboard) {
    const writeText = (text: string) =>
      new Promise<void>((resolve, reject) => {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
        document.body.appendChild(ta)
        ta.select()
        ta.setSelectionRange(0, text.length)
        const ok = document.execCommand('copy')
        ta.remove()
        ok ? resolve() : reject(new Error('copy failed'))
      })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText, readText: () => Promise.reject(new Error('unavailable')) } })
  }

  if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: () => {
        const b = crypto.getRandomValues(new Uint8Array(16))
        b[6] = (b[6] & 0x0f) | 0x40
        b[8] = (b[8] & 0x3f) | 0x80
        const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
      },
    })
  }
}
