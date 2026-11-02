import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Button, Card, Field, Segmented } from './ui'
import { PinMap } from './PinMap'
import { InviteView, ThemeThumb } from '../pages/invite/Invite'
import { ShareSheet } from '../pages/invite/ShareSheet'
import { ensureFonts, themeFonts, themeStyle } from '../pages/invite/themes'
import { coupleUrl } from '../pages/invite/caricature'
import { geminiCaricature, hasGemini } from '../lib/gemini'
import { formatINR, useLang, useT, type Lang } from '../lib/i18n'
import { toast } from '../lib/ui'
import { usePrices } from '../lib/store'
import {
  BLANK_DRAFT, FREE_THEMES, PREMIUM_INVITE_ITEM, PREMIUM_THEMES, THEME_META, draftMissing, draftToInvite, invitePath, isPremium, parseLatLng, themeOpen, toTheme,
  type InviteDraft, type InviteTheme,
} from '../lib/invite'

/*
 * E-invite builder (roadmap 6.4), shared by the client dashboard and the admin
 * showroom. Numbered steps: design, couple, day and venue (with a tap-to-pin
 * map), caricature (premium), share. The form fills an `InviteDraft`; the live
 * preview renders the real invite in a scaled phone frame, and the link and the
 * PNG use the same theme. The output is the `/i/<theme>#<payload>` link.
 * Premium themes preview freely but only make a link once the add-on is in the
 * order or cart. Premium shows our illustrated couple until the couple adds
 * theirs: made from a photo with Gemini, or uploaded. That one stays on this
 * device (localStorage): it shows in the preview and the PNG, never in the link.
 */

