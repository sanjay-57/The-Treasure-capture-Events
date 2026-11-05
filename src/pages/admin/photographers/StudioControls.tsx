import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../../components/Icon'
import { formatDate, useLang, useT, type Bi } from '../../../lib/i18n'
import { toast } from '../../../lib/ui'
import { useOsStore } from '../../../saas/os/store'
import { STAGE_LABEL } from '../../../saas/os/WorkStepper'
import { useStudioStore } from '../../../saas/store'
import { StatusBadge } from '../../../saas/studio/shared'
import { DEFAULT_FEATURES, type FeatureFlags, type PickerVersion, type Studio } from '../../../saas/types'
import { FormSelect, Panel, Switch } from '../kit'

const copy = {
  controls: { en: 'Controls', ta: 'கட்டுப்பாடுகள்' },
  controlsSub: { en: 'Only TTC sets these. Saves at once.', ta: 'TTC மட்டும் அமைக்கும். உடனே சேமிக்கப்படும்.' },
  picker: { en: 'Photo picker for their customers', ta: 'அவர்களின் வாடிக்கையாளர்களுக்கான படத் தேர்வு முறை' },
  normal: { en: 'Grid with hearts', ta: 'இதயக் குறியுடன் கட்டம்' },
  swipe: { en: 'Grid plus swipe light table', ta: 'கட்டம் + ஸ்வைப் லைட் டேபிள்' },
  defaults: { en: 'New customers get', ta: 'புதிய வாடிக்கையாளர்களுக்கு' },
  gallery: { en: 'Album selection gallery', ta: 'ஆல்பம் தேர்வு காட்சியகம்' },
  poses: { en: 'Pose chooser', ta: 'போஸ் தேர்வு' },
  invite: { en: 'Invite card on the portal', ta: 'தளத்தில் அழைப்பிதழ் அட்டை' },
  portal: { en: 'Client portal', ta: 'வாடிக்கையாளர் தளம்' },
  banner: { en: '"Sign up as a photographer" banner on their portal', ta: 'அவர்கள் தளத்தில் "புகைப்படக் கலைஞராகப் பதிவு" பட்டை' },
  bannerHint: { en: 'Off by default: customer pages carry the studio brand only.', ta: 'இயல்பாக அணைப்பு: வாடிக்கையாளர் பக்கங்களில் ஸ்டுடியோ பிராண்ட் மட்டும்.' },
  saved: { en: 'Saved', ta: 'சேமிக்கப்பட்டது' },
  customers: { en: 'Customers', ta: 'வாடிக்கையாளர்கள்' },
  customersSub: { en: 'Their projects. Open one to change its settings.', ta: 'அவர்களின் திட்டங்கள். அமைப்புகளை மாற்றத் திறக்கவும்.' },
  none: { en: 'No customers yet.', ta: 'இன்னும் வாடிக்கையாளர் இல்லை.' },
  noGallery: { en: 'No gallery', ta: 'காட்சியகம் இல்லை' },
  off: { en: 'off', ta: 'அணைப்பு' },
  swipeShort: { en: 'swipe', ta: 'ஸ்வைப்' },
} satisfies Record<string, Bi>

const FEATURE_KEYS: (keyof FeatureFlags)[] = ['gallery', 'poses', 'invite', 'portal']

/** Picker version, feature defaults and portal banner: the studio-level switches only TTC holds. */
export function ControlsPanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const update = useStudioStore(s => s.updateStudio)
  const f: FeatureFlags = { ...DEFAULT_FEATURES, ...studio.featureDefaults }
  const save = (patch: Partial<Studio>) => {
    update(studio.id, patch)
    toast(t.saved)
  }
  return (
    <Panel title={t.controls} subtitle={t.controlsSub} icon="settings">
      <div className="space-y-5">
        <FormSelect<PickerVersion>
          label={t.picker}
          value={studio.pickerVersion ?? 'normal'}
          onChange={v => save({ pickerVersion: v })}
          options={[{ value: 'normal', label: t.normal }, { value: 'swipe', label: t.swipe }]}
        />
        <div>
          <p className="t-label mb-3 text-ink/50">{t.defaults}</p>
          <div className="space-y-3">
            {FEATURE_KEYS.map(k => (
              <label key={k} className="flex cursor-pointer items-center gap-3">
                <Switch checked={f[k]} onChange={v => save({ featureDefaults: { ...f, [k]: v } })} label={t[k]} />
                <span className="text-[14px] text-ink">{t[k]}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3">
          <Switch checked={!!studio.portalBanner} onChange={v => save({ portalBanner: v })} label={t.banner} />
          <span>
            <span className="block text-[14px] text-ink">{t.banner}</span>
            <span className="mt-0.5 block text-[12px] text-ink/45">{t.bannerHint}</span>
          </span>
        </label>
      </div>
    </Panel>
  )
}

/** This studio's projects with stage, features, picker and gallery status. Rows open CustomerDetail. */
export function CustomersPanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const lang = useLang()
  const projects = useOsStore(s => s.projects)
  const events = useStudioStore(s => s.events)
  const mine = useMemo(() => projects.filter(p => p.studioId === studio.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [projects, studio.id])
  return (
    <Panel title={`${t.customers} · ${mine.length}`} subtitle={t.customersSub} icon="users" bodyClass="p-0">
      {!mine.length ? (
        <p className="px-5 py-6 text-[13.5px] text-ink/45 md:px-6">{t.none}</p>
      ) : (
        <ul className="divide-y divide-ink/[0.06]">
          {mine.map(p => {
            const ev = p.galleryEventId ? events.find(e => e.id === p.galleryEventId && e.studioId === studio.id) : undefined
            const date = p.events.map(e => e.date).filter(Boolean).sort()[0]
            const off = FEATURE_KEYS.filter(k => p.features?.[k] === false)
            const picker = p.pickerOverride ?? studio.pickerVersion ?? 'normal'
            return (
              <li key={p.id}>
                <Link to={`/admin/photographers/${studio.id}/customers/${p.code}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 hover:bg-ink/[0.02] md:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{p.name}</p>
                    <p className="truncate text-[12px] text-ink/45">
                      {date ? formatDate(date, lang) : '—'} · {STAGE_LABEL[p.stage ?? 'booked'][lang]}
                      {off.length ? ` · ${off.map(k => t[k]).join(', ')} ${t.off}` : ''}
                      {picker === 'swipe' ? ` · ${t.swipeShort}` : ''}
                    </p>
                  </div>
                  {ev ? <StatusBadge status={ev.status} /> : <span className="text-[12px] text-ink/40">{t.noGallery}</span>}
                  <Icon name="chevronRight" size={16} className="text-ink/30" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
