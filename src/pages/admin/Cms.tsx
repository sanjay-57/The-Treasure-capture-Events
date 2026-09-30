import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, Img, Modal, Segmented } from '../../components/ui'
import { EASE } from '../../components/motion'
import { DISTRICTS, districtName, type DistrictKey } from '../../lib/data'
import { GALLERY, GALLERY_CATS, type GalleryCat, type Tone } from '../../lib/gallery'
import { IMG, type ImgKey } from '../../lib/images'
import { COMMON, useLang, useT, type Lang } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { useStore, type CmsState } from '../../lib/store'
import { AC, FormSelect, PageHeader, Panel, SaveBar, SearchInput, Switch, Tabs, TextInput } from './kit'

const copy = {
  eyebrow: { en: 'Headless CMS', ta: 'உள்ளடக்க மேலாண்மை' },
  title: { en: 'Website content', ta: 'இணையதள உள்ளடக்கம்' },
  sub: { en: 'Banners, homepage photographs, portfolio and studio details. Changes go live on the public site instantly.', ta: 'பேனர்கள், முகப்புப் படங்கள், காட்சியகம், ஸ்டுடியோ விவரங்கள். மாற்றங்கள் உடனே இணையதளத்தில் தோன்றும்.' },
  tabBanner: { en: 'Announcement', ta: 'அறிவிப்பு' },
  tabHero: { en: 'Homepage hero', ta: 'முகப்புப் படங்கள்' },
  tabGallery: { en: 'Portfolio', ta: 'காட்சியகம்' },
  tabStudio: { en: 'Studio info', ta: 'ஸ்டுடியோ விவரம்' },
  openSite: { en: 'Open website', ta: 'இணையதளம் திற' },
  // banner
  banner: { en: 'Announcement strip', ta: 'அறிவிப்புப் பட்டை' },
  bannerSub: { en: 'The slim bar above the navigation on every page', ta: 'ஒவ்வொரு பக்கத்திலும் மெனுவுக்கு மேலுள்ள மெல்லிய பட்டை' },
  enabled: { en: 'Show on website', ta: 'இணையதளத்தில் காட்டு' },
  textEn: { en: 'Message · English', ta: 'செய்தி · ஆங்கிலம்' },
  textTa: { en: 'Message · Tamil', ta: 'செய்தி · தமிழ்' },
  link: { en: 'Links to', ta: 'இணைப்பு' },
  preview: { en: 'Live preview', ta: 'நேரடி முன்னோட்டம்' },
  hiddenNow: { en: 'Hidden from visitors', ta: 'பார்வையாளர்களுக்கு மறைக்கப்பட்டுள்ளது' },
  chars: { en: 'characters', ta: 'எழுத்துகள்' },
  // hero
  hero: { en: 'Hero slideshow', ta: 'முகப்புப் படக்காட்சி' },
  heroSub: { en: 'English visitors see contemporary photos; Tamil visitors see traditional ones. Up to 6 each.', ta: 'ஆங்கிலப் பார்வையாளர்களுக்கு நவீனப் படங்கள்; தமிழுக்கு பாரம்பரியப் படங்கள். ஒவ்வொன்றுக்கும் அதிகபட்சம் 6.' },
  forEn: { en: 'English site', ta: 'ஆங்கிலத் தளம்' },
  forTa: { en: 'Tamil site', ta: 'தமிழ்த் தளம்' },
  slide: { en: 'Slide', ta: 'படம்' },
  first: { en: 'Opens with', ta: 'முதல் படம்' },
  up: { en: 'Move earlier', ta: 'முன்னே நகர்த்து' },
  down: { en: 'Move later', ta: 'பின்னே நகர்த்து' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  library: { en: 'Photo library', ta: 'படத் தொகுப்பு' },
  libSub: { en: 'Tap a photo to add or remove it', ta: 'சேர்க்க அல்லது நீக்க படத்தைத் தட்டவும்' },
  modern: { en: 'Contemporary', ta: 'நவீனம்' },
  traditional: { en: 'Traditional', ta: 'பாரம்பரியம்' },
  max: { en: 'Six slides maximum — remove one first', ta: 'அதிகபட்சம் 6 படங்கள் — முதலில் ஒன்றை நீக்கவும்' },
  minOne: { en: 'Keep at least one slide', ta: 'குறைந்தது ஒரு படம் இருக்க வேண்டும்' },
  heroSaved: { en: 'Homepage slideshow updated', ta: 'முகப்புப் படக்காட்சி புதுப்பிக்கப்பட்டது' },
  more: { en: 'Show more', ta: 'மேலும் காட்டு' },
  byUrl: { en: 'Or paste an image URL', ta: 'அல்லது பட URL ஒட்டவும்' },
  add: { en: 'Add', ta: 'சேர்' },
  badUrl: { en: 'Enter a full https:// image link', ta: 'முழு https:// பட இணைப்பை உள்ளிடவும்' },
  // gallery
  gallery: { en: 'Portfolio gallery', ta: 'காட்சியகப் படங்கள்' },
  gallerySub: { en: 'Hide a photo to take it off the public gallery. Add the studio’s own work by URL.', ta: 'பொதுக் காட்சியகத்திலிருந்து நீக்க படத்தை மறைக்கவும். ஸ்டுடியோவின் சொந்தப் படங்களை URL மூலம் சேர்க்கவும்.' },
  addImage: { en: 'Add image', ta: 'படம் சேர்' },
  visible: { en: 'Visible', ta: 'தெரிபவை' },
  hidden: { en: 'Hidden', ta: 'மறைந்தவை' },
  hide: { en: 'Hide from gallery', ta: 'காட்சியகத்தில் மறை' },
  show: { en: 'Show in gallery', ta: 'காட்சியகத்தில் காட்டு' },
  nowHidden: { en: 'Hidden from the public gallery', ta: 'பொதுக் காட்சியகத்திலிருந்து மறைக்கப்பட்டது' },
  nowShown: { en: 'Back in the public gallery', ta: 'மீண்டும் காட்சியகத்தில்' },
  custom: { en: 'Added', ta: 'சேர்த்தது' },
  delete: { en: 'Delete', ta: 'அழி' },
  deleted: { en: 'Image removed', ta: 'படம் நீக்கப்பட்டது' },
  searchPh: { en: 'Search titles', ta: 'தலைப்புகளைத் தேடு' },
  of: { en: 'of', ta: '/' },
  newImage: { en: 'Add a portfolio image', ta: 'காட்சியகப் படம் சேர்' },
  url: { en: 'Image URL', ta: 'பட URL' },
  category: { en: 'Category', ta: 'வகை' },
  titleEn: { en: 'Title · English', ta: 'தலைப்பு · ஆங்கிலம்' },
  titleTa: { en: 'Title · Tamil', ta: 'தலைப்பு · தமிழ்' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  tone: { en: 'Show on', ta: 'காட்டும் தளம்' },
  both: { en: 'Both', ta: 'இரண்டும்' },
  addToGallery: { en: 'Add to gallery', ta: 'காட்சியகத்தில் சேர்' },
  added: { en: 'Image added to the portfolio', ta: 'படம் காட்சியகத்தில் சேர்க்கப்பட்டது' },
  needFields: { en: 'A valid URL and an English title are required', ta: 'சரியான URL-உம் ஆங்கிலத் தலைப்பும் அவசியம்' },
  noPreview: { en: 'Paste a link to preview', ta: 'முன்னோட்டத்திற்கு இணைப்பை ஒட்டவும்' },
  // studio
  studio: { en: 'Studio contact', ta: 'ஸ்டுடியோ தொடர்பு' },
  studioSub: { en: 'Shown in the footer, contact page and client invoices', ta: 'அடிக்குறிப்பு, தொடர்புப் பக்கம், ரசீதுகளில் காட்டப்படும்' },
  phone: { en: 'Phone', ta: 'தொலைபேசி' },
  whatsapp: { en: 'WhatsApp', ta: 'WhatsApp' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  addrEn: { en: 'Address · English', ta: 'முகவரி · ஆங்கிலம்' },
  addrTa: { en: 'Address · Tamil', ta: 'முகவரி · தமிழ்' },
  review: { en: 'Google review link', ta: 'Google கருத்து இணைப்பு' },
  visitUs: { en: 'Visit the studio', ta: 'ஸ்டுடியோவுக்கு வாருங்கள்' },
}

type Tab = 'banner' | 'hero' | 'gallery' | 'studio'
const isUrl = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim())
const isKey = (s: string): s is ImgKey => s in IMG

export default function Cms() {
  const t = useT(copy)
  const lang = useLang()
  const cms = useStore(s => s.cms)
  const updateCms = useStore(s => s.updateCms)
  const [tab, setTab] = useState<Tab>('banner')
  const [banner, setBanner] = useState(cms.banner)
  const [studio, setStudio] = useState(cms.studio)
  useTitle({ en: 'Website CMS', ta: 'இணையதள உள்ளடக்கம்' })

  const dirty = JSON.stringify(banner) !== JSON.stringify(cms.banner) || JSON.stringify(studio) !== JSON.stringify(cms.studio)
  const save = () => {
    updateCms({ banner, studio })
    toast(AC.saved[lang])
  }
  const discard = () => {
    setBanner(cms.banner)
    setStudio(cms.studio)
  }

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} actions={<Button href="/" variant="outline" size="sm" iconLeft="external" className="max-md:!h-10">{t.openSite}</Button>} />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        className="mb-5 md:mb-6"
        options={[
          { value: 'banner', label: t.tabBanner, icon: 'sparkle' },
          { value: 'hero', label: t.tabHero, icon: 'image' },
          { value: 'gallery', label: t.tabGallery, icon: 'grid', count: GALLERY.length + cms.extraGallery.length - cms.hiddenGallery.length },
          { value: 'studio', label: t.tabStudio, icon: 'building' },
        ]}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }} transition={{ duration: 0.4, ease: EASE }}>
          {tab === 'banner' && <BannerEditor value={banner} onChange={setBanner} />}
          {tab === 'hero' && <HeroEditor />}
          {tab === 'gallery' && <GalleryManager />}
          {tab === 'studio' && <StudioEditor value={studio} onChange={setStudio} />}
        </motion.div>
      </AnimatePresence>
      <SaveBar show={dirty} onSave={save} onDiscard={discard} />
    </div>
  )
}

