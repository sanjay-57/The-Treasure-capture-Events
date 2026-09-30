import { useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Img } from './ui'
import { Icon } from './Icon'
import { EASE } from './motion'
import { KolamCorner } from './tamil'
import type { LightboxItem } from './Lightbox'
import { districtName, type EventKey } from '../lib/data'
import { GALLERY, GALLERY_CATS, galleryForLang, type GalleryCat, type GalleryItem, type Story, STORIES } from '../lib/gallery'
import { photoRatio, type ImgKey } from '../lib/images'
import { formatDate, useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

export const CAT_TO_EVENT: Record<GalleryCat, EventKey> = {
  weddings: 'wedding',
  prewedding: 'outdoor',
  engagement: 'engagement',
  reception: 'reception',
  ceremonies: 'puberty',
  little: 'birthday',
  culture: 'wedding',
}

/** Gallery for the current language, including CMS additions and minus hidden items. */
export function useGalleryItems(): GalleryItem[] {
  const lang = useLang()
  const hidden = useStore(s => s.cms.hiddenGallery)
  const extra = useStore(s => s.cms.extraGallery)
  return useMemo(() => {
    const extras: GalleryItem[] = extra.map(e => ({ id: e.id, url: e.url, ratio: 4 / 5, cat: e.cat, tone: e.tone, title: { en: e.titleEn, ta: e.titleTa }, district: e.district }))
    return galleryForLang(lang, [...extras, ...GALLERY]).filter(i => !hidden.includes(i.id))
  }, [lang, hidden, extra])
}

export function itemRatio(i: GalleryItem): number {
  return i.img ? photoRatio(i.img) : i.ratio ?? 0.8
}

export function toLightbox(i: GalleryItem): LightboxItem {
  const cat = GALLERY_CATS.find(c => c.key === i.cat)?.name
  const story = i.story ? STORIES.find(s => s.slug === i.story) : undefined
  return {
    id: i.id,
    k: i.img,
    url: i.url,
    title: i.title,
    meta: { en: `${districtName(i.district, 'en')} · ${cat?.en ?? ''}`, ta: `${districtName(i.district, 'ta')} · ${cat?.ta ?? ''}` },
    story: story ? { slug: story.slug, title: story.title } : undefined,
    bookHref: `/book?event=${CAT_TO_EVENT[i.cat]}&district=${i.district}`,
  }
}

/** Tall cinematic story card used on Home and in the Gallery rail. */
export function StoryCard({ story, index = 0, className = '', cover }: { story: Story; index?: number; className?: string; cover?: ImgKey }) {
  const lang = useLang()
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, delay: (index % 4) * 0.08, ease: EASE }}
      className={className}
    >
      <Link to={`/gallery/${story.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[28px] bg-ink">
        <Img k={cover ?? story.cover} w={900} ratio={3 / 4} sizes="(max-width: 768px) 80vw, 420px" dark className="absolute inset-0" imgClassName="transition-transform duration-[1.6s] ease-out group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
        {lang === 'ta' && (
          <>
            <KolamCorner className="absolute left-3 top-3 opacity-90" />
            <KolamCorner className="absolute right-3 top-3 -scale-x-100 opacity-90" />
          </>
        )}
        <div className={`absolute top-4 flex justify-center ${lang === 'ta' ? 'inset-x-14' : 'inset-x-4'}`}>
          <span className="glass-dark max-w-full truncate rounded-full px-3 py-1 text-[11px] font-medium text-white/85">{story.event[lang]} · {districtName(story.district, lang)}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
          <p className="text-[13px] text-white/60">{formatDate(story.date, lang, { month: 'long', year: 'numeric' })}</p>
          <p className="t-3 mt-1 !text-white">{story.title[lang]}</p>
          <p className="mt-1 font-accent text-lg italic-accent text-white/80">{story.names[lang]}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-white/80 transition group-hover:text-white">
            {lang === 'ta' ? 'கதையைப் பார்க்க' : 'View story'}
            <Icon name="arrowRight" size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
