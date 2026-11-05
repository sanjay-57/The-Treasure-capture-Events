import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '../../components/ui'
import { useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { PRODUCT } from '../brand'
import { useCurrentStudio, useStudioStore } from '../store'
import { StudioTheme } from '../theme'
import { BrandingForm, LangToggle, brandingOf, type BrandingDraft } from './shared'

const copy = {
  title: { en: 'Set up your studio', ta: 'உங்கள் ஸ்டுடியோவை அமையுங்கள்' },
  h: { en: 'Make it yours', ta: 'உங்களுடையதாக்குங்கள்' },
  sub: {
    en: 'Your clients see your name, logo and colour, never ours. You can change all of this later under Account.',
    ta: 'வாடிக்கையாளர்கள் உங்கள் பெயர், லோகோ, நிறத்தையே பார்ப்பார்கள், எங்களுடையதை அல்ல. இவை அனைத்தையும் பின்னர் கணக்கு பகுதியில் மாற்றலாம்.',
  },
  save: { en: 'Save and continue', ta: 'சேமித்துத் தொடர்' },
  needName: { en: 'Add your studio name', ta: 'ஸ்டுடியோ பெயரைச் சேர்க்கவும்' },
}

export default function Onboarding() {
  const t = useT(copy)
  useTitle(copy.title)
  const navigate = useNavigate()
  const studio = useCurrentStudio()
  const updateStudio = useStudioStore(s => s.updateStudio)
  const [draft, setDraft] = useState<BrandingDraft | null>(studio ? brandingOf(studio) : null)

  if (!studio || !draft) return <Navigate to="/studio/login" replace />

  const save = () => {
    if (!draft.name.trim()) return toast(t.needName, 'ruby')
    updateStudio(studio.id, { ...draft, name: draft.name.trim(), watermark: draft.watermark.trim(), onboarded: true })
    navigate('/studio', { replace: true })
  }

  return (
    <StudioTheme studio={draft} className="min-h-[100svh] bg-[#f6f5f2]">
      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <span className="text-[14px] font-semibold text-ink">{PRODUCT.name}</span>
        <LangToggle />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 md:px-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink md:text-[34px]">{t.h}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/55">{t.sub}</p>
        <div className="mt-8 rounded-[26px] border border-ink/[0.08] bg-white p-5 md:p-8">
          <BrandingForm value={draft} onChange={setDraft} hideLogo />
          <div className="mt-8 flex justify-end">
            <Button onClick={save} icon="arrowRight">{t.save}</Button>
          </div>
        </div>
      </main>
    </StudioTheme>
  )
}
