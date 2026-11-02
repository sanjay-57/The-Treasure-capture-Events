import { useState, type ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { toast } from '../../lib/ui'
import { shareText, whatsappShareUrl, type Invite } from '../../lib/invite'
import { downloadInviteImage } from './inviteImage'

/*
 * Share sheet for an invite link (roadmap 6.2): WhatsApp, the phone's own share
 * menu when there is one, copy link, and the first screen as a PNG. Used on the
 * invite itself (in the theme's own colours via `palette`) and under the builder (light).
 */

const copy = {
  whatsapp: { en: 'Send on WhatsApp', ta: 'WhatsApp-ல் அனுப்புங்கள்' },
  share: { en: 'Share', ta: 'பகிருங்கள்' },
  copy: { en: 'Copy invite link', ta: 'இணைப்பை நகலெடுங்கள்' },
  copied: { en: 'Link copied', ta: 'இணைப்பு நகலெடுக்கப்பட்டது' },
  image: { en: 'Download as image', ta: 'படமாகச் சேமியுங்கள்' },
  making: { en: 'Making the image…', ta: 'படம் தயாராகிறது…' },
  failed: { en: 'Couldn’t make the image on this device', ta: 'இந்தக் கருவியில் படம் உருவாக்க முடியவில்லை' },
}

export function ShareSheet({ invite, url, lang, art, tone = 'dark', palette, extra, disabled }: {
  invite: Invite
  url: string
  lang: 'en' | 'ta'
  /** Caricature to draw into the PNG; may be a local data URL, it never enters the link. */
  art?: string
  tone?: 'dark' | 'light'
  /** The invite theme's colours; overrides `tone` on the invite page. */
  palette?: { accent: string; onAccent: string; ink: string; line: string }
  /** Extra buttons after the standard ones, e.g. "Open". */
  extra?: ReactNode
  disabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const t = Object.fromEntries(Object.entries(copy).map(([k, v]) => [k, v[lang]])) as Record<keyof typeof copy, string>
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast(t.copied)
    } catch {
      // WhatsApp and other in-app browsers often have no async clipboard; fall back to a hidden field.
      const ta = document.createElement('textarea')
      ta.value = url
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px'
      document.body.appendChild(ta)
      ta.select()
      ta.setSelectionRange(0, url.length)
      try { if (document.execCommand('copy')) toast(t.copied) } catch { /* clipboard blocked */ }
      ta.remove()
    }
  }
  const native = async () => {
    try { await navigator.share({ title: `${invite.en[0]} & ${invite.en[1]}`, text: shareText(invite, lang), url }) } catch { /* dismissed */ }
  }
  const image = async () => {
    if (busy) return
    setBusy(true)
    try { await downloadInviteImage(invite, lang, art) } catch { toast(t.failed, 'ruby') } finally { setBusy(false) }
  }

  const dark = tone === 'dark'
  const btn = `flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-medium transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${palette ? 'border hover:opacity-80' : dark ? 'border border-white/15 text-white/80 hover:border-white/35' : 'border border-ink/12 bg-white text-ink/80 hover:border-ink/30'}`
  const primary = `flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold transition cursor-pointer ${palette ? '' : dark ? 'bg-[#d9b26a] text-[#0b0d14]' : 'bg-ruby text-white shadow-ruby'} ${disabled ? 'pointer-events-none opacity-40' : ''}`
  const btnStyle = palette && { borderColor: palette.line, color: palette.ink }
  const primaryStyle = palette && { background: palette.accent, color: palette.onAccent }

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      <a href={whatsappShareUrl(invite, lang, url)} target="_blank" rel="noreferrer" aria-disabled={disabled} tabIndex={disabled ? -1 : undefined} className={primary} style={primaryStyle}>
        <Icon name="whatsapp" size={15} /> {t.whatsapp}
      </a>
      {canShare && (
        <button type="button" onClick={native} disabled={disabled} className={btn} style={btnStyle}>
          <Icon name="share" size={15} /> {t.share}
        </button>
      )}
      <button type="button" onClick={copyLink} disabled={disabled} className={btn} style={btnStyle}>
        <Icon name="copy" size={15} /> {t.copy}
      </button>
      <button type="button" onClick={image} disabled={disabled || busy} aria-busy={busy} className={btn} style={btnStyle}>
        <Icon name="image" size={15} /> {busy ? t.making : t.image}
      </button>
      {extra}
    </div>
  )
}
