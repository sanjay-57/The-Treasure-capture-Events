import { useLang, useT, type Bi } from '../../../lib/i18n'
import { FAITHS, type Faith } from '../../../lib/poses'
import { useStore, type Order } from '../../../lib/store'
import { useOsStore } from '../../../saas/os/store'
import type { Project, WorkStage } from '../../../saas/os/types'
import { WorkStepper } from '../../../saas/os/WorkStepper'
import { DEFAULT_FEATURES, type FeatureFlags, type PickerVersion } from '../../../saas/types'
import { useProofingVersion } from '../../dashboard/proofing'
import { FormSelect, Panel, Switch, TextInput } from '../kit'

const copy = {
  title: { en: 'Customer settings', ta: 'வாடிக்கையாளர் அமைப்புகள்' },
  sub: { en: 'Saves as you change it.', ta: 'மாற்றியவுடன் சேமிக்கப்படும்.' },
  theme: { en: 'Theme', ta: 'தீம்' },
  themePh: { en: 'e.g. Chettinad traditional', ta: 'எ.கா. செட்டிநாடு பாரம்பரியம்' },
  religion: { en: 'Religion (sets the ritual poses)', ta: 'மதம் (சடங்கு போஸ்களைத் தீர்மானிக்கும்)' },
  none: { en: 'None', ta: 'இல்லை' },
  features: { en: 'Features', ta: 'வசதிகள்' },
  gallery: { en: 'Album selection gallery', ta: 'ஆல்பம் தேர்வு காட்சியகம்' },
  poses: { en: 'Pose chooser', ta: 'போஸ் தேர்வு' },
  invite: { en: 'E-invite', ta: 'அழைப்பிதழ்' },
  portal: { en: 'Client portal', ta: 'வாடிக்கையாளர் தளம்' },
  picker: { en: 'Photo picker', ta: 'படத் தேர்வு முறை' },
  inherit: { en: 'Studio default', ta: 'ஸ்டுடியோ இயல்புநிலை' },
  normal: { en: 'Grid with hearts', ta: 'இதயக் குறியுடன் கட்டம்' },
  swipe: { en: 'Grid plus swipe light table', ta: 'கட்டம் + ஸ்வைப் லைட் டேபிள்' },
  pickerOrderNote: { en: 'Demo: one switch for every client dashboard in this browser until the backend stores it per order.', ta: 'டெமோ: பின்தளம் வரும் வரை இந்த உலாவியின் அனைத்து டாஷ்போர்டுகளுக்கும் ஒரே அமைப்பு.' },
  stage: { en: 'Work progress', ta: 'வேலை முன்னேற்றம்' },
} satisfies Record<string, Bi>

/** One shape for TTC orders and photographers' projects. `null` clears a value. */
export interface ControlsPatch {
  theme?: string
  religion?: Faith | null
  features?: Partial<FeatureFlags>
  picker?: PickerVersion | null
  stage?: WorkStage
}

export interface ControlsValue {
  theme: string
  religion?: Faith
  features: FeatureFlags
  /** undefined = inherit (projects only). */
  picker?: PickerVersion
  /** Picker the customer gets when `picker` is undefined; omit to hide the "Studio default" option. */
  inheritedPicker?: PickerVersion
  /** Omit to hide the stepper (orders have their own status). */
  stage?: WorkStage
  /** Which feature switches apply. */
  featureKeys: (keyof FeatureFlags)[]
  pickerNote?: string
}

