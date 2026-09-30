import { EmptyState } from '../../components/ui'
import { useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { PageHeader } from './kit'

const copy = {
  eyebrow: { en: 'Invoices & payments', ta: 'ரசீதுகள் & கட்டணங்கள்' },
  title: { en: 'Billing', ta: 'கட்டணம்' },
  sub: { en: 'Create invoices, record offline payments and send receipts — all from the studio console.', ta: 'ரசீது உருவாக்கம், நேரடி கட்டணப் பதிவு, ஒப்புகை அனுப்புதல் — அனைத்தும் ஸ்டுடியோ நிர்வாகத்திலிருந்தே.' },
  soonTitle: { en: 'Billing is coming soon', ta: 'கட்டணப் பகுதி விரைவில்' },
  soonBody: { en: 'Until then, record payments from each order’s page.', ta: 'அதுவரை, ஒவ்வொரு ஆர்டர் பக்கத்திலிருந்தும் கட்டணங்களைப் பதிவு செய்யுங்கள்.' },
}

export default function Billing() {
  const t = useT(copy)
  useTitle({ en: 'Billing', ta: 'கட்டணம்' })
  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} />
      <EmptyState icon="rupee" title={t.soonTitle} body={t.soonBody} />
    </div>
  )
}
