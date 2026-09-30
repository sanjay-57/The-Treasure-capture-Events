import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, Card, Chip, LangImg } from '../../components/ui'
import { EASE, Reveal } from '../../components/motion'
import { Kolam } from '../../components/tamil'
import { formatDate, useLang, useT, type Bi } from '../../lib/i18n'
import { useMyOrder, useStore, type Order } from '../../lib/store'
import { toast, useTitle } from '../../lib/ui'
import { PageIntro, Stars, TamilCorners, firstName } from './shared'

const copy = {
  eyebrow: { en: 'Your review', ta: 'உங்கள் கருத்து' },
  title: { en: 'How did we do?', ta: 'எங்கள் சேவை எப்படி இருந்தது?' },
  lead: {
    en: 'Two minutes of your time helps another family choose with confidence — and tells our team what to keep doing.',
    ta: 'உங்கள் இரண்டு நிமிடம், இன்னொரு குடும்பம் நம்பிக்கையுடன் தேர்வு செய்ய உதவும் — எங்கள் குழுவுக்கும் வழிகாட்டும்.',
  },
  early: {
    en: 'Your album hasn’t reached you yet — share your thoughts now if you like, and update them after delivery.',
    ta: 'ஆல்பம் இன்னும் உங்களை வந்தடையவில்லை — விரும்பினால் இப்போதே கருத்துச் சொல்லுங்கள், ஒப்படைப்புக்குப் பின் மாற்றலாம்.',
  },
  rate: { en: 'Your rating', ta: 'உங்கள் மதிப்பீடு' },
  tapStar: { en: 'Tap a star', ta: 'ஒரு நட்சத்திரத்தைத் தொடுங்கள்' },
  star: { en: 'star', ta: 'நட்சத்திரம்' },
  words: { en: 'In your words', ta: 'உங்கள் வார்த்தைகளில்' },
  placeholder: { en: 'What will you remember about working with us?', ta: 'எங்களுடன் பணியாற்றியதில் எதை நினைவில் வைத்திருப்பீர்கள்?' },
  highlights: { en: 'Tap to add highlights', ta: 'சிறப்புகளைச் சேர்க்கத் தொடுங்கள்' },
  submit: { en: 'Submit review', ta: 'கருத்தைச் சமர்ப்பி' },
  update: { en: 'Update review', ta: 'கருத்தைப் புதுப்பி' },
  cancel: { en: 'Cancel', ta: 'ரத்து' },
  thanksToast: { en: 'Thank you! Your review is saved.', ta: 'நன்றி! உங்கள் கருத்து சேமிக்கப்பட்டது.' },

  thanksTitle: { en: 'Thank you,', ta: 'நன்றி,' },
  thanksBody: {
    en: 'One last favour: post it on Google so other families can find us. We’ve copied the text so you can paste it straight in.',
    ta: 'ஒரு சிறு உதவி: மற்ற குடும்பங்கள் எங்களைக் கண்டறிய கூகுளில் பதிவிடுங்கள். உரையை நகலெடுத்துள்ளோம் — அப்படியே ஒட்டலாம்.',
  },
  thanksBodyNoCopy: {
    en: 'One last favour: post it on Google so other families can find us. Copy your text below and paste it straight in.',
    ta: 'ஒரு சிறு உதவி: மற்ற குடும்பங்கள் எங்களைக் கண்டறிய கூகுளில் பதிவிடுங்கள். கீழே உள்ள உரையை நகலெடுத்து ஒட்டுங்கள்.',
  },
  google: { en: 'Post on Google', ta: 'கூகுளில் பதிவிடு' },
  copyText: { en: 'Copy review text', ta: 'உரையை நகலெடு' },
  copied: { en: 'Review text copied', ta: 'உரை நகலெடுக்கப்பட்டது' },
  edit: { en: 'Edit', ta: 'திருத்து' },
  posted: { en: 'Shared on', ta: 'பகிர்ந்த தேதி' },

  sideQuote: { en: 'Every review is read by the whole team — the photographers, the editors and the binders.', ta: 'ஒவ்வொரு கருத்தையும் முழுக் குழுவும் படிக்கிறது — புகைப்படக் கலைஞர்கள், எடிட்டர்கள், ஆல்பக் கைவினைஞர்கள்.' },
  sideSign: { en: '— The Treasure Capture Events', ta: '— The Treasure Capture Events' },
}

const LABELS: Bi[] = [
  { en: 'Disappointing', ta: 'ஏமாற்றம்' },
  { en: 'Could be better', ta: 'இன்னும் மேம்படலாம்' },
  { en: 'Good', ta: 'நன்று' },
  { en: 'Great', ta: 'மிக நன்று' },
  { en: 'Unforgettable', ta: 'மறக்க முடியாதது' },
]