/** Theme, religion, feature switches, picker version and work stage for one customer. */
export function CustomerControls({ value, onChange }: { value: ControlsValue; onChange: (p: ControlsPatch) => void }) {
  const t = useT(copy)
  const lang = useLang()
  const inherit = value.inheritedPicker
  type PickerOpt = PickerVersion | 'inherit'
  const pickerOpts: { value: PickerOpt; label: string }[] = [
    ...(inherit ? [{ value: 'inherit' as const, label: `${t.inherit} (${inherit === 'swipe' ? t.swipe : t.normal})` }] : []),
    { value: 'normal', label: t.normal },
    { value: 'swipe', label: t.swipe },
  ]
  return (
    <Panel title={t.title} subtitle={t.sub} icon="sparkle">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label={t.theme} value={value.theme} onChange={v => onChange({ theme: v })} placeholder={t.themePh} />
          <FormSelect<Faith | ''>
            label={t.religion}
            value={value.religion ?? ''}
            onChange={v => onChange({ religion: v || null })}
            options={[{ value: '', label: t.none }, ...FAITHS.map(f => ({ value: f.key, label: f.label[lang] }))]}
          />
        </div>
        <div>
          <p className="t-label mb-3 text-ink/50">{t.features}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {value.featureKeys.map(k => (
              <label key={k} className="flex cursor-pointer items-center gap-3">
                <Switch checked={value.features[k]} onChange={v => onChange({ features: { [k]: v } })} label={t[k]} />
                <span className="text-[14px] text-ink">{t[k]}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <FormSelect<PickerOpt> label={t.picker} value={value.picker ?? 'inherit'} onChange={v => onChange({ picker: v === 'inherit' ? null : v })} options={pickerOpts} />
          {value.pickerNote && <p className="mt-1.5 text-[12px] text-ink/45">{value.pickerNote}</p>}
        </div>
        {value.stage && (
          <div>
            <p className="t-label mb-3 text-ink/50">{t.stage}</p>
            <WorkStepper stage={value.stage} onSet={s => onChange({ stage: s })} />
          </div>
        )}
      </div>
    </Panel>
  )
}

/** Adapter: a photographer's customer (Project). Picker override is TTC-only. */
export function ProjectControls({ project, studioPicker }: { project: Project; studioPicker: PickerVersion }) {
  const apply = (p: ControlsPatch) => {
    const os = useOsStore.getState()
    if (p.theme !== undefined) os.setTheme(project.id, p.theme)
    if (p.religion !== undefined) os.setReligion(project.id, p.religion ?? undefined)
    if (p.features) os.setFeatures(project.id, p.features)
    if (p.picker !== undefined) os.updateProject(project.id, { pickerOverride: p.picker ?? undefined })
    if (p.stage) os.setStage(project.id, p.stage)
  }
  return (
    <CustomerControls
      value={{
        theme: project.theme ?? '',
        religion: project.religion,
        features: { ...DEFAULT_FEATURES, ...project.features },
        picker: project.pickerOverride,
        inheritedPicker: studioPicker,
        stage: project.stage ?? 'booked',
        featureKeys: ['gallery', 'poses', 'invite', 'portal'],
      }}
      onChange={apply}
    />
  )
}

/** Adapter: TTC's own order. Picker writes the dashboard proofing version; no stage (orders have status). */
export function OrderControls({ order }: { order: Order }) {
  const t = useT(copy)
  const version = useProofingVersion(s => s.version)
  const setVersion = useProofingVersion(s => s.setVersion)
  const apply = (p: ControlsPatch) => {
    const { setOrderTheme, setOrderReligion, setOrderFeatures } = useStore.getState()
    if (p.theme !== undefined) setOrderTheme(order.id, p.theme)
    if (p.religion !== undefined) setOrderReligion(order.id, p.religion ?? undefined)
    if (p.features) setOrderFeatures(order.id, p.features)
    if (p.picker) setVersion(p.picker === 'swipe' ? 2 : 1)
  }
  return (
    <CustomerControls
      value={{
        theme: order.theme ?? '',
        religion: order.religion,
        features: { ...DEFAULT_FEATURES, ...order.features },
        picker: version === 2 ? 'swipe' : 'normal',
        featureKeys: ['gallery', 'poses', 'invite'],
        pickerNote: t.pickerOrderNote,
      }}
      onChange={apply}
    />
  )
}
