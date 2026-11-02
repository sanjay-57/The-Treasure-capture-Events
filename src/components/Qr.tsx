import { useMemo } from 'react'
import QRCode from 'qrcode'

/** Module rows of a QR code: `true` is a dark module. */
export function qrModules(text: string): boolean[][] {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
  return Array.from({ length: modules.size }, (_, y) => Array.from({ length: modules.size }, (_, x) => !!modules.get(x, y)))
}

/** QR code as a crisp inline SVG, in any colour, with the 4-module quiet zone scanners expect. */
export function Qr({ text, size = 160, color = '#0a0a0b', background = '#ffffff', label, className = '' }: { text: string; size?: number; color?: string; background?: string; label: string; className?: string }) {
  const { n, d } = useMemo(() => {
    const rows = qrModules(text)
    let path = ''
    rows.forEach((row, y) => row.forEach((on, x) => { if (on) path += `M${x + 4} ${y + 4}h1v1h-1z` }))
    return { n: rows.length + 8, d: path }
  }, [text])
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} role="img" aria-label={label} className={className} shapeRendering="crispEdges">
      <rect width={n} height={n} fill={background} />
      <path d={d} fill={color} />
    </svg>
  )
}
