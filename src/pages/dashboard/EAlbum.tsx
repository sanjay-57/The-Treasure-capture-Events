import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Button, Card } from '../../components/ui'
import { Reveal } from '../../components/motion'
import { EAlbumPoster, EAlbumViewer } from '../../components/EAlbumViewer'
import { ALBUM } from '../../lib/data'
import { useLang, useT } from '../../lib/i18n'
import { useMyOrder } from '../../lib/store'
import { useTitle } from '../../lib/ui'
import { LockedPanel, PageIntro, TamilCorners, albumDefaults, albumPhotos, albumUnlocked, savedAlbum } from './shared'

const copy = {
  eyebrow: { en: 'E-album', ta: 'இ-ஆல்பம்' },
  title: { en: 'Watch your album come alive.', ta: 'உங்கள் ஆல்பம் உயிர் பெறுவதைப் பாருங்கள்.' },
  lead: {
    en: 'Your chosen photos, laid out as a wedding album you can turn page by page — the cover lifts, the camera moves into every photo, and each leaf flips on its own.',
    ta: 'நீங்கள் தேர்ந்த படங்கள் பக்கம் பக்கமாகப் புரட்டும் திருமண ஆல்பமாக — அட்டை திறக்கும், ஒவ்வொரு படத்தையும் நெருங்கிக் காட்டும், பக்கங்கள் தாமே புரளும்.',
  },
  play: { en: 'Play the e-album', ta: 'இ-ஆல்பத்தை இயக்கு' },
  photos: { en: 'photos', ta: 'படங்கள்' },
  spreads: { en: 'spreads', ta: 'பக்கங்கள்' },
  sample: { en: 'Sample layouts', ta: 'மாதிரி அமைப்புகள்' },
  sampleNote: {
    en: 'The pages here follow the sample layouts from the album studio. The real design from our album makers will replace them, and this player will show that too.',
    ta: 'இங்குள்ள பக்கங்கள் ஆல்பம் ஸ்டுடியோவின் மாதிரி அமைப்புகளைப் பின்பற்றுகின்றன. ஆல்பம் தயாரிப்பாளர்களின் உண்மையான வடிவமைப்பு வந்ததும் இங்கே அதுவே காட்டப்படும்.',
  },
  designNote: { en: 'Change the cover, paper or layout in the album studio and the e-album follows.', ta: 'ஆல்பம் ஸ்டுடியோவில் அட்டை, தாள் அல்லது அமைப்பை மாற்றினால் இ-ஆல்பமும் மாறும்.' },
  studio: { en: 'Open album studio', ta: 'ஆல்பம் ஸ்டுடியோ' },
  share: { en: 'Share with family', ta: 'குடும்பத்துடன் பகிர' },
  shareNote: { en: 'A private link for the e-album arrives with the final design.', ta: 'இறுதி வடிவமைப்புடன் இ-ஆல்பத்திற்கான தனிப்பட்ட இணைப்பு வரும்.' },
  lockedTitle: { en: 'Choose your photos first', ta: 'முதலில் படங்களைத் தேர்ந்தெடுங்கள்' },
  lockedBody: {
    en: 'The e-album plays your own selection — it opens as soon as you submit your photo picks.',
    ta: 'இ-ஆல்பம் உங்கள் தேர்வையே காட்டும் — படத் தேர்வைச் சமர்ப்பித்தவுடன் திறக்கும்.',
  },
}

export default function EAlbum() {
  useTitle({ en: 'Your e-album', ta: 'உங்கள் இ-ஆல்பம்' })
  const t = useT(copy)
  const lang = useLang()
  const order = useMyOrder()
  const [open, setOpen] = useState(false)
  const unlocked = !!order && albumUnlocked(order)

  const spec = useMemo(() => (order ? savedAlbum(order.album) ?? albumDefaults(order) : null), [order])
  const photos = useMemo(() => (order ? albumPhotos(order, lang, 6, 60) : []), [order, lang])

  // Arriving on this page is the ask to watch; the poster stays behind for a replay.
  useEffect(() => {
    if (unlocked) setOpen(true)
  }, [unlocked])

  if (!order || !spec) return null

  if (!unlocked) {
    return (
      <div>
        <PageIntro eyebrow={t.eyebrow} title={t.title} />
        <LockedPanel order={order} unlockAt="ALBUM_CUSTOMIZATION" title={t.lockedTitle} body={t.lockedBody} image={{ en: 'm_couple_white', ta: 't_couple_seated' }} icon="play" />
      </div>
    )
  }

  const layout = ALBUM.layouts.find(l => l.key === (spec.layout ?? 'classic')) ?? ALBUM.layouts[0]
  const spreads = Math.max(1, Math.ceil(photos.length / Math.max(1, layout.cells.length)))

  return (
    <div>
      <PageIntro eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      <Reveal>
        <EAlbumPoster spec={spec} photo={photos[0]} className="h-[380px] sm:h-[460px] lg:h-[540px]">
          <button type="button" onClick={() => setOpen(true)} aria-label={t.play} className="group absolute inset-0 flex items-end justify-center pb-8 sm:pb-10 cursor-pointer">
            <span className="flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-6 text-ink shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-[1.04]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ruby text-white">
                <Icon name="play" size={18} className="translate-x-px" />
              </span>
              <span className="text-[15px] font-semibold">{t.play}</span>
            </span>
          </button>
          <p className="pointer-events-none absolute left-5 top-5 text-[12.5px] tabular-nums text-white/55 sm:left-7 sm:top-7">
            {photos.length} {t.photos} · {spreads} {t.spreads}
          </p>
        </EAlbumPoster>
      </Reveal>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Reveal delay={0.05}>
          <Card className="relative h-full p-6 md:p-7">
            <TamilCorners />
            <p className="t-label text-ink/50">{t.sample}</p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink/65">{t.sampleNote}</p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink/65">{t.designNote}</p>
            <Button to="/dashboard/album" variant="outline" icon="arrowRight" className="mt-5">
              {t.studio}
            </Button>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="relative h-full p-6 md:p-7">
            <TamilCorners />
            <p className="t-label text-ink/50">{t.share}</p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink/65">{t.shareNote}</p>
            <div className="mt-5 flex items-center gap-2 text-[13px] text-ink/45">
              <Icon name="lock" size={14} />
              <span>{photos.length} {t.photos}</span>
            </div>
          </Card>
        </Reveal>
      </div>

      <EAlbumViewer open={open} onClose={() => setOpen(false)} spec={spec} photos={photos} />
    </div>
  )
}