const copy = {
  design: { en: 'Design', ta: 'வடிவம்' },
  free: { en: 'Free designs', ta: 'இலவச வடிவங்கள்' },
  freeTag: { en: 'Free', ta: 'இலவசம்' },
  premium: { en: 'Premium · animated, with caricature', ta: 'பிரீமியம் · அசைவுடன், கேரிகேச்சருடன்' },
  locked: { en: 'Locked', ta: 'பூட்டப்பட்டது' },
  couple: { en: 'The couple', ta: 'மணமக்கள்' },
  brideEn: { en: 'Bride (English)', ta: 'மணமகள் (ஆங்கிலம்)' },
  groomEn: { en: 'Groom (English)', ta: 'மணமகன் (ஆங்கிலம்)' },
  brideTa: { en: 'Bride (Tamil)', ta: 'மணமகள் (தமிழ்)' },
  groomTa: { en: 'Groom (Tamil)', ta: 'மணமகன் (தமிழ்)' },
  taHint: { en: 'Leave blank to use the English name', ta: 'காலியாக விட்டால் ஆங்கிலப் பெயரே வரும்' },
  parentsEn: { en: 'Parents’ blessing line (English, optional)', ta: 'பெற்றோர் ஆசி வரி (ஆங்கிலம், விருப்பம்)' },
  parentsTa: { en: 'Parents’ blessing line (Tamil, optional)', ta: 'பெற்றோர் ஆசி வரி (தமிழ், விருப்பம்)' },
  parentsPh: { en: 'With the blessings of the … families', ta: '… குடும்பத்தினரின் ஆசியுடன்' },
  day: { en: 'Day and place', ta: 'நாள், இடம்' },
  date: { en: 'Wedding date', ta: 'திருமண தேதி' },
  time: { en: 'Muhurtham time', ta: 'முகூர்த்த நேரம்' },
  venue: { en: 'Venue name', ta: 'மண்டபத்தின் பெயர்' },
  address: { en: 'Address (optional)', ta: 'முகவரி (விருப்பம்)' },
  pin: { en: 'Pin the venue on the map (optional)', ta: 'மண்டபத்தை வரைபடத்தில் குறியுங்கள் (விருப்பம்)' },
  pinLead: { en: 'Guests get directions to this exact spot. Without a pin we search for the venue name.', ta: 'விருந்தினருக்கு இந்த இடத்துக்கே வழி கிடைக்கும். குறி இல்லையெனில் மண்டபப் பெயரால் தேடுவோம்.' },
  pinSet: { en: 'Pinned', ta: 'குறிக்கப்பட்டது' },
  clearPin: { en: 'Clear pin', ta: 'குறியை நீக்கு' },
  pinPaste: { en: 'Or paste coordinates / a Google Maps link', ta: 'அல்லது அட்சரேகை / Google Maps இணைப்பை ஒட்டுங்கள்' },
  pinHint: { en: 'e.g. 9.9195, 78.1193, or a link with @lat,lng', ta: 'எ.கா. 9.9195, 78.1193, அல்லது @lat,lng உள்ள இணைப்பு' },
  pinBad: { en: 'That doesn’t look like a lat, lng pair', ta: 'இது சரியான வரைபடக் குறியாகத் தெரியவில்லை' },
  map: { en: 'Venue map', ta: 'மண்டப வரைபடம்' },
  phone: { en: 'RSVP WhatsApp number', ta: 'வருகை சொல்ல WhatsApp எண்' },
  phoneHint: { en: 'Guests tap “RSVP” and it opens WhatsApp to this number', ta: 'விருந்தினர் “வருகை” பொத்தானைத் தொட்டால் இந்த எண்ணுக்கு WhatsApp திறக்கும்' },
  caricature: { en: 'Caricature', ta: 'கேரிகேச்சர்' },
  cariLead: { en: 'The caricature is the hero of a premium invite. Pick how you want yours.', ta: 'பிரீமியம் அழைப்பிதழின் நாயகம் கேரிகேச்சர்தான். உங்களுடையதை எப்படி வேண்டும் என்று தேர்ந்தெடுங்கள்.' },
  stock: { en: 'Our illustrated couple', ta: 'எங்கள் ஓவிய மணமக்கள்' },
  stockNote: { en: 'Ready now, drawn in the theme’s colours', ta: 'இப்போதே தயார், வடிவத்தின் நிறங்களில்' },
  ai: { en: 'Make one from your photo', ta: 'உங்கள் புகைப்படத்திலிருந்து உருவாக்குங்கள்' },
  aiNote: { en: 'Upload a clear photo of you both; AI draws you as a caricature in about 20 seconds', ta: 'இருவரும் தெளிவாக உள்ள புகைப்படத்தைப் பதிவேற்றுங்கள்; சுமார் 20 விநாடிகளில் AI கேரிகேச்சராக வரையும்' },
  aiBusy: { en: 'Drawing your caricature…', ta: 'உங்கள் கேரிகேச்சர் வரையப்படுகிறது…' },
  aiFail: { en: 'Couldn’t draw it this time. Try another photo, or upload your own caricature.', ta: 'இம்முறை வரைய முடியவில்லை. வேறு புகைப்படம் முயலுங்கள், அல்லது உங்கள் கேரிகேச்சரைப் பதிவேற்றுங்கள்.' },
  own: { en: 'Upload your caricature', ta: 'உங்கள் கேரிகேச்சரைப் பதிவேற்றுங்கள்' },
  ownNote: { en: 'Already have one drawn? Add it here', ta: 'ஏற்கெனவே வரைந்தது இருக்கிறதா? இங்கே சேருங்கள்' },
  current: { en: 'In your invite', ta: 'உங்கள் அழைப்பிதழில்' },
  again: { en: 'Try again', ta: 'மீண்டும் முயலுங்கள்' },
  upload: { en: 'Choose an image', ta: 'படத்தைத் தேர்வு செய்யுங்கள்' },
  replace: { en: 'Change image', ta: 'படத்தை மாற்றுங்கள்' },
  remove: { en: 'Remove', ta: 'நீக்குங்கள்' },
  local: {
    en: 'A caricature you add stays on this device for now: it shows in the preview and in the downloaded picture. Guests opening the link see our illustrated couple until we host yours (or paste a hosted link below).',
    ta: 'நீங்கள் சேர்க்கும் கேரிகேச்சர் இப்போதைக்கு இந்தக் கருவியிலேயே இருக்கும்: முன்னோட்டத்திலும் சேமிக்கும் படத்திலும் தெரியும். நாங்கள் அதை ஆன்லைனில் வைக்கும் வரை (அல்லது கீழே இணைப்பை ஒட்டும் வரை) இணைப்பைத் திறப்பவர்களுக்கு எங்கள் ஓவிய மணமக்கள் தெரிவார்கள்.',
  },
  noKeep: { en: 'Couldn’t keep the image on this device; it will go when you close the page', ta: 'படத்தை இந்தக் கருவியில் வைக்க முடியவில்லை; பக்கத்தை மூடினால் போய்விடும்' },
  badImage: { en: 'That file couldn’t be read as an image', ta: 'அந்தக் கோப்பைப் படமாகத் திறக்க முடியவில்லை' },
  artUrl: { en: 'Or a link to the image online (https://…)', ta: 'அல்லது ஆன்லைனில் உள்ள படத்தின் இணைப்பு (https://…)' },
  artUrlHint: { en: 'A hosted image does travel in the link', ta: 'ஆன்லைன் படம் இணைப்புடன் சேர்ந்தே போகும்' },
  preview: { en: 'Live preview', ta: 'நேரடி முன்னோட்டம்' },
  editPane: { en: 'Details', ta: 'விவரங்கள்' },
  previewPane: { en: 'Preview', ta: 'முன்னோட்டம்' },
  seePreview: { en: 'See the preview', ta: 'முன்னோட்டம் பார்' },
  backToEdit: { en: 'Back to details', ta: 'விவரங்களுக்குத் திரும்பு' },
  link: { en: 'Share your invite', ta: 'அழைப்பிதழைப் பகிருங்கள்' },
  linkLabel: { en: 'Your invite link', ta: 'உங்கள் அழைப்பிதழ் இணைப்பு' },
  open: { en: 'Open', ta: 'திறந்து பாருங்கள்' },
  needs: { en: 'Add both names in English, the date and the venue to make the link.', ta: 'இணைப்பு உருவாக, இருவர் பெயரையும் ஆங்கிலத்தில், தேதி, மண்டபம் ஆகியவற்றைச் சேருங்கள்.' },
  lockedTitle: { en: 'Premium designs need the premium e-invite', ta: 'பிரீமியம் வடிவங்களுக்குப் பிரீமியம் மின் அழைப்பிதழ் தேவை' },
  lockedBody: { en: 'Preview any design you like. To share a premium one, add the premium e-invite with caricature', ta: 'எந்த வடிவத்தையும் முன்னோட்டம் பார்க்கலாம். பிரீமியம் வடிவத்தைப் பகிர, கேரிகேச்சருடன் பிரீமியம் மின் அழைப்பிதழைச் சேருங்கள்' },
  bride: { en: 'Bride', ta: 'மணமகள்' },
  groom: { en: 'Groom', ta: 'மணமகன்' },
  yourVenue: { en: 'Your venue', ta: 'உங்கள் மண்டபம்' },
}