// ─── Banner ──────────────────────────────────────────────────────────────────

function BannerEditor({ value, onChange }: { value: CmsState['banner']; onChange: (v: CmsState['banner']) => void }) {
  const t = useT(copy)
  const lang = useLang()
  const set = (p: Partial<CmsState['banner']>) => onChange({ ...value, ...p })
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel title={t.banner} subtitle={t.bannerSub} icon="sparkle" action={<Switch checked={value.enabled} onChange={v => set({ enabled: v })} label={t.enabled} />}>
        <div className="space-y-4">
          <div>
            <TextInput label={t.textEn} value={value.en} onChange={v => set({ en: v })} rows={3} />
            <p className="mt-1 text-right text-[11px] text-ink/35">{value.en.length} {t.chars}</p>
          </div>
          <div>
            <TextInput label={t.textTa} value={value.ta} onChange={v => set({ ta: v })} rows={3} lang="ta" />
            <p className="mt-1 text-right text-[11px] text-ink/35">{value.ta.length} {t.chars}</p>
          </div>
          <FormSelect
            label={t.link}
            value={value.link}
            onChange={v => set({ link: v })}
            options={[
              { value: '/book', label: `/book · ${COMMON.book[lang]}` },
              { value: '/gallery', label: '/gallery' },
              { value: '/services', label: '/services' },
              { value: '/contact', label: '/contact' },
              { value: '/about', label: '/about' },
              ...(['/book', '/gallery', '/services', '/contact', '/about'].includes(value.link) ? [] : [{ value: value.link, label: value.link }]),
            ]}
          />
        </div>
      </Panel>

      <Panel title={t.preview} icon="eye">
        <div className="space-y-4">
          {(['en', 'ta'] as Lang[]).map(l => (
            <div key={l}>
              <p className="t-label mb-2 text-ink/40">{l === 'en' ? 'English' : 'தமிழ்'}</p>
              <div className={`overflow-hidden rounded-2xl border hairline transition ${value.enabled ? '' : 'opacity-40 grayscale'}`}>
                <div className="relative flex items-center justify-center gap-2 bg-ink px-8 py-2.5 text-center text-[12px] text-white/85 md:px-9 md:text-[12.5px]" style={{ fontFamily: l === 'ta' ? "'Hind Madurai', sans-serif" : "'Inter', sans-serif" }}>
                  <Icon name="sparkle" size={14} className="shrink-0 text-ruby-bright" />
                  <span className="line-clamp-2">{(l === 'en' ? value.en : value.ta) || '—'}</span>
                  <Icon name="arrowRight" size={13} className="shrink-0" />
                  <Icon name="x" size={13} className="absolute right-3 text-white/40" />
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-b from-mist to-white px-4 py-3">
                  <span className="h-5 w-5 rounded-md bg-ruby/80" />
                  <span className="h-2 w-20 rounded-full bg-ink/10" />
                  <span className="ml-auto hidden h-2 w-10 rounded-full bg-ink/10 min-[400px]:block" />
                  <span className="h-2 w-10 rounded-full bg-ink/10 max-[399px]:ml-auto" />
                  <span className="h-6 w-16 rounded-full bg-ruby/80" />
                </div>
              </div>
            </div>
          ))}
          {!value.enabled && <p className="flex items-center gap-2 text-[12.5px] text-ruby"><Icon name="eye" size={14} />{t.hiddenNow}</p>}
          <p className="text-[12px] text-ink/40">→ {value.link}</p>
        </div>
      </Panel>
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function SlideImg({ src, w, className = '' }: { src: string; w: number; className?: string }) {
  return isKey(src) ? <Img k={src} w={w} ratio={4 / 3} sizes={`${w}px`} className={className} /> : <Img src={src} className={className} />
}

function HeroEditor() {
  const t = useT(copy)
  const lang = useLang()
  const slides = useStore(s => s.cms.heroSlides)
  const updateCms = useStore(s => s.updateCms)
  const [which, setWhich] = useState<Lang>(lang)
  const [pool, setPool] = useState<'modern' | 'traditional'>(lang === 'ta' ? 'traditional' : 'modern')
  const [limit, setLimit] = useState(24)
  const [url, setUrl] = useState('')
  const [urlErr, setUrlErr] = useState('')
  const list = slides[which]

  const commit = (next: string[]) => updateCms({ heroSlides: { ...slides, [which]: next } })
  const toggle = (k: string) => {
    if (list.includes(k)) {
      if (list.length <= 1) return toast(t.minOne, 'ruby')
      commit(list.filter(x => x !== k))
    } else {
      if (list.length >= 6) return toast(t.max, 'ruby')
      commit([...list, k])
    }
    toast(t.heroSaved)
  }
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    commit(next)
  }
  const addUrl = () => {
    if (!isUrl(url)) return setUrlErr(t.badUrl)
    if (list.length >= 6) return toast(t.max, 'ruby')
    commit([...list, url.trim()])
    setUrl('')
    toast(t.heroSaved)
  }

  const keys = useMemo(() => (Object.keys(IMG) as ImgKey[]).filter(k => k.startsWith(pool === 'modern' ? 'm_' : 't_')), [pool])

  return (
    <div className="space-y-5">
      <Panel
        title={t.hero}
        subtitle={t.heroSub}
        icon="image"
        kolam
        action={<Segmented<Lang> size="sm" value={which} onChange={v => { setWhich(v); setPool(v === 'ta' ? 'traditional' : 'modern') }} options={[{ value: 'en', label: t.forEn }, { value: 'ta', label: t.forTa }]} />}
      >
        <p className="mb-3 text-[12.5px] text-ink/45"><span className="font-semibold text-ink">{list.length}</span> / 6</p>
        <LayoutGroup id={`hero-${which}`}>
          <ol className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 xl:grid-cols-6">
            <AnimatePresence initial={false}>
              {list.map((s, i) => (
                <motion.li key={s} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="group relative">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink/5">
                    <SlideImg src={s} w={360} className="absolute inset-0 h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/20" />
                    <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/90 px-1.5 text-[11px] font-bold text-ink">{i + 1}</span>
                    {i === 0 && <span className="absolute right-2 top-2 rounded-full bg-ruby px-2 py-0.5 text-[10px] font-semibold text-white">{t.first}</span>}
                    <div className="glass-dark absolute inset-x-2 bottom-2 flex items-center justify-between rounded-full p-1">
                      <SlideBtn icon="chevronLeft" label={t.up} onClick={() => move(i, -1)} disabled={i === 0} />
                      <SlideBtn icon="trash" label={t.remove} onClick={() => toggle(s)} />
                      <SlideBtn icon="chevronRight" label={t.down} onClick={() => move(i, 1)} disabled={i === list.length - 1} />
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
            {Array.from({ length: Math.max(0, 6 - list.length) }, (_, i) => (
              <li key={`empty-${i}`} className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-ink/12 text-ink/25">
                <Icon name="plus" size={18} />
              </li>
            ))}
          </ol>
        </LayoutGroup>
        <div className="mt-5 flex flex-col gap-2 border-t hairline pt-5 sm:flex-row sm:items-end">
          <TextInput label={t.byUrl} value={url} onChange={v => { setUrl(v); setUrlErr('') }} placeholder="https://…" inputMode="url" className="flex-1" />
          <Button variant="ink" size="md" iconLeft="plus" onClick={addUrl} className="!h-11">{t.add}</Button>
        </div>
        {urlErr && <p className="mt-1.5 text-[12.5px] text-ruby">{urlErr}</p>}
      </Panel>

      <Panel title={t.library} subtitle={t.libSub} icon="grid" action={<Segmented size="sm" value={pool} onChange={v => { setPool(v); setLimit(24) }} options={[{ value: 'modern', label: t.modern }, { value: 'traditional', label: t.traditional }]} />}>
        <ul className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
          {keys.slice(0, limit).map(k => {
            const idx = list.indexOf(k)
            const on = idx >= 0
            return (
              <li key={k}>
                <button type="button" onClick={() => toggle(k)} aria-pressed={on} title={IMG[k].alt} className={`group relative block aspect-square w-full overflow-hidden rounded-xl transition cursor-pointer ${on ? 'ring-[3px] ring-ruby ring-offset-2' : 'hover:opacity-90'}`}>
                  <Img k={k} w={220} ratio={1} sizes="120px" className="absolute inset-0 h-full w-full" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <span className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition ${on ? 'bg-ruby text-white' : 'bg-white/80 text-transparent opacity-0 group-hover:opacity-100 group-hover:text-ink'}`}>
                    {on ? idx + 1 : <Icon name="plus" size={13} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {limit < keys.length && (
          <div className="mt-5 flex justify-center"><Button variant="outline" size="sm" onClick={() => setLimit(l => l + 24)}>{t.more} ({keys.length - limit})</Button></div>
        )}
      </Panel>
    </div>
  )
}

function SlideBtn({ icon, label, onClick, disabled }: { icon: 'chevronLeft' | 'chevronRight' | 'trash'; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 md:h-7 md:w-7 hover:text-white disabled:opacity-25 cursor-pointer disabled:cursor-default">
      <Icon name={icon} size={14} />
    </button>
  )
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

interface Row { id: string; img?: ImgKey; url?: string; cat: GalleryCat; tone: Tone; title: { en: string; ta: string }; district: DistrictKey; custom: boolean }

function GalleryManager() {
  const t = useT(copy)
  const lang = useLang()
  const cms = useStore(s => s.cms)
  const updateCms = useStore(s => s.updateCms)
  const [cat, setCat] = useState<GalleryCat | 'all'>('all')
  const [vis, setVis] = useState<'all' | 'visible' | 'hidden'>('all')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(30)
  const [adding, setAdding] = useState(false)

  const rows: Row[] = useMemo(
    () => [
      ...cms.extraGallery.map(e => ({ id: e.id, url: e.url, cat: e.cat, tone: e.tone, title: { en: e.titleEn, ta: e.titleTa }, district: e.district, custom: true })),
      ...GALLERY.map(g => ({ id: g.id, img: g.img, url: g.url, cat: g.cat, tone: g.tone, title: g.title, district: g.district, custom: false })),
    ],
    [cms.extraGallery],
  )
  const hidden = useMemo(() => new Set(cms.hiddenGallery), [cms.hiddenGallery])
  const filtered = rows.filter(r => {
    if (cat !== 'all' && r.cat !== cat) return false
    if (vis === 'visible' && hidden.has(r.id)) return false
    if (vis === 'hidden' && !hidden.has(r.id)) return false
    const s = q.trim().toLowerCase()
    if (s && !(r.title.en.toLowerCase().includes(s) || r.title.ta.includes(q.trim()))) return false
    return true
  })

  const toggle = (id: string) => {
    const on = hidden.has(id)
    updateCms({ hiddenGallery: on ? cms.hiddenGallery.filter(x => x !== id) : [...cms.hiddenGallery, id] })
    toast(on ? t.nowShown : t.nowHidden)
  }
  const del = (id: string) => {
    updateCms({ extraGallery: cms.extraGallery.filter(e => e.id !== id), hiddenGallery: cms.hiddenGallery.filter(x => x !== id) })
    toast(t.deleted)
  }

  return (
    <Panel title={t.gallery} subtitle={t.gallerySub} icon="grid" action={<Button size="sm" iconLeft="plus" onClick={() => setAdding(true)}>{t.addImage}</Button>}>
      <div className="no-scrollbar -mx-5 mb-4 flex gap-1.5 overflow-x-auto px-5 md:-mx-1 md:px-1" data-lenis-prevent>
        {GALLERY_CATS.map(c => {
          const active = c.key === cat
          const n = c.key === 'all' ? rows.length : rows.filter(r => r.cat === c.key).length
          return (
            <button key={c.key} type="button" onClick={() => { setCat(c.key); setLimit(30) }} aria-pressed={active} className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors md:h-9 cursor-pointer ${active ? 'text-white' : 'text-ink/60 hover:text-ink'}`}>
              {active ? <motion.span layoutId="cms-cat" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 36 }} /> : <span className="absolute inset-0 rounded-full border border-ink/[0.08]" />}
              <span className="relative whitespace-nowrap">{c.name[lang]}</span>
              <span className={`relative text-[11px] tabular-nums ${active ? 'text-white/60' : 'text-ink/35'}`}>{n}</span>
            </button>
          )
        })}
      </div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder={t.searchPh} className="sm:w-[260px]" />
        <Segmented size="sm" value={vis} onChange={setVis} className="w-full [&>button]:h-9 [&>button]:flex-1 sm:ml-auto sm:w-fit sm:[&>button]:h-7 sm:[&>button]:flex-none" options={[{ value: 'all', label: AC.all[lang] }, { value: 'visible', label: t.visible }, { value: 'hidden', label: `${t.hidden} · ${cms.hiddenGallery.length}` }]} />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 py-12 text-center text-[13.5px] text-ink/45">{AC.noResults[lang]}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-2.5 gap-y-4 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-6">
          {filtered.slice(0, limit).map(r => {
            const off = hidden.has(r.id)
            return (
              <motion.li key={r.id} layout="position" className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink/5">
                  <div className={`absolute inset-0 transition duration-500 ${off ? 'scale-[0.97] opacity-35 grayscale' : ''}`}>
                    {r.img ? <Img k={r.img} w={320} ratio={4 / 5} sizes="200px" className="h-full w-full" /> : <Img src={r.url} className="h-full w-full" />}
                  </div>
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
                    <span className="flex gap-1">
                      {r.custom && <span className="rounded-full bg-ruby px-2 py-0.5 text-[10px] font-semibold text-white">{t.custom}</span>}
                      {off && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">{t.hidden}</span>}
                    </span>
                    <span className="flex gap-1">
                      {r.custom && (
                        <button type="button" onClick={() => del(r.id)} aria-label={t.delete} title={t.delete} className="glass-dark flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:text-white md:opacity-0 md:group-hover:opacity-100 cursor-pointer">
                          <Icon name="trash" size={14} />
                        </button>
                      )}
                      <button type="button" onClick={() => toggle(r.id)} aria-pressed={!off} aria-label={off ? t.show : t.hide} title={off ? t.show : t.hide} className={`relative flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer ${off ? 'bg-ruby text-white shadow-ruby' : 'glass-dark text-white/85 hover:text-white md:opacity-0 md:group-hover:opacity-100'}`}>
                        <Icon name="eye" size={15} />
                        {off && <span className="absolute h-[1.5px] w-4 rotate-45 rounded-full bg-white" />}
                      </button>
                    </span>
                  </div>
                </div>
                <p className={`mt-2 truncate text-[12.5px] font-medium ${off ? 'text-ink/35' : 'text-ink'}`}>{r.title[lang]}</p>
                <p className="truncate text-[11px] text-ink/40">{districtName(r.district, lang)} · {GALLERY_CATS.find(c => c.key === r.cat)?.name[lang]}</p>
              </motion.li>
            )
          })}
        </ul>
      )}
      {limit < filtered.length && (
        <div className="mt-6 flex justify-center"><Button variant="outline" size="sm" onClick={() => setLimit(l => l + 30)}>{t.more} · {Math.min(limit, filtered.length)} {t.of} {filtered.length}</Button></div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} label={t.newImage} className="sm:max-w-2xl">
        {adding && <AddImageForm onClose={() => setAdding(false)} />}
      </Modal>
    </Panel>
  )
}