const HIGHLIGHTS: Bi[] = [
  { en: 'Beautiful candid moments', ta: 'அழகான இயல்பான தருணங்கள்' },
  { en: 'Never missed a ritual', ta: 'ஒரு சடங்கும் தவறவில்லை' },
  { en: 'Warm, friendly team', ta: 'அன்பான, இனிமையான குழு' },
  { en: 'Stunning album', ta: 'அற்புதமான ஆல்பம்' },
  { en: 'On time, every time', ta: 'எப்போதும் சரியான நேரம்' },
  { en: 'Worth every rupee', ta: 'ஒவ்வொரு ரூபாய்க்கும் தகுதியானது' },
]

export default function Review() {
  useTitle({ en: 'Review', ta: 'கருத்து' })
  const order = useMyOrder()
  if (!order) return null
  return <ReviewInner order={order} />
}

function ReviewInner({ order }: { order: Order }) {
  const t = useT(copy)
  const [editing, setEditing] = useState(!order.review)
  const [copiedOnSubmit, setCopiedOnSubmit] = useState(false)

  return (
    <div>
      <PageIntro eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-8">
        <AnimatePresence mode="wait" initial={false}>
          {editing || !order.review ? (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }} transition={{ duration: 0.5, ease: EASE }}>
              <ReviewForm
                order={order}
                onDone={copied => {
                  setCopiedOnSubmit(copied)
                  setEditing(false)
                }}
                onCancel={order.review ? () => setEditing(false) : undefined}
              />
            </motion.div>
          ) : (
            <motion.div key="thanks" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.6, ease: EASE }}>
              <ThankYou order={order} copied={copiedOnSubmit} onEdit={() => setEditing(true)} />
            </motion.div>
          )}
        </AnimatePresence>
        <SidePanel />
      </div>
    </div>
  )
}

function ReviewForm({ order, onDone, onCancel }: { order: Order; onDone: (copied: boolean) => void; onCancel?: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const submitReview = useStore(s => s.submitReview)
  const [rating, setRating] = useState(order.review?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState(order.review?.text ?? '')
  const shown = hover || rating

  const toggleHighlight = (h: string) => {
    setText(cur => {
      if (cur.includes(h)) return cur.replace(new RegExp(`\\s*${h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.?`), '').trim()
      const base = cur.trim()
      return base ? `${base}${/[.!?]$/.test(base) ? '' : '.'} ${h}.` : `${h}.`
    })
  }

  const submit = async () => {
    if (!rating) return
    submitReview(order.id, rating, text.trim())
    let copied = false
    if (text.trim()) {
      try {
        await navigator.clipboard?.writeText(text.trim())
        copied = true
      } catch {
        copied = false
      }
    }
    toast(t.thanksToast, 'ruby')
    onDone(copied)
  }

  return (
    <Card className="relative p-5 sm:p-6 md:p-9">
      <TamilCorners />
      {order.status !== 'DELIVERED' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-ink/[0.03] p-4 text-[13.5px] leading-relaxed text-ink/60 sm:mb-7">
          <Icon name="info" size={17} className="mt-0.5 shrink-0 text-ink/40" />
          {t.early}
        </div>
      )}

      <p className="t-label text-ink/50">{t.rate}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mt-4 sm:gap-y-3">
        <div className="-mx-1 flex gap-0.5 sm:mx-0 sm:gap-1" role="radiogroup" aria-label={t.rate} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map(i => {
            const on = i <= shown
            return (
              <motion.button
                key={i}
                type="button"
                role="radio"
                aria-checked={rating === i}
                aria-label={`${i} ${t.star} · ${LABELS[i - 1][lang]}`}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(0)}
                whileHover={{ scale: 1.12, rotate: -6 }}
                whileTap={{ scale: 0.88 }}
                className="flex h-12 w-12 items-center justify-center rounded-full cursor-pointer md:h-14 md:w-14"
              >
                <motion.span animate={{ scale: rating === i ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.4 }} className="flex">
                  <Icon name="star" size={34} strokeWidth={1.4} className={`transition-colors duration-200 ${on ? 'fill-ruby text-ruby' : 'text-ink/20'}`} />
                </motion.span>
              </motion.button>
            )
          })}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={shown}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className={`font-display text-[20px] font-semibold sm:text-[22px] ${shown ? 'text-ink' : 'text-ink/35'}`}
          >
            {shown ? LABELS[shown - 1][lang] : t.tapStar}
          </motion.span>
        </AnimatePresence>
      </div>

      <label htmlFor="review-text" className="t-label mt-7 block text-ink/50 sm:mt-9">
        {t.words}
      </label>
      <div className="relative mt-3">
        <textarea
          id="review-text"
          rows={6}
          value={text}
          maxLength={600}
          onChange={e => setText(e.target.value)}
          placeholder={t.placeholder}
          className="w-full resize-none rounded-2xl border border-ink/10 bg-white/80 px-4 py-3.5 text-[15px] leading-relaxed text-ink outline-none transition-all duration-200 placeholder:text-ink/35 focus:border-ruby focus:bg-white focus:ring-4 focus:ring-ruby/10"
        />
        <span className="pointer-events-none absolute bottom-3 right-4 text-[11px] tabular-nums text-ink/35">{text.length}/600</span>
      </div>

      <p className="mt-5 text-[12.5px] text-ink/45">{t.highlights}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {HIGHLIGHTS.map(h => (
          <Chip key={h.en} active={text.includes(h[lang])} onClick={() => toggleHighlight(h[lang])} className="!h-10 !px-3.5 !text-[13px] md:!h-9">
            {text.includes(h[lang]) ? <Icon name="check" size={13} strokeWidth={2.4} /> : <Icon name="plus" size={13} />}
            {h[lang]}
          </Chip>
        ))}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-2.5 sm:mt-9 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
        )}
        <Button size="lg" onClick={submit} disabled={!rating} icon="send">
          {order.review ? t.update : t.submit}
        </Button>
      </div>
    </Card>
  )
}

