import { createElement } from 'react'
import { type Invite } from '../../lib/invite'

/*
 * "Download as image": the invite itself, rendered off-screen at 390 × 844 in
 * its still form (no motion, the directions QR in place of the buttons) and
 * captured with html-to-image at 1080 wide, so the PNG is exactly what guests
 * see: every pattern, gradient, font and the caricature.
 */

const W = 390
const H = 844
const SCALE = 1080 / W

/** Renders the still invite and returns it as a PNG. `art` is the caricature (premium), local or hosted. */
export async function inviteImage(invite: Invite, lang: 'en' | 'ta', art?: string): Promise<Blob> {
  const [{ toBlob }, { createRoot }, { InviteView }] = await Promise.all([import('html-to-image'), import('react-dom/client'), import('./Invite')])
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-${W * 4}px;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:-1`
  document.body.appendChild(host)
  const root = createRoot(host)
  try {
    await new Promise<void>(resolve => {
      root.render(createElement(InviteView, { invite, lang, art, still: true, size: { w: W, h: H }, onReady: resolve }))
      window.setTimeout(resolve, 6000)
    })
    await document.fonts.ready
    await Promise.all([...host.querySelectorAll('img')].map(i => i.decode().catch(() => undefined)))
    const node = host.firstElementChild as HTMLElement
    const blob = await toBlob(node, { pixelRatio: SCALE, width: W, height: H, cacheBust: false })
    if (!blob) throw new Error('empty image')
    return blob
  } finally {
    root.unmount()
    host.remove()
  }
}

/** Renders and saves the PNG through a temporary `<a download>`. */
export async function downloadInviteImage(invite: Invite, lang: 'en' | 'ta', art?: string) {
  const blob = await inviteImage(invite, lang, art)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invite-${invite.en.join('-').toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'wedding'}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