function AddImageForm({ onClose }: { onClose: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const extra = useStore(s => s.cms.extraGallery)
  const updateCms = useStore(s => s.updateCms)
  const [url, setUrl] = useState('')
  const [cat, setCat] = useState<GalleryCat>('weddings')
  const [titleEn, setTitleEn] = useState('')
  const [titleTa, setTitleTa] = useState('')
  const [district, setDistrict] = useState<DistrictKey>('madurai')
  const [tone, setTone] = useState<Tone>('both')
  const [err, setErr] = useState('')
  const [broken, setBroken] = useState(false)

  const save = () => {
    if (!isUrl(url) || !titleEn.trim()) return setErr(t.needFields)
    const item = { id: 'x' + Math.random().toString(36).slice(2, 9), url: url.trim(), cat, titleEn: titleEn.trim(), titleTa: titleTa.trim() || titleEn.trim(), district, tone }
    updateCms({ extraGallery: [item, ...extra] })
    toast(t.added)
    onClose()
  }

  return (
    <div className="grid gap-5 p-5 pt-6 sm:gap-6 sm:p-6 sm:pt-7 md:grid-cols-[220px_1fr] md:p-8">
      <div>
        <h2 className="mb-4 pr-10 text-[20px] font-semibold tracking-tight text-ink md:hidden">{t.newImage}</h2>
        <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-dashed md:aspect-[4/5] border-ink/15 bg-ink/[0.02]">
          {isUrl(url) && !broken ? (
            <img src={url.trim()} alt="" onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 px-6 text-center text-[12px] text-ink/40"><Icon name="image" size={22} />{t.noPreview}</span>
          )}
        </div>
      </div>
      <div>
        <h2 className="mb-5 hidden pr-10 text-[20px] font-semibold tracking-tight text-ink md:block">{t.newImage}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label={t.url} value={url} onChange={v => { setUrl(v); setErr(''); setBroken(false) }} placeholder="https://…" inputMode="url" required className="sm:col-span-2" autoFocus />
          <TextInput label={t.titleEn} value={titleEn} onChange={v => { setTitleEn(v); setErr('') }} required />
          <TextInput label={t.titleTa} value={titleTa} onChange={setTitleTa} lang="ta" />
          <FormSelect<GalleryCat> label={t.category} value={cat} onChange={setCat} options={GALLERY_CATS.filter(c => c.key !== 'all').map(c => ({ value: c.key as GalleryCat, label: c.name[lang] }))} />
          <FormSelect<DistrictKey> label={t.district} value={district} onChange={setDistrict} options={DISTRICTS.map(d => ({ value: d.key, label: d.name[lang] }))} />
          <div className="sm:col-span-2">
            <p className="t-label mb-1.5 text-ink/50">{t.tone}</p>
            <Segmented<Tone> size="sm" value={tone} onChange={setTone} options={[{ value: 'both', label: t.both }, { value: 'modern', label: t.forEn }, { value: 'traditional', label: t.forTa }]} />
          </div>
        </div>
        {err && <p className="mt-3 text-[13px] text-ruby">{err}</p>}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{AC.cancel[lang]}</Button>
          <Button variant="ink" iconLeft="plus" onClick={save}>{t.addToGallery}</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Studio ──────────────────────────────────────────────────────────────────

function StudioEditor({ value, onChange }: { value: CmsState['studio']; onChange: (v: CmsState['studio']) => void }) {
  const t = useT(copy)
  const lang = useLang()
  const set = (p: Partial<CmsState['studio']>) => onChange({ ...value, ...p })
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel title={t.studio} subtitle={t.studioSub} icon="building">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label={t.phone} value={value.phone} onChange={v => set({ phone: v })} inputMode="tel" />
          <TextInput label={t.whatsapp} value={value.whatsapp} onChange={v => set({ whatsapp: v })} inputMode="tel" />
          <TextInput label={t.email} value={value.email} onChange={v => set({ email: v })} inputMode="email" type="email" className="sm:col-span-2" />
          <TextInput label={t.addrEn} value={value.addressEn} onChange={v => set({ addressEn: v })} rows={2} />
          <TextInput label={t.addrTa} value={value.addressTa} onChange={v => set({ addressTa: v })} rows={2} lang="ta" />
          <TextInput label={t.review} value={value.googleReviewUrl} onChange={v => set({ googleReviewUrl: v })} inputMode="url" className="sm:col-span-2" />
        </div>
      </Panel>
      <Panel title={t.preview} icon="eye">
        <div className="ambient-dark relative overflow-hidden rounded-[22px] p-5 text-white md:p-6">
          {lang === 'ta' && <div className="kolam-bg-white pointer-events-none absolute inset-0 opacity-[0.05]" />}
          <p className="t-label relative text-white/45">{t.visitUs}</p>
          <p className="relative mt-3 break-words font-display text-[19px] leading-snug md:text-[22px]">{lang === 'ta' ? value.addressTa : value.addressEn}</p>
          <div className="relative mt-6 space-y-2.5 text-[13.5px] text-white/75">
            <p className="flex items-center gap-2.5"><Icon name="phone" size={15} className="shrink-0 text-ruby-bright" />{value.phone}</p>
            <p className="flex items-center gap-2.5"><Icon name="whatsapp" size={15} className="shrink-0 text-ruby-bright" />{value.whatsapp}</p>
            <p className="flex min-w-0 items-center gap-2.5"><Icon name="mail" size={15} className="shrink-0 text-ruby-bright" /><span className="min-w-0 truncate">{value.email}</span></p>
            <p className="flex min-w-0 items-center gap-2.5"><Icon name="star" size={15} className="shrink-0 text-ruby-bright" /><span className="min-w-0 truncate text-white/50">{value.googleReviewUrl}</span></p>
          </div>
        </div>
      </Panel>
    </div>
  )
}
