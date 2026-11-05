import type { ReactNode } from 'react'
import { useProofSrc } from '../blobs'
import type { Proof } from '../types'

/** Square-ish proof tile with the original filename; children render over the image. */
export function ProofThumb({ proof, children, className = '' }: { proof: Proof; children?: ReactNode; className?: string }) {
  const src = useProofSrc(proof, 'thumb')
  return (
    <figure className={`group relative overflow-hidden rounded-xl bg-ink/[0.05] ${className}`}>
      <div className="aspect-square">
        {src ? <img src={src} alt={proof.filename} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[11px] text-ink/35">{proof.ext}</div>}
      </div>
      <figcaption className="truncate px-1.5 py-1 text-[11px] text-ink/60" title={`${proof.filename}.${proof.ext}`}>
        {proof.filename}
        <span className="text-ink/35">.{proof.ext}</span>
      </figcaption>
      {children}
    </figure>
  )
}
