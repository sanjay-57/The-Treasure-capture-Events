import { useMemo } from 'react'
import { InviteBuilder } from '../../components/InviteBuilder'
import { useT } from '../../lib/i18n'
import { useMyOrder, useStore, type Order } from '../../lib/store'
import { useTitle } from '../../lib/ui'
import { premiumUnlocked, splitCouple, type InviteDraft } from '../../lib/invite'
import { PageIntro } from './shared'

const copy = {
  eyebrow: { en: 'Your e-invite', ta: 'உங்கள் மின் அழைப்பிதழ்' },
  title: { en: 'Make your wedding invite', ta: 'உங்கள் திருமண அழைப்பிதழை உருவாக்குங்கள்' },
  lead: {
    en: 'Fill in the names, day and venue, pick a design and send the link on WhatsApp. Guests get a countdown, the map, directions and an RSVP button. The default designs are free.',
    ta: 'பெயர், நாள், மண்டபம் சேர்த்து, வடிவத்தைத் தேர்வு செய்து, இணைப்பை WhatsApp-ல் அனுப்புங்கள். விருந்தினருக்கு நேரக் கணக்கு, வரைபடம், வழி, வருகை சொல்லும் பொத்தான் எல்லாம் கிடைக்கும். இயல்பு வடிவங்கள் இலவசம்.',
  },
  ask: { en: 'Ask the studio to add it', ta: 'சேர்க்க ஸ்டுடியோவிடம் கேளுங்கள்' },
}

export default function DashInvite() {
  useTitle({ en: 'E-invite', ta: 'அழைப்பிதழ்' })
  const order = useMyOrder()
  if (!order) return null
  return <InviteInner order={order} />
}

function InviteInner({ order }: { order: Order }) {
  const t = useT(copy)
  const wa = useStore(s => s.cms.studio.whatsapp).replace(/\D/g, '')
  const premium = premiumUnlocked(order.cart.items)

  // Prefill from the order; the couple's own draft on this device wins once they type.
  const initial = useMemo<Partial<InviteDraft>>(() => {
    const [bride, groom] = splitCouple(order.client.name)
    return {
      brideEn: bride,
      groomEn: groom,
      date: order.date,
      time: order.time,
      venue: order.venueName,
      address: order.venueAddress,
      pin: order.venueCoords ? `${order.venueCoords.lat}, ${order.venueCoords.lng}` : '',
      phone: order.client.contact,
      theme: premium ? 'lantern' : 'ivory',
    }
  }, [order, premium])

  const ask = encodeURIComponent(`Hi! Please add the premium e-invite with caricature to my order ${order.id}.`)

  return (
    <div>
      <PageIntro eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
      <InviteBuilder initial={initial} premium={premium} storageKey={order.id} unlock={{ label: t.ask, href: `https://wa.me/${wa}?text=${ask}` }} />
    </div>
  )
}