const ART_MAX = 640

/** Reads an image file and downscales it to fit ART_MAX, as a data URL. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, ART_MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * k)
      canvas.height = Math.round(img.height * k)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(src)
      resolve(canvas.toDataURL('image/webp', 0.86))
    }
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('not an image')) }
    img.src = src
  })
}

/** localStorage, wrapped so a private window or a full quota never breaks the form. */
const local = {
  get(key: string): string | null {
    try { return localStorage.getItem(key) } catch { return null }
  },
  set(key: string, value: string | null): boolean {
    try {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
      return true
    } catch { return false }
  },
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

export function InviteBuilder({ initial, premium, storageKey, unlock }: {
  /** Prefill from the order or showroom customer. A saved draft for `storageKey` wins over it. */
  initial: Partial<Omit<InviteDraft, 'theme'>> & { theme?: string }
  /** The premium e-invite add-on is in the order or cart. */
  premium: boolean
  /** Keeps the draft and the caricature on this device. Omit to keep them for this visit only. */
  storageKey?: string
  /** How to get the premium add-on: a link (dashboard) or an action (showroom cart). */
  unlock: { label: string; href?: string; onClick?: () => void }
}) {
  const lang = useLang()
  const t = useT(copy)
  const prices = usePrices()
  const premiumPrice = prices[PREMIUM_INVITE_ITEM as keyof typeof prices]
  const draftKey = storageKey && `ttc-invite-draft:${storageKey}`
  const artKey = storageKey && `ttc-invite-art:${storageKey}`

  const [d, setD] = useState<InviteDraft>(() => {
    let saved: Partial<InviteDraft> = {}
    try { saved = draftKey ? JSON.parse(local.get(draftKey) ?? '{}') : {} } catch { /* damaged draft */ }
    // Saved drafts and old prefills may carry a retired theme id; map it forward.
    const merged = { ...BLANK_DRAFT, ...initial, ...saved }
    return { ...merged, theme: toTheme(merged.theme) ?? toTheme(initial.theme) ?? BLANK_DRAFT.theme }
  })
  const [art, setArt] = useState<string | null>(() => (artKey ? local.get(artKey) : null))
  const [previewLang, setPreviewLang] = useState<Lang>(lang)
  // Phones and small tablets show the form or the preview, not one stacked under the other.
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')
  const top = useRef<HTMLDivElement>(null)
  const showPane = (p: 'edit' | 'preview') => {
    setPane(p)
    const el = top.current
    if (el && el.getBoundingClientRect().top < 0) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96 })
  }
  const set = <K extends keyof InviteDraft>(k: K, v: InviteDraft[K]) => setD(x => ({ ...x, [k]: v }))

  useEffect(() => { if (draftKey) local.set(draftKey, JSON.stringify(d)) }, [d, draftKey])

  const pickArt = async (file: File | undefined) => {
    if (!file) return
    try {
      const url = await downscale(file)
      setArt(url)
      if (artKey && !local.set(artKey, url)) toast(t.noKeep, 'ruby')
    } catch {
      toast(t.badImage, 'ruby')
    }
  }
  const clearArt = () => {
    setArt(null)
    if (artKey) local.set(artKey, null)
  }
  const [drawing, setDrawing] = useState<'idle' | 'busy' | 'failed'>('idle')
  /** Photo → Gemini caricature → the invite's art. */
  const drawFromPhoto = async (file: File | undefined) => {
    if (!file) return
    setDrawing('busy')
    try {
      const photo = await downscale(file)
      const out = await geminiCaricature(await (await fetch(photo)).blob())
      const url = await downscale(new File([await (await fetch(out)).blob()], 'caricature'))
      setArt(url)
      if (artKey && !local.set(artKey, url)) toast(t.noKeep, 'ruby')
      setDrawing('idle')
    } catch (e) {
      console.warn('[invite] caricature failed', e)
      setDrawing('failed')
    }
  }

  const missing = draftMissing(d)
  const invite = useMemo(() => draftToInvite(d), [d])
  const open = themeOpen(d.theme, premium)
  const url = `${window.location.origin}${invitePath(invite)}`
  const pin = parseLatLng(d.pin)
  const pinBad = !!d.pin.trim() && !pin

  // The preview fills gaps with placeholders so it never shows an empty card.
  const shown = useDebounced(d, 350)
  const previewInvite = useMemo(() => {
    const p = draftToInvite({
      ...shown,
      brideEn: shown.brideEn || copy.bride.en,
      groomEn: shown.groomEn || copy.groom.en,
      brideTa: shown.brideTa || (shown.brideEn ? '' : copy.bride.ta),
      groomTa: shown.groomTa || (shown.groomEn ? '' : copy.groom.ta),
      venue: shown.venue || copy.yourVenue[previewLang],
    })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) p.date = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10)
    return p
  }, [shown, previewLang])

  // Mini previews: the theme's own background, top motif and name font.
  const initials = `${(d.brideEn.trim()[0] ?? 'A').toUpperCase()} & ${(d.groomEn.trim()[0] ?? 'B').toUpperCase()}`
  // The picker shows every design in its own typeface.
  useEffect(() => { void ensureFonts([...FREE_THEMES, ...PREMIUM_THEMES].flatMap(k => themeFonts(themeStyle(k)))) }, [])
  const themeCard = (k: InviteTheme) => {
    const m = THEME_META[k]
    const active = d.theme === k
    const lockedTheme = !themeOpen(k, premium)
    return (
      <button
        key={k}
        type="button"
        aria-pressed={active}
        onClick={() => set('theme', k)}
        title={m.blurb[lang]}
        className={`min-w-0 rounded-2xl border p-1.5 text-left transition-colors duration-300 cursor-pointer ${active ? 'border-ruby bg-white ring-4 ring-ruby/10' : 'border-ink/10 bg-white/70 hover:border-ink/25'}`}
      >
        <span className="relative block overflow-hidden rounded-xl" style={{ boxShadow: 'inset 0 0 0 1px rgba(10,10,11,0.08)' }}>
          <ThemeThumb theme={k} initials={initials} className="aspect-[9/16] w-full" />
          {lockedTheme && (
            <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink/70" title={t.locked}>
              <Icon name="lock" size={12} />
            </span>
          )}
          {active && (
            <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ruby text-white">
              <Icon name="check" size={12} />
            </span>
          )}
        </span>
        <span className="mt-2 block truncate px-0.5 text-[12.5px] font-semibold text-ink">{m.name[lang]}</span>
        <span className="block truncate px-0.5 text-[11px] text-ink/45">{isPremium(k) ? formatINR(premiumPrice) : t.freeTag}</span>
      </button>
    )
  }
  const steps = isPremium(d.theme) ? 5 : 4

  return (
    <div ref={top} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
      <div className="flex justify-center lg:hidden">
        <Segmented value={pane} onChange={showPane} options={[{ value: 'edit', label: t.editPane }, { value: 'preview', label: t.previewPane }]} />
      </div>
      <div className={`min-w-0 space-y-5 ${pane === 'preview' ? 'max-lg:hidden' : ''}`}>
        <Section step={1} title={t.design}>
          <p className="t-label mb-2 text-ink/45">{t.free}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">{FREE_THEMES.map(themeCard)}</div>
          <p className="t-label mb-2 mt-5 flex items-center gap-1.5 text-ink/45">
            <Icon name="gem" size={12} /> {t.premium} · {formatINR(premiumPrice)}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">{PREMIUM_THEMES.map(themeCard)}</div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-ink/55">{THEME_META[d.theme].name[lang]} · {THEME_META[d.theme].blurb[lang]}</p>
        </Section>

        <Section step={2} title={t.couple}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.brideEn} value={d.brideEn} onChange={v => set('brideEn', v)} required />
            <Field label={t.groomEn} value={d.groomEn} onChange={v => set('groomEn', v)} required />
            <Field label={t.brideTa} value={d.brideTa} onChange={v => set('brideTa', v)} hint={t.taHint} />
            <Field label={t.groomTa} value={d.groomTa} onChange={v => set('groomTa', v)} hint={t.taHint} />
            <Field label={t.parentsEn} value={d.parentsEn} onChange={v => set('parentsEn', v)} placeholder={copy.parentsPh.en} />
            <Field label={t.parentsTa} value={d.parentsTa} onChange={v => set('parentsTa', v)} placeholder={copy.parentsPh.ta} />
          </div>
        </Section>

        <Section step={3} title={t.day}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.date} value={d.date} onChange={v => set('date', v)} type="date" required />
            <Field label={t.time} value={d.time} onChange={v => set('time', v)} type="time" />
            <Field label={t.venue} value={d.venue} onChange={v => set('venue', v)} icon="building" required />
            <Field label={t.address} value={d.address} onChange={v => set('address', v)} />
            <Field label={t.phone} value={d.phone} onChange={v => set('phone', v)} type="tel" inputMode="tel" icon="whatsapp" hint={t.phoneHint} />
          </div>
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="t-label text-ink/55">{t.pin}</p>
              {pin && (
                <span className="flex items-center gap-2 text-[12px] text-ink/60">
                  <Icon name="mapPin" size={13} /> {t.pinSet} · {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                  <button type="button" onClick={() => set('pin', '')} className="min-h-8 rounded-full border border-ink/12 bg-white px-3 text-[12px] font-medium text-ink/75 cursor-pointer hover:border-ink/30">{t.clearPin}</button>
                </span>
              )}
            </div>
            <p className="mb-3 text-[12.5px] leading-relaxed text-ink/55">{t.pinLead}</p>
            <PinMap value={pin ?? undefined} onPick={ll => set('pin', `${ll.lat}, ${ll.lng}`)} label={t.map} className="h-72 w-full" />
            <details className="mt-3 group" open={pinBad || undefined}>
              <summary className="cursor-pointer text-[12.5px] font-medium text-ink/60 hover:text-ink">{t.pinPaste}</summary>
              <div className="mt-3">
                <Field label={t.pinPaste} value={d.pin} onChange={v => set('pin', v)} icon="mapPin" hint={t.pinHint} error={pinBad ? t.pinBad : undefined} />
              </div>
            </details>
          </div>
        </Section>

        {isPremium(d.theme) && (
          <Section step={4} title={t.caricature}>
            <p className="mb-4 text-[13px] leading-relaxed text-ink/60">{t.cariLead}</p>
            <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
              <figure className="relative mx-auto aspect-square w-40 overflow-hidden rounded-[28px]" style={{ background: themeStyle(d.theme).base }}>
                <img src={art ?? coupleUrl(themeStyle(d.theme).accent)} alt={t.caricature} className={`absolute inset-0 h-full w-full ${art ? 'object-cover' : 'object-contain object-bottom'}`} />
                {drawing === 'busy' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-ruby/25 border-t-ruby" />
                  </span>
                )}
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-4 text-center text-[11px] font-medium text-white">{t.current}</figcaption>
              </figure>
              <div className="grid gap-2">
                <button type="button" onClick={clearArt} aria-pressed={!art} className={cariOpt(!art)}>
                  <Icon name="heart" size={16} className="mt-0.5 shrink-0 text-ruby" />
                  <span><span className="block text-[13.5px] font-semibold text-ink">{t.stock}</span><span className="block text-[12px] text-ink/55">{t.stockNote}</span></span>
                </button>
                {hasGemini() && (
                  <label className={`${cariOpt(false)} ${drawing === 'busy' ? 'pointer-events-none opacity-70' : ''}`}>
                    <Icon name="sparkle" size={16} className="mt-0.5 shrink-0 text-ruby" />
                    <span>
                      <span className="block text-[13.5px] font-semibold text-ink">{drawing === 'busy' ? t.aiBusy : drawing === 'failed' ? `${t.ai} · ${t.again}` : t.ai}</span>
                      <span className="block text-[12px] text-ink/55">{drawing === 'failed' ? t.aiFail : t.aiNote}</span>
                    </span>
                    <input type="file" accept="image/*" className="sr-only" onChange={e => { void drawFromPhoto(e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                )}
                <label className={cariOpt(false)}>
                  <Icon name="camera" size={16} className="mt-0.5 shrink-0 text-ruby" />
                  <span><span className="block text-[13.5px] font-semibold text-ink">{art ? t.replace : t.own}</span><span className="block text-[12px] text-ink/55">{t.ownNote}</span></span>
                  <input type="file" accept="image/*" className="sr-only" onChange={e => { void pickArt(e.target.files?.[0]); e.target.value = '' }} />
                </label>
              </div>
            </div>
            <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-ink/55">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" /> {t.local}
            </p>
            <div className="mt-4">
              <Field label={t.artUrl} value={d.caricatureUrl} onChange={v => set('caricatureUrl', v)} type="url" hint={t.artUrlHint} />
            </div>
          </Section>
        )}

        <Section step={steps} title={t.link}>
          {missing.length > 0 ? (
            <p className="text-[13.5px] leading-relaxed text-ink/60">{t.needs}</p>
          ) : !open ? (
            <div className="rounded-2xl bg-ruby-soft p-4 text-ruby-deep">
              <p className="flex items-center gap-2 text-[14px] font-semibold"><Icon name="lock" size={15} /> {t.lockedTitle}</p>
              <p className="mt-1 text-[13px] leading-relaxed">{t.lockedBody} ({formatINR(premiumPrice)}).</p>
              <Button size="sm" className="mt-3" iconLeft="plus" href={unlock.href} onClick={unlock.onClick}>{unlock.label}</Button>
            </div>
          ) : (
            <>
              <p className="t-label mb-2 text-ink/45">{t.linkLabel}</p>
              <p className="mb-4 truncate rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 font-mono text-[12px] text-ink/65" title={url}>{url}</p>
              <ShareSheet
                invite={invite}
                url={url}
                lang={lang}
                art={art ?? invite.caricature}
                tone="light"
                extra={
                  <a href={invitePath(invite)} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-5 text-[13px] font-medium text-ink/80 transition hover:border-ink/30">
                    <Icon name="external" size={15} /> {t.open}
                  </a>
                }
              />
            </>
          )}
        </Section>
        <Button variant="outline" full icon="arrowRight" className="lg:hidden" onClick={() => showPane('preview')}>{t.seePreview}</Button>
      </div>

      <aside className={`min-w-0 lg:sticky lg:top-28 ${pane === 'edit' ? 'max-lg:hidden' : ''}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="t-label text-ink/45">{t.preview}</p>
          <Segmented size="sm" value={previewLang} onChange={setPreviewLang} options={[{ value: 'en', label: 'EN' }, { value: 'ta', label: 'தமிழ்' }]} />
        </div>
        <div className="mx-auto w-[300px] max-w-full overflow-hidden rounded-[38px] border-[6px] border-ink bg-ink shadow-[0_30px_60px_-30px_rgba(10,10,11,0.6)]">
          {/* One phone screen, no scrolling: exactly what guests see */}
          <div style={{ width: 390, zoom: 288 / 390 }}>
            <InviteView key={d.theme} invite={previewInvite} lang={previewLang} size={{ w: 390, h: 800 }} art={art ?? undefined} />
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-[300px] text-center text-[12px] leading-relaxed text-ink/50">{THEME_META[d.theme].name[lang]}{isPremium(d.theme) ? ` · ${formatINR(premiumPrice)}` : ` · ${t.freeTag}`}</p>
        <div className="mx-auto mt-5 max-w-[300px] lg:hidden">
          <Button variant="outline" full iconLeft="chevronLeft" onClick={() => showPane('edit')}>{t.backToEdit}</Button>
        </div>
      </aside>
    </div>
  )
}

/** One caricature choice; the active one gets the ruby ring. */
const cariOpt = (on: boolean) => `flex min-h-14 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer focus-within:ring-4 focus-within:ring-ruby/10 ${on ? 'border-ruby bg-ruby-soft/50' : 'border-ink/10 bg-white hover:border-ink/25'}`

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <Card className="p-5 md:p-6">
      <h3 className="mb-4 flex items-center gap-2.5 text-[15px] font-semibold text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white tabular-nums">{step}</span>
        {title}
      </h3>
      {children}
    </Card>
  )
}
