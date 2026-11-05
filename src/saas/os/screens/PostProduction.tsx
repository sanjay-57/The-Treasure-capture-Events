import { useTitle } from '../../../lib/ui'
import Events from '../../studio/Events'

const copy = {
  title: { en: 'Post Production', ta: 'பின்தயாரிப்பு' },
}

/** The album selection galleries. */
export default function PostProduction() {
  useTitle(copy.title)
  return <Events />
}
