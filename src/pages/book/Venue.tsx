import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { useLenis } from 'lenis/react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { DatePicker, Field, LangImg, Segmented, Badge, TimePicker } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { mapsLink } from '../../components/MapEmbed'
import { PinMap } from '../../components/PinMap'
import { Reveal, EASE } from '../../components/motion'
import { KolamCorner, Ornament, TempleBorder } from '../../components/tamil'
import { formatDate, formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { useStore } from '../../lib/store'
import { TRAVEL_FREE_KM, TRAVEL_PER_KM, VENUES, districtName, type VenueType } from '../../lib/data'
import { estimateDistanceKm } from '../../lib/pricing'
import { districtCentre, hasGooglePlaces, resolveSuggestion, reverseGeocode, roundCoord, suggestPlaces, type LatLng, type Suggestion } from '../../lib/geo'
import { StepGuard, StepHeader, StepNav, SubHeading, LEAD_DAYS, earliestEventISO, todayISO } from './shared'

const copy = {
  title: { en: 'Where, and when?', ta: 'எங்கே, எப்போது?' },
  lead: {
    en: 'Tell us about the venue and the date. Travel within 20 km of our studio is always free.',
    ta: 'இடம் மற்றும் தேதியைச் சொல்லுங்கள். எங்கள் ஸ்டுடியோவிலிருந்து 20 கி.மீ-க்குள் பயணம் எப்போதும் இலவசம்.',
  },
  venueType: { en: 'Venue type', ta: 'இட வகை' },
  venueTypeLabel: { en: 'Choose venue type', ta: 'இட வகையைத் தேர்ந்தெடுக்கவும்' },
  homeCrowd: { en: 'Usually under 50 guests', ta: 'பொதுவாக 50-க்கும் குறைவான விருந்தினர்' },
  mahalCrowd: { en: 'Usually 100+ guests', ta: 'பொதுவாக 100-க்கும் மேற்பட்ட விருந்தினர்' },
  noSurcharge: { en: 'No venue surcharge', ta: 'இடக் கூடுதல் கட்டணம் இல்லை' },
  lightingKit: { en: 'stage lighting kit', ta: 'மேடை விளக்கு அமைப்பு' },
  address: { en: 'Venue address', ta: 'இட முகவரி' },
  addressNote: { en: 'We use it to plan travel and the right kit for the space.', ta: 'பயணத்தையும் இடத்திற்கேற்ற உபகரணங்களையும் திட்டமிட இது உதவும்.' },
  homeName: { en: 'House / family name', ta: 'வீடு / குடும்பப் பெயர்' },
  mahalName: { en: 'Mahal / hall name', ta: 'மண்டபம் / அரங்கின் பெயர்' },
  homeNamePh: { en: 'House name', ta: 'இல்லத்தின் பெயர்' },
  mahalNamePh: { en: 'Mahal or hall name', ta: 'மண்டபத்தின் பெயர்' },
  optional: { en: 'Optional', ta: 'விருப்பத்திற்கு' },
  fullAddress: { en: 'Full address', ta: 'முழு முகவரி' },
  addressPh: { en: 'Full address', ta: 'முழு முகவரி' },
  distTitle: { en: 'Distance from our studio', ta: 'எங்கள் ஸ்டுடியோவிலிருந்து தூரம்' },
  estimate: { en: 'Estimate', ta: 'தோராயம்' },
  enterAddress: { en: 'Enter the address to estimate distance.', ta: 'தூரத்தை மதிப்பிட முகவரியை உள்ளிடுங்கள்.' },
  needPin: { en: 'Search for the venue or use your location to estimate distance.', ta: 'தூரத்தைக் கணக்கிட, இடத்தைத் தேடுங்கள் அல்லது உங்கள் இருப்பிடத்தைப் பயன்படுத்துங்கள்.' },
  fromPin: { en: 'Measured to your pin.', ta: 'நீங்கள் குறித்த இடம் வரை கணக்கிட்டது.' },
  fromCentre: { en: 'Measured to {d} town centre. Pin the venue for a closer figure.', ta: '{d} நகர மையம் வரை கணக்கிட்டது. இடத்தைக் குறித்தால் இன்னும் சரியாக வரும்.' },
  within: { en: 'Within the free 20 km radius — no travel charge.', ta: 'இலவச 20 கி.மீ வரம்புக்குள் — பயணக் கட்டணம் இல்லை.' },
  beyond: { en: 'beyond the free radius', ta: 'இலவச வரம்புக்கு அப்பால்' },
  perKm: { en: `₹${TRAVEL_PER_KM}/km`, ta: `கி.மீ-க்கு ₹${TRAVEL_PER_KM}` },
  free: { en: 'Free', ta: 'இலவசம்' },
  freeZone: { en: '20 km free', ta: '20 கி.மீ இலவசம்' },
  km: { en: 'km', ta: 'கி.மீ' },
  distNote: {
    en: 'An estimate: the straight line from our Madurai studio, plus 30% for the roads. We confirm the actual route when we call you.',
    ta: 'இது தோராயமான தூரம்: எங்கள் மதுரை ஸ்டுடியோவிலிருந்து நேர்கோட்டுத் தூரத்துடன், சாலைக்காக 30% கூட்டியுள்ளோம். அழைக்கும்போது சரியான வழியை உறுதிசெய்வோம்.',
  },
  search: { en: 'Search for the venue', ta: 'இடத்தைத் தேடுங்கள்' },
  searchPh: { en: 'Search a mahal, street or area', ta: 'மண்டபம், தெரு அல்லது பகுதியைத் தேடுங்கள்' },
  searchHint: { en: 'Pick a suggestion to pin it, or tap the map below to drop the pin yourself.', ta: 'ஒரு பரிந்துரையைத் தேர்ந்தால் குறிக்கப்படும்; அல்லது கீழே வரைபடத்தைத் தொட்டு நீங்களே பின் போடுங்கள்.' },
  searching: { en: 'Searching…', ta: 'தேடுகிறது…' },
  found: { en: 'places found', ta: 'இடங்கள் கிடைத்தன' },
  noResults: { en: 'No match yet. Drop a pin on the map instead, or type the full address below.', ta: 'பொருத்தம் இல்லை. வரைபடத்தில் பின் போடுங்கள், அல்லது கீழே முழு முகவரியை எழுதுங்கள்.' },
  google: { en: 'Powered by Google', ta: 'Google வழங்குகிறது' },
  results: { en: 'Places found', ta: 'கிடைத்த இடங்கள்' },
  osm: { en: '© OpenStreetMap contributors', ta: '© OpenStreetMap பங்களிப்பாளர்கள்' },
  myLocation: { en: 'Use my location', ta: 'என் இருப்பிடத்தைப் பயன்படுத்து' },
  locating: { en: 'Finding you…', ta: 'இருப்பிடம் தேடுகிறது…' },
  pinned: { en: 'Pinned on the map', ta: 'வரைபடத்தில் குறிக்கப்பட்டது' },
  unpin: { en: 'Remove pin', ta: 'குறியை நீக்கு' },
  pinnedAddress: { en: 'Pinned location', ta: 'குறித்த இடம்' },
  noLocation: { en: 'We could not get your location. Type the address instead.', ta: 'உங்கள் இருப்பிடம் கிடைக்கவில்லை. முகவரியைத் தட்டச்சு செய்யுங்கள்.' },
  deniedLocation: {
    en: 'Location is turned off for this site. Allow it in your browser’s site settings (the icon beside the address bar), or just type the address.',
    ta: 'இந்தத் தளத்திற்கு இருப்பிட அனுமதி இல்லை. உலாவியின் தள அமைப்புகளில் (முகவரிப் பட்டைக்கு அருகிலுள்ள குறி) அனுமதி தாருங்கள், அல்லது முகவரியைத் தட்டச்சு செய்யுங்கள்.',
  },
  mapTitle: { en: 'Venue on the map', ta: 'வரைபடத்தில் இடம்' },
  openMaps: { en: 'Open in Google Maps', ta: 'Google Maps-ல் திற' },
  when: { en: 'Date & time', ta: 'தேதி & நேரம்' },
  whenNote: { en: 'Not fixed yet? Mark it tentative and we will pencil it in.', ta: 'இன்னும் உறுதியாகவில்லையா? தற்காலிகம் எனக் குறியுங்கள்; நாங்கள் குறித்து வைக்கிறோம்.' },
  leadNote: {
    en: `We plan every shoot with the family, so bookings open ${LEAD_DAYS} days ahead. The earliest date is {d}. Sooner than that? Call or WhatsApp us.`,
    ta: `ஒவ்வொரு படப்பிடிப்பையும் குடும்பத்துடன் சேர்ந்து திட்டமிடுகிறோம்; அதனால் ${LEAD_DAYS} நாட்களுக்கு முன்பே பதிவு செய்ய வேண்டும். முதல் தேதி {d}. அதற்கு முன் என்றால் அழைக்கவும் அல்லது WhatsApp செய்யவும்.`,
  },
  exact: { en: 'Exact date', ta: 'உறுதியான தேதி' },
  tentative: { en: 'Tentative', ta: 'தற்காலிகம்' },
  date: { en: 'Event date', ta: 'நிகழ்வுத் தேதி' },
  approxDate: { en: 'Approximate date', ta: 'தோராயமான தேதி' },
  time: { en: 'Start time', ta: 'தொடக்க நேரம்' },
  timeHint: { en: 'Muhurtham or first ritual', ta: 'முகூர்த்தம் அல்லது முதல் சடங்கு' },
  tentativeHint: {
    en: 'We will hold the month and confirm the exact date with you on our call.',
    ta: 'அந்த மாதத்தை உங்களுக்காக ஒதுக்கி வைத்து, அழைப்பின்போது சரியான தேதியை உறுதிசெய்வோம்.',
  },
  daysAway: { en: 'days away', ta: 'நாட்கள் உள்ளன' },
  today: { en: 'Today', ta: 'இன்று' },
  next: { en: 'Continue to package', ta: 'தொகுப்புக்குத் தொடர்க' },
  needAddress: { en: 'Add the venue address', ta: 'இட முகவரியைச் சேர்க்கவும்' },
  needDate: { en: 'pick a date', ta: 'தேதியைத் தேர்ந்தெடுக்கவும்' },
  and: { en: ' and ', ta: ', ' },
  toContinue: { en: ' to continue', ta: ' — பின் தொடரலாம்' },
}

export default function Venue() {
  return (
    <StepGuard step={2}>
      <VenueStep />
    </StepGuard>
  )
}

function VenueStep() {
  const lang = useLang()
  const t = useT(copy)
  useTitle({ en: 'Book · Venue & date', ta: 'பதிவு · இடம் & தேதி' })
  const draft = useStore(s => s.draft)
  const updateDraft = useStore(s => s.updateDraft)
  const navigate = useNavigate()

  const missing: string[] = []
  if (!draft.venueAddress.trim()) missing.push(t.needAddress)
  if (!draft.date) missing.push(missing.length ? t.needDate : t.needDate.charAt(0).toUpperCase() + t.needDate.slice(1))
  const hint = missing.length ? missing.join(t.and) + t.toContinue : undefined

  return (
    <div>
      <StepHeader step={2} title={t.title} lead={t.lead} />

      <SubHeading index="i." title={t.venueType} />
      <VenueStage value={draft.venueType} onChange={v => updateDraft({ venueType: v })} />
      {lang === 'ta' && <TempleBorder className="mt-4 opacity-70" />}

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="ii." title={t.address} note={t.addressNote} />
      <Reveal className="space-y-4">
        <VenueSearch />
        <VenuePin />
      </Reveal>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Reveal className="space-y-5">
          <Field
            label={`${draft.venueType === 'home' ? t.homeName : t.mahalName} · ${t.optional}`}
            value={draft.venueName}
            onChange={v => updateDraft({ venueName: v })}
            placeholder={draft.venueType === 'home' ? t.homeNamePh : t.mahalNamePh}
            icon={draft.venueType === 'home' ? 'home' : 'building'}
            maxLength={80}
          />
          <Field label={t.fullAddress} value={draft.venueAddress} onChange={v => updateDraft({ venueAddress: v })} placeholder={t.addressPh} icon="mapPin" rows={3} required maxLength={240} />
        </Reveal>
        <Reveal delay={0.1}>
          <DistanceMeter />
        </Reveal>
      </div>

      <Ornament className="my-10 md:my-14" />

      <SubHeading index="iii." title={t.when} note={t.whenNote} />
      <DateTime />

      <StepNav back="/book/event" onNext={() => navigate('/book/package')} nextLabel={t.next} disabled={!!hint} hint={hint} />
    </div>
  )
}

// ─── Venue search: type-ahead like the Google Maps box ───────────────────────

function VenueSearch() {
  const t = useT(copy)
  const district = useStore(s => s.draft.district)
  const venueType = useStore(s => s.draft.venueType)
  const updateDraft = useStore(s => s.updateDraft)
  const lenis = useLenis()
  const id = useId()
  const listId = `${id}-list`
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Suggestion[]>([])
  const [searched, setSearched] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  // The text a pick wrote into the box, so it does not search itself again.
  const picked = useRef('')

  // Short debounce so suggestions follow the typing; each keystroke aborts the request before it.
  useEffect(() => {
    const text = q.trim()
    if (text.length < 2 || text === picked.current) {
      setResults([])
      setSearched('')
      setLoading(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    const timer = window.setTimeout(() => {
      suggestPlaces(text, districtCentre(district), ctrl.signal).then(found => {
        if (ctrl.signal.aborted) return
        setResults(found)
        setSearched(text)
        setActive(found.length ? 0 : -1)
        setLoading(false)
      })
    }, 220)
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [q, district])

  const pick = async (s: Suggestion) => {
    picked.current = s.name
    setQ(s.name)
    setOpen(false)
    setResults([])
    const p = await resolveSuggestion(s)
    const full = [s.name, p?.address ?? s.address].filter(Boolean).join(', ')
    // A home's "name" field is the family's, so the place goes into the address there.
    updateDraft({
      ...(p ? { venueCoords: { lat: p.lat, lng: p.lng } } : {}),
      ...(venueType === 'home' ? { venueAddress: full } : { venueName: s.name, venueAddress: (p?.address ?? s.address) || s.name }),
    })
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return
      e.preventDefault()
      setOpen(true)
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive(a => (a + step + results.length) % results.length)
    } else if (e.key === 'Enter') {
      if (open && results[Math.max(0, active)]) {
        e.preventDefault()
        void pick(results[Math.max(0, active)])
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
        setActive(-1)
      }
    }
  }

  const showList = open && q.trim().length >= 2 && searched !== '' && (searched === q.trim() || results.length > 0)
  const status = loading ? t.searching : showList ? (results.length ? `${results.length} ${t.found}` : t.noResults) : ''

  /** Bold the part of the name that matches what was typed, as Google does. */
  const mark = (name: string) => {
    const i = name.toLowerCase().indexOf(q.trim().toLowerCase())
    if (i < 0 || !q.trim()) return name
    const n = q.trim().length
    return (
      <>
        {name.slice(0, i)}
        <span className="font-semibold">{name.slice(i, i + n)}</span>
        {name.slice(i + n)}
      </>
    )
  }

  return (
    <div>
      <label htmlFor={id} className="t-label mb-2 flex items-center gap-1 text-ink/55">{t.search}</label>
      <div className="relative">
        <Icon name="search" size={17} className="pointer-events-none absolute left-4 top-[17px] text-ink/35" />
        <input
          id={id}
          type="search"
          role="combobox"
          aria-expanded={showList && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={q}
          onChange={e => {
            picked.current = ''
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={e => {
            setOpen(true)
            // Phones: lift the box under the nav so the results have room above the keyboard.
            if (!window.matchMedia('(max-width: 767px)').matches) return
            const box = e.currentTarget
            window.setTimeout(() => {
              if (lenis) lenis.scrollTo(box, { offset: -110 })
              else box.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 250)
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKey}
          placeholder={t.searchPh}
          enterKeyHint="search"
          autoCorrect="off"
          maxLength={120}
          className="h-[54px] w-full rounded-full border border-ink/10 bg-white pl-11 pr-11 text-base text-ink shadow-soft outline-none transition-all duration-200 placeholder:text-ink/35 focus:border-ruby focus:ring-4 focus:ring-ruby/10 md:text-[15px]"
        />
        {loading && <span className="absolute right-4 top-[19px] h-4 w-4 animate-spin rounded-full border-2 border-ruby/25 border-t-ruby" aria-hidden="true" />}
        {showList && (
          <div className="absolute inset-x-0 top-full z-[600] mt-2 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
            {results.length > 0 ? (
              <ul id={listId} role="listbox" aria-label={t.results} data-lenis-prevent className="max-h-[44vh] overflow-y-auto overscroll-contain py-1.5 sm:max-h-80">
                {results.map((p, i) => (
                  <li
                    key={p.id}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    // mousedown, so the pick lands before the input's blur closes the list
                    onMouseDown={e => {
                      e.preventDefault()
                      void pick(p)
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2.5 ${i === active ? 'bg-ink/[0.04]' : ''}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.06]">
                      <Icon name="mapPin" size={15} className="text-ink/55" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] text-ink">{mark(p.name)}</span>
                      {p.address && <span className="block truncate text-[12px] text-ink/50">{p.address}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-[13px] leading-snug text-ink/60">{t.noResults}</p>
            )}
            <p className="border-t border-ink/[0.06] px-4 py-2 text-right text-[10.5px] text-ink/45">
              {hasGooglePlaces() ? (
                t.google
              ) : (
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" onMouseDown={e => e.preventDefault()} className="hover:text-ruby">{t.osm}</a>
              )}
            </p>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink/45">{t.searchHint}</p>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  )
}

// ─── Map: drop or drag the pin, or "Use my location" ─────────────────────────

function VenuePin() {
  const t = useT(copy)
  const { venueName, venueAddress, venueCoords, district } = useStore(s => s.draft)
  const updateDraft = useStore(s => s.updateDraft)
  const [locating, setLocating] = useState(false)
  const [failed, setFailed] = useState<'denied' | 'other' | false>(false)
  const canLocate = typeof navigator !== 'undefined' && 'geolocation' in navigator
  // The address we wrote from a pin, so a later pin may replace it but never the customer's own typing.
  const autoAddress = useRef('')
  const reverse = useRef<AbortController | null>(null)

  /** Sets the pin, then fills the address from the nearest known place when the box is empty or ours. */
  const pinAt = (ll: LatLng) => {
    updateDraft({ venueCoords: ll })
    const current = useStore.getState().draft.venueAddress.trim()
    if (current && current !== autoAddress.current) return
    const fallback = `${t.pinnedAddress} · ${ll.lat}, ${ll.lng}`
    autoAddress.current = fallback
    updateDraft({ venueAddress: fallback })
    reverse.current?.abort()
    const ctrl = new AbortController()
    reverse.current = ctrl
    void reverseGeocode(ll, ctrl.signal).then(p => {
      if (!p || ctrl.signal.aborted || useStore.getState().draft.venueAddress !== autoAddress.current) return
      const text = [p.name, p.address].filter(Boolean).join(', ')
      autoAddress.current = text
      updateDraft({ venueAddress: text })
    })
  }

  const locate = () => {
    setFailed(false)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        pinAt({ lat: roundCoord(pos.coords.latitude), lng: roundCoord(pos.coords.longitude) })
        setLocating(false)
      },
      err => {
        setFailed(err.code === err.PERMISSION_DENIED ? 'denied' : 'other')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  // The pin wins over the typed address; the typed address gets the district for a better match.
  const query = venueCoords
    ? `${venueCoords.lat},${venueCoords.lng}`
    : venueAddress.trim().length > 6
      ? [venueName, venueAddress, district ? districtName(district, 'en') : ''].filter(Boolean).join(', ')
      : ''

  return (
    <div className="space-y-3">
      <PinMap value={venueCoords} center={districtCentre(district)} onPick={pinAt} label={t.mapTitle} className="h-[380px] w-full sm:h-[440px] lg:h-[500px]" />
      <div className="flex flex-wrap items-center gap-2">
        {canLocate && (
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink/10 bg-white/80 px-4 text-[13.5px] font-medium text-ink transition hover:border-ruby/40 hover:text-ruby disabled:opacity-60 cursor-pointer"
          >
            <Icon name="mapPin" size={15} className="text-ruby" />
            {locating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ruby/25 border-t-ruby" aria-hidden="true" /> : null}
            {locating ? t.locating : t.myLocation}
          </button>
        )}
        {venueCoords && (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ruby-soft px-3 text-[12.5px] font-medium text-ruby-deep">
            <Icon name="check" size={13} strokeWidth={2.4} />
            {t.pinned}
            <button type="button" onClick={() => updateDraft({ venueCoords: undefined })} aria-label={t.unpin} className="relative -mr-1 ml-0.5 flex h-6 w-6 items-center justify-center rounded-full before:absolute before:-inset-2.5 before:content-[''] hover:bg-ruby/10 cursor-pointer">
              <Icon name="x" size={12} />
            </button>
          </span>
        )}
        {query && (
          <a href={mapsLink(query)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 px-2 text-[12.5px] font-medium text-ink/55 hover:text-ruby">
            {t.openMaps}
            <Icon name="external" size={12} />
          </a>
        )}
      </div>
      {failed && (
        <p role="alert" className="flex items-start gap-2 text-[12.5px] leading-snug text-ink/60">
          <Icon name="info" size={14} className="mt-px shrink-0 text-ruby" />
          {failed === 'denied' ? t.deniedLocation : t.noLocation}
        </p>
      )}
    </div>
  )
}

// ─── Venue stage: glass toggle over a crossfading photo ──────────────────────

function VenueStage({ value, onChange }: { value: VenueType; onChange: (v: VenueType) => void }) {
  const lang = useLang()
  const t = useT(copy)
  const id = useId()
  const venue = VENUES.find(v => v.key === value) ?? VENUES[0]
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const next = value === 'home' ? 'mahal' : 'home'
    onChange(next)
    refs.current[VENUES.findIndex(v => v.key === next)]?.focus()
  }

  return (
    <Reveal>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[26px] bg-ink shadow-soft sm:aspect-[16/10] md:rounded-[32px]">
        {VENUES.map(v => (
          <motion.div
            key={v.key}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: v.key === value ? 1 : 0, scale: v.key === value ? 1 : 1.08 }}
            transition={{ duration: 1.1, ease: EASE }}
            aria-hidden={v.key !== value}
          >
            <LangImg pair={v.img} w={1200} sizes="(min-width: 1024px) 720px, 100vw" className="h-full w-full" />
          </motion.div>
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-ink/25" />

        {/* Info card */}
        <motion.div
          key={value + lang}
          initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="glass absolute left-3 top-3 max-w-[calc(100%-24px)] rounded-[22px] p-4 sm:left-5 sm:top-5 sm:max-w-[320px] sm:p-5"
        >
          {lang === 'ta' && <KolamCorner className="pointer-events-none absolute -right-1 -top-1 rotate-90 opacity-60" />}
          <p className="flex items-center gap-2 text-[11px] font-medium text-ink/55">
            <Icon name="users" size={13} className="text-ruby" />
            {value === 'home' ? t.homeCrowd : t.mahalCrowd}
          </p>
          <p className="t-3 mt-1.5 text-ink [overflow-wrap:anywhere]">{venue.name[lang]}</p>
          <p className="mt-1 text-[13px] leading-snug text-ink/60">{venue.note[lang]}</p>
          <p className="mt-3 text-[12.5px] font-semibold tabular-nums text-ruby">{venue.add ? `+${formatINR(venue.add)} · ${t.lightingKit}` : t.noSurcharge}</p>
        </motion.div>

        {/* Glass toggle */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-3 sm:bottom-6">
          <div role="radiogroup" aria-label={t.venueTypeLabel} onKeyDown={onKey} className="glass-dark relative flex w-full max-w-[360px] rounded-full p-1.5">
            {VENUES.map((v, i) => {
              const active = v.key === value
              return (
                <button
                  key={v.key}
                  ref={el => {
                    refs.current[i] = el
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => onChange(v.key)}
                  className={`relative z-10 flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 text-[14px] font-medium transition-colors duration-300 cursor-pointer ${active ? 'text-ink' : 'text-white/75 hover:text-white'}`}
                >
                  {active && (
                    <motion.span
                      layoutId={`venue-thumb-${id}`}
                      className="absolute inset-0 -z-10 rounded-full bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_20px_-6px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    />
                  )}
                  <Icon name={v.key === 'home' ? 'home' : 'building'} size={17} className={active ? 'text-ruby' : ''} />
                  <span className="truncate">{v.name[lang]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Reveal>
  )
}

// ─── Distance meter ──────────────────────────────────────────────────────────

const SCALE_KM = 80

function DistanceMeter() {
  const lang = useLang()
  const t = useT(copy)
  const reduce = useReducedMotion()
  const address = useStore(s => s.draft.venueAddress)
  const district = useStore(s => s.draft.district)
  const coords = useStore(s => s.draft.venueCoords)
  const km = useStore(s => s.draft.distanceKm)
  const updateDraft = useStore(s => s.updateDraft)

  // Straight line × 1.3 to the pin, or to the district's town centre without one.
  const target = address.trim() ? estimateDistanceKm(coords, district) : 0
  useEffect(() => {
    if (target !== km) updateDraft({ distanceKm: target })
  }, [target, km, updateDraft])

  const has = !!address.trim() && km > 0
  const far = km > TRAVEL_FREE_KM
  const surcharge = far ? Math.round(((km - TRAVEL_FREE_KM) * TRAVEL_PER_KM) / 100) * 100 : 0
  const pos = Math.min(1, km / SCALE_KM)
  const freePos = TRAVEL_FREE_KM / SCALE_KM

  const mv = useMotionValue(km)
  const kmText = useTransform(mv, v => Math.round(v).toString())
  useEffect(() => {
    if (reduce) return mv.set(km)
    const c = animate(mv, km, { duration: 1, ease: EASE })
    return () => c.stop()
  }, [km, mv, reduce])

  return (
    <div className="glass-ruby-tint relative h-full overflow-hidden rounded-[26px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-snug text-ink/70">
          {t.distTitle}
          {district && <span className="block text-ink/45">{districtName(district, lang)}</span>}
        </p>
        <Badge tone="white">{t.estimate}</Badge>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <motion.span className="font-display text-[3rem] font-semibold leading-none tabular-nums text-ink">{has ? kmText : '—'}</motion.span>
        <span className="text-ink/50">{t.km}</span>
      </div>

      {/* Meter */}
      <div className="relative mt-7" aria-hidden="true">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-white/80">
          <div className="absolute inset-y-0 left-0 bg-ink/[0.07]" style={{ width: `${freePos * 100}%` }} />
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-ink" initial={false} animate={{ width: `${(has ? Math.min(pos, freePos) : 0) * 100}%` }} transition={{ duration: 0.9, ease: EASE }} />
          <motion.div
            className="absolute inset-y-0 rounded-r-full bg-gradient-to-r from-ruby to-ruby-bright"
            style={{ left: `${freePos * 100}%` }}
            initial={false}
            animate={{ width: `${(has && far ? pos - freePos : 0) * 100}%` }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
          />
        </div>
        {/* 20 km marker */}
        <div className="absolute -top-1.5 h-5 w-px bg-ruby" style={{ left: `${freePos * 100}%` }} />
        {/* Venue pin */}
        <motion.div className="absolute -top-[26px] -translate-x-1/2" initial={false} animate={{ left: `${(has ? pos : 0) * 100}%`, opacity: has ? 1 : 0 }} transition={{ duration: 0.9, ease: EASE }}>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white shadow-md ${far ? 'bg-ruby' : 'bg-ink'}`}>
            <Icon name="mapPin" size={11} strokeWidth={2.2} />
          </span>
        </motion.div>
        <div className="relative mt-2 h-4 text-[10.5px] font-medium tabular-nums text-ink/45">
          <span className="absolute left-0">0</span>
          <span className="absolute -translate-x-1/2 whitespace-nowrap text-ruby" style={{ left: `${freePos * 100}%` }}>
            {t.freeZone}
          </span>
          <span className="absolute right-0">{SCALE_KM}+</span>
        </div>
      </div>

      <div className="mt-5 min-h-[2.6rem] text-[13px] leading-snug">
        {!address.trim() ? (
          <p className="text-ink/50">{t.enterAddress}</p>
        ) : !has ? (
          <p className="text-ink/50">{t.needPin}</p>
        ) : far ? (
          <p className="text-ink/75">
            <span className="font-semibold tabular-nums text-ruby">+{formatINR(surcharge)}</span> · {km - TRAVEL_FREE_KM} {t.km} {t.beyond} ({t.perKm})
          </p>
        ) : (
          <p className="flex items-start gap-1.5 font-medium text-ink/75">
            <Icon name="check" size={15} className="mt-0.5 text-ruby" strokeWidth={2.2} />
            {t.within}
          </p>
        )}
        {has && <p className="mt-1.5 text-[12px] text-ink/50">{coords ? t.fromPin : t.fromCentre.replace('{d}', districtName(district, lang))}</p>}
      </div>
      <p className="mt-4 border-t border-ruby/10 pt-3 text-[11px] leading-relaxed text-ink/45">{t.distNote}</p>
    </div>
  )
}

// ─── Date & time ─────────────────────────────────────────────────────────────


function DateTime() {
  const lang = useLang()
  const t = useT(copy)
  const draft = useStore(s => s.draft)
  const updateDraft = useStore(s => s.updateDraft)
  const min = earliestEventISO()
  const today = todayISO()
  const tentative = draft.dateCertainty === 'tentative'
  const days = draft.date ? Math.round((new Date(draft.date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 864e5) : null

  // A date saved before the lead time came in (or an old draft) is too soon now: ask again.
  useEffect(() => {
    if (draft.date && draft.date < min) updateDraft({ date: '' })
  }, [draft.date, min, updateDraft])

  return (
    <Reveal>
      <div className="rounded-[28px] border hairline bg-white/70 p-5 shadow-soft sm:p-7">
        <Segmented
          value={draft.dateCertainty}
          onChange={v => updateDraft({ dateCertainty: v })}
          options={[
            { value: 'exact', label: t.exact },
            { value: 'tentative', label: t.tentative },
          ]}
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="flex flex-col">
            <p className="t-label mb-2 flex items-center gap-1 text-ink/55">
              <Icon name="calendar" size={14} className="text-ruby" />
              {tentative ? t.approxDate : t.date}
              <span className="text-ruby">*</span>
            </p>
            <DatePicker value={draft.date} onChange={d => updateDraft({ date: d && d < min ? min : d })} min={min} lang={lang} className="flex-1" />
            <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-ink/50">
              <Icon name="info" size={13} className="mt-px shrink-0 text-ruby" />
              {t.leadNote.replace('{d}', formatDate(min, lang, { day: 'numeric', month: 'long' }))}
            </p>
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="t-label mb-2 flex flex-wrap items-center gap-1 text-ink/55">
              <Icon name="clock" size={14} className="text-ruby" />
              {t.time}
              <span className="ml-auto text-[11px] font-medium normal-case tracking-normal text-ink/40">{t.timeHint}</span>
            </p>
            <TimePicker value={draft.time} onChange={time => updateDraft({ time })} lang={lang} />
            <motion.div
              key={draft.date + draft.time + draft.dateCertainty + lang}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className={`mt-4 flex flex-1 flex-col justify-center rounded-[22px] px-5 py-5 ${draft.date ? 'bg-gradient-to-br from-ruby-deep via-[#5c0c1a] to-ink text-white shadow-ruby' : 'border border-dashed border-ruby/25 text-ink/40'}`}
            >
              {draft.date ? (
                <>
                  <p className="t-label text-white/55">{tentative ? t.approxDate : t.date}</p>
                  <p className="mt-1.5 font-display text-[1.45rem] font-semibold leading-tight md:text-[1.6rem]">
                    {formatDate(draft.date, lang, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="mt-1 text-[14px] text-white/70">
                    {formatDate(draft.date, lang, { year: 'numeric' })}
                    {draft.time && <> · {new Date(`2000-01-01T${draft.time}:00`).toLocaleTimeString(lang === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' })}</>}
                  </p>
                  {days !== null && days >= 0 && <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[12.5px] font-medium">{days === 0 ? t.today : `${days} ${t.daysAway}`}</p>}
                </>
              ) : (
                <p className="text-center text-[13.5px]">{lang === 'ta' ? 'தேதியைத் தேர்ந்தெடுங்கள்' : 'Pick a date to see your booking day here'}</p>
              )}
            </motion.div>
          </div>
        </div>

        {tentative && <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-ink/55"><Icon name="info" size={15} className="mt-0.5 text-ruby" />{t.tentativeHint}</p>}
      </div>
    </Reveal>
  )
}
