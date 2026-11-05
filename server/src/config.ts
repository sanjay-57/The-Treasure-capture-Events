import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const SERVER_ROOT = path.resolve(here, '..')
export const REPO_ROOT = path.resolve(SERVER_ROOT, '..')

export interface Config {
  port: number
  host: string
  /** ':memory:' in tests. */
  dataDir: string
  distDir: string
  lanOnly: boolean
  /** Serve dist/ (lan:start). In dev, Vite serves the site and proxies /api here. */
  serveSite: boolean
  adminName: string
  adminPassword?: string
  backupDir?: string
  /** Print OTP codes to the console too. */
  logOtp: boolean
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  try {
    process.loadEnvFile(path.join(SERVER_ROOT, '.env'))
  } catch {
    // no .env: defaults
  }
  const prod = env.NODE_ENV === 'production'
  const dataDir = env.DATA_DIR ? path.resolve(SERVER_ROOT, env.DATA_DIR) : path.join(SERVER_ROOT, 'data')
  return {
    port: Number(env.PORT) || (prod ? 8080 : 8787),
    host: env.HOST || '0.0.0.0',
    dataDir,
    distDir: path.join(REPO_ROOT, 'dist'),
    lanOnly: env.LAN_ONLY !== 'false',
    serveSite: prod || env.SERVE_SITE === 'true',
    adminName: env.ADMIN_NAME || 'admin',
    adminPassword: env.ADMIN_PASSWORD || undefined,
    backupDir: env.BACKUP_DIR ? path.resolve(SERVER_ROOT, env.BACKUP_DIR) : undefined,
    logOtp: env.LOG_OTP !== 'false',
  }
}

export function testConfig(over: Partial<Config> = {}): Config {
  return { port: 0, host: '127.0.0.1', dataDir: ':memory:', distDir: '', lanOnly: true, serveSite: false, adminName: 'admin', adminPassword: 'test-pass-123', logOtp: false, ...over }
}
