import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { photoUrl, type ImgKey } from '../lib/images'

/*
 * Album cover materials drawn in CSS. Shared by the client album studio and
 * the booking cart's album configurator so both previews match.
 */

export const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170
}

const noise = (freq: number, alpha: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
  ).replace(/%2523/g, '%23')}")`
export const GRAIN = noise(0.9, 0.9)
const FIBRE = noise(2.2, 0.6)

function zari(band: string, motif: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='30'><rect width='24' height='30' fill='${band}'/><path d='M0 2.5h24M0 27.5h24' stroke='${motif}' stroke-width='1'/><path d='M0 23 L6 9 L12 23 L18 9 L24 23' fill='none' stroke='${motif}' stroke-width='1.3'/><circle cx='6' cy='19' r='1.4' fill='${motif}'/><circle cx='18' cy='19' r='1.4' fill='${motif}'/><circle cx='12' cy='7' r='1.1' fill='${motif}'/><circle cx='0' cy='7' r='1.1' fill='${motif}'/><circle cx='24' cy='7' r='1.1' fill='${motif}'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** The cover's material, drawn in CSS. Used for the big preview and the small swatches. */
export function Surface({ cover, hex, photo, children, mini = false }: { cover: string; hex: string; photo?: ImgKey; children?: ReactNode; mini?: boolean }) {
  const light = isLight(hex)
  const layer = 'pointer-events-none absolute inset-0'
  if (cover === 'acrylic') {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: hex }}>
        {photo && <img src={photoUrl(photo, mini ? 120 : 900)} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
        {!mini && <div className={`${layer} bg-gradient-to-t from-black/55 via-black/5 to-transparent`} />}
        <div className={layer} style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 24%, transparent 38%, transparent 72%, rgba(255,255,255,0.14) 100%)' }} />
        <div className={`${layer} rounded-[inherit]`} style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.55), inset 0 0 18px rgba(255,255,255,0.18)' }} />
        {children}
      </div>
    )
  }

  const base: CSSProperties = { background: hex }
  return (
    <div className="absolute inset-0 overflow-hidden" style={base}>
      {cover === 'leather' && (
        <>
          <div className={layer} style={{ backgroundImage: GRAIN, backgroundSize: mini ? '90px' : '160px', mixBlendMode: light ? 'multiply' : 'soft-light', opacity: light ? 0.18 : 0.55 }} />
          <div className={layer} style={{ background: 'radial-gradient(120% 90% at 25% 15%, rgba(255,255,255,0.16), transparent 55%)' }} />
          {!mini && <div className="pointer-events-none absolute inset-[12px] rounded-[3px] border border-dashed" style={{ borderColor: light ? 'rgba(10,10,11,0.22)' : 'rgba(255,255,255,0.28)' }} />}
        </>
      )}
      {cover === 'velvet' && (
        <>
          <div className={layer} style={{ backgroundImage: FIBRE, backgroundSize: '120px', mixBlendMode: 'soft-light', opacity: 0.5 }} />
          <div className={layer} style={{ background: 'radial-gradient(ellipse 70% 60% at var(--mx, 35%) var(--my, 30%), rgba(255,255,255,0.28), transparent 60%)', mixBlendMode: 'soft-light' }} />
          <div className={layer} style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.32))' }} />
        </>
      )}
      {cover === 'linen' && (
        <>
          <div
            className={layer}
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${light ? 0.07 : 0.16}) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,${light ? 0.35 : 0.07}) 0 1px, transparent 1px 3px)`,
            }}
          />
          <div className={layer} style={{ backgroundImage: GRAIN, backgroundSize: '200px', mixBlendMode: 'multiply', opacity: 0.08 }} />
        </>
      )}
      {cover === 'silk' && <SilkLayers hex={hex} mini={mini} />}
      {children}
    </div>
  )
}

function SilkLayers({ hex, mini }: { hex: string; mini: boolean }) {
  const redBase = hex === '#9e1233' || hex === '#5a0a1c'
  const band = redBase ? '#ffffff' : '#9b111e'
  const motif = redBase ? '#9e1233' : '#ffffff'
  const bandH = mini ? 8 : 30
  return (
    <>
      {/* buttas across the body */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${isLight(hex) ? 'rgba(155,17,30,0.35)' : 'rgba(255,255,255,0.28)'} 1.1px, transparent 1.6px)`, backgroundSize: mini ? '8px 8px' : '22px 22px' }} />
      {/* moving silk sheen */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.22) 48%, transparent 64%)', backgroundSize: '250% 100%' }}
        animate={{ backgroundPosition: ['100% 0%', '0% 0%'] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      {/* zari borders */}
      <div className="pointer-events-none absolute inset-x-0 top-[7%]" style={{ height: bandH, backgroundImage: zari(band, motif), backgroundSize: `${(bandH / 30) * 24}px ${bandH}px` }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-[7%] scale-y-[-1]" style={{ height: bandH, backgroundImage: zari(band, motif), backgroundSize: `${(bandH / 30) * 24}px ${bandH}px` }} />
    </>
  )
}