function ThankYou({ order, copied, onEdit }: { order: Order; copied: boolean; onEdit: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const googleUrl = useStore(s => s.cms.studio.googleReviewUrl)
  const review = order.review!

  const copyText = () => {
    navigator.clipboard?.writeText(review.text).then(() => toast(t.copied), () => {})
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-ink p-5 text-white sm:rounded-[28px] sm:p-7 md:p-10">
      <div className="ambient-dark absolute inset-0 -z-0" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-center gap-4">
          {lang === 'ta' ? (
            <Kolam size={64} className="h-12 w-12 shrink-0 text-ruby-bright sm:h-16 sm:w-16" strokeWidth={2} />
          ) : (
            <motion.span
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ruby shadow-ruby sm:h-16 sm:w-16"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            >
              <span className="absolute inset-0 rounded-full bg-ruby/50 animate-pulse-ring" />
              <Icon name="heart" size={26} className="fill-white text-white" />
            </motion.span>
          )}
          <h3 className="t-2 min-w-0 text-white">
            {t.thanksTitle} <span className="italic-accent text-ruby-bright">{firstName(order.client.name)}</span>
          </h3>
        </div>

        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/70 sm:mt-6">{copied ? t.thanksBody : t.thanksBodyNoCopy}</p>

        <div className="glass-dark relative mt-6 rounded-3xl p-4 sm:mt-7 sm:p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <motion.span key={i} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.07, type: 'spring', stiffness: 400, damping: 18 }}>
                  <Icon name="star" size={20} className={i <= review.rating ? 'fill-ruby-bright text-ruby-bright' : 'text-white/25'} />
                </motion.span>
              ))}
              <span className="ml-2 text-[13px] font-medium text-white/80">{LABELS[review.rating - 1]?.[lang]}</span>
            </span>
            <span className="text-[12px] text-white/45">
              {t.posted} {formatDate(review.at, lang)}
            </span>
          </div>
          {review.text && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-white/85">“{review.text}”</p>}
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap">
          <Button href={googleUrl} variant="white" icon="arrowUpRight">
            {t.google}
          </Button>
          {review.text && (
            <Button variant="glass-dark" iconLeft="copy" onClick={copyText}>
              {t.copyText}
            </Button>
          )}
          <Button variant="outline-light" iconLeft="edit" onClick={onEdit}>
            {t.edit}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SidePanel() {
  const t = useT(copy)
  return (
    <Reveal delay={0.08} className="hidden lg:block">
      <div className="relative h-full min-h-[460px] overflow-hidden rounded-[28px] bg-ink">
        <LangImg pair={{ en: 'm_couple_night', ta: 't_couple_seated' }} className="absolute inset-0" w={900} dark />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" aria-hidden="true" />
        <div className="glass-dark absolute inset-x-5 bottom-5 rounded-3xl p-6">
          <Icon name="quote" size={26} className="text-ruby-bright" />
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/90">{t.sideQuote}</p>
          <p className="mt-3 text-[13px] text-white/50">{t.sideSign}</p>
          <div className="mt-4">
            <Stars value={5} size={15} className="[&_svg]:!text-ruby-bright [&_svg]:fill-ruby-bright" />
          </div>
        </div>
      </div>
    </Reveal>
  )
}
