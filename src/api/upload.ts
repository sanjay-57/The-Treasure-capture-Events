import { api } from './client'

/** Sends one browser-made preview + thumbnail to the server. The proof record is added by studio.addProofs. */
export async function uploadProofFiles(eventId: string, proofId: string, preview: Blob, thumb: Blob) {
  const form = new FormData()
  form.append('preview', preview, `${proofId}.jpg`)
  form.append('thumb', thumb, `${proofId}.t.jpg`)
  return api<{ url: string; thumbUrl: string; bytes: number }>(`/api/upload/proof/${eventId}/${proofId}`, { form })
}

/** CMS photos and logos. Returns a URL the site can use like any image URL. */
export async function uploadFile(file: Blob, name = 'file') {
  const form = new FormData()
  form.append('file', file, name)
  return api<{ url: string; bytes: number; type: string }>('/api/upload/file', { form })
}
