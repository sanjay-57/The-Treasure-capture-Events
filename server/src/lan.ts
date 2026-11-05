import os from 'node:os'
import QRCode from 'qrcode'

/** Loopback and private ranges: 127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7, fe80::/10. */
export function isPrivate(ip: string | undefined): boolean {
  if (!ip) return false
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(v4)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)
  }
  const l = ip.toLowerCase()
  return l === '::1' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80')
}

/** http://<ip>:<port> for every Wi-Fi / Ethernet address of this laptop. */
export function lanUrls(port: number): string[] {
  const out: string[] = []
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list ?? []) if (a.family === 'IPv4' && !a.internal && isPrivate(a.address)) out.push(`http://${a.address}:${port}`)
  }
  return out
}

export async function banner(port: number, admin?: { name: string; password?: string }): Promise<string> {
  const urls = lanUrls(port)
  const lines = ['', '  The Treasure Capture · LAN server', `  This laptop:  http://localhost:${port}`]
  for (const u of urls) lines.push(`  Wi-Fi:        ${u}`)
  if (!urls.length) lines.push('  Wi-Fi:        not connected (only this laptop can open the site)')
  if (admin?.password) lines.push('', `  First admin login → name: ${admin.name}  password: ${admin.password}`, '  (shown once; new one any time: npm --prefix server run admin -- password)')
  if (urls[0]) lines.push('', '  Scan to open on a phone:', await QRCode.toString(urls[0], { type: 'terminal', small: true }))
  return lines.join('\n')
}
