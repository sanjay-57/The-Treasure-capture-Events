#!/usr/bin/env node
/*
 * Pre-renders the voice guide narration with Gemini TTS into public/voice/<clip>.<lang>.wav.
 *
 *   pnpm voice:check            one chat call + one Tamil TTS call, prints what came back
 *   pnpm voice:clips            render every clip in both languages (skips existing files)
 *   pnpm voice:clips --force    re-render everything (after changing a script or voice)
 *   pnpm voice:clips --lang=ta  only one language
 *   pnpm voice:voices           render the Tamil welcome in six voices to public/voice/samples
 *
 * Reads GEMINI_API_KEY or VITE_GEMINI_API_KEY from the environment or .env.local.
 * Needs Node 22+ (TypeScript imports are type-stripped; the pnpm scripts pass the flag).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/** WAV is ~1 MB per 20 s; ship AAC/MP3 instead (ffmpeg → .mp3, else macOS afconvert → .m4a). The player tries mp3, m4a, then wav. */
function compress(wavFile) {
  const has = (bin) => { try { execFileSync('which', [bin], { stdio: 'ignore' }); return true } catch { return false } }
  try {
    if (has('ffmpeg')) {
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', wavFile, '-codec:a', 'libmp3lame', '-b:a', '48k', '-ac', '1', wavFile.replace(/\.wav$/, '.mp3')])
      return 'mp3'
    }
    if (has('afconvert')) {
      execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '48000', wavFile, wavFile.replace(/\.wav$/, '.m4a')], { stdio: 'ignore' })
      return 'm4a'
    }
  } catch (e) {
    console.warn(`  could not compress ${path.basename(wavFile)}: ${e.message}`)
  }
  return null
}
const args = new Set(process.argv.slice(2))

for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const apiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY
if (!apiKey) {
  console.error('No key. Put VITE_GEMINI_API_KEY=... in .env.local (or export GEMINI_API_KEY).')
  process.exit(1)
}

let gemini, scripts
try {
  gemini = await import('../src/lib/gemini.ts')
  scripts = await import('../src/pages/book/voiceScripts.ts')
} catch (e) {
  console.error('Could not load the TypeScript modules. Run via `pnpm voice:clips` or `node --experimental-strip-types scripts/voice-clips.mjs`.\n', e.message)
  process.exit(1)
}
const { configureGemini, geminiConfig, geminiTTS: rawTTS, geminiText, GeminiError, isRateLimited, isDailyCap, retryAfterSeconds } = gemini

/** Free tier allows 3 TTS requests/minute: on 429 wait as long as the API asks, then retry. */
async function geminiTTS(text, lang, attempt = 0) {
  try {
    return await rawTTS(text, lang)
  } catch (e) {
    if (isDailyCap(e)) {
      const err = new Error(`Daily free-tier limit reached (${e.message}). Enable billing on the key at https://ai.dev/rate-limit, or try again tomorrow.`)
      err.fatal = true
      throw err
    }
    if (!isRateLimited(e) || attempt >= 6) throw e
    const wait = (retryAfterSeconds(e) ?? 20) + 1
    process.stdout.write(`  (rate limited — waiting ${wait}s)\n`)
    await sleep(wait * 1000)
    return geminiTTS(text, lang, attempt + 1)
  }
}
const { GUIDE_CLIPS } = scripts

const pickEnv = (k) => (process.env[k] ? { [k]: process.env[k] } : {})
configureGemini({
  apiKey,
  ...(process.env.VITE_GEMINI_CHAT_MODEL ? { chatModel: process.env.VITE_GEMINI_CHAT_MODEL } : {}),
  ...(process.env.VITE_GEMINI_TTS_MODEL ? { ttsModel: process.env.VITE_GEMINI_TTS_MODEL } : {}),
  ...(process.env.VITE_GEMINI_TTS_FALLBACK_MODEL ? { ttsFallbackModel: process.env.VITE_GEMINI_TTS_FALLBACK_MODEL } : {}),
  voices: { en: process.env.VITE_GEMINI_VOICE_EN ?? 'Sulafat', ta: process.env.VITE_GEMINI_VOICE_TA ?? 'Sulafat' },
})
void pickEnv

const outDir = path.join(root, 'public', 'voice')
/** Candidates for a warm studio-host voice; descriptors are Google's. */
const SAMPLE_VOICES = ['Sulafat', 'Despina', 'Achernar', 'Vindemiatrix', 'Achird', 'Leda', 'Algieba', 'Laomedeia']
mkdirSync(outDir, { recursive: true })

function explain(e) {
  if (e instanceof GeminiError) {
    console.error(`  Gemini ${e.status}: ${e.message}`)
    if (e.body && typeof e.body === 'object') console.error('  ' + JSON.stringify(e.body).slice(0, 600))
  } else console.error('  ' + (e?.stack ?? e))
}


if (args.has('--check')) {
  const cfg = geminiConfig()
  console.log(`Models: chat=${cfg.chatModel} tts=${cfg.ttsModel} voices=${JSON.stringify(cfg.voices)}`)
  try {
    const t0 = Date.now()
    const reply = await geminiText({ system: 'Reply with exactly one word: OK', input: 'ping' })
    console.log(`Chat ✓ (${Date.now() - t0} ms): ${JSON.stringify(reply.slice(0, 80))}`)
  } catch (e) {
    console.error('Chat ✗')
    explain(e)
  }
  try {
    const t0 = Date.now()
    const { bytes } = await geminiTTS('வணக்கம்! இது ஒரு சோதனை. The Treasure Capture Events.', 'ta')
    const file = path.join(outDir, 'check.ta.wav')
    writeFileSync(file, bytes)
    console.log(`TTS ✓ (${Date.now() - t0} ms): ${bytes.length} bytes → ${path.relative(root, file)}`)
  } catch (e) {
    console.error('TTS ✗')
    explain(e)
  }
  process.exit(0)
}

if (args.has('--voices')) {
  const dir = path.join(outDir, 'samples')
  mkdirSync(dir, { recursive: true })
  for (const voice of SAMPLE_VOICES) {
    configureGemini({ voices: { en: voice, ta: voice } })
    for (const lang of ['ta', 'en']) {
      const file = path.join(dir, `${voice}.${lang}.wav`)
      if (existsSync(file) && !args.has('--force')) continue
      try {
        const { bytes } = await geminiTTS(GUIDE_CLIPS.welcome[lang], lang)
        writeFileSync(file, bytes)
        console.log(`✓ ${path.relative(root, file)}`)
      } catch (e) {
        console.error(`✗ ${voice} ${lang}`)
        explain(e)
        if (e.fatal) process.exit(1)
      }
      await sleep(400)
    }
  }
  console.log('Open /voice/samples/ in the running app to listen, then set VITE_GEMINI_VOICE_TA / _EN in .env.local and run `pnpm voice:clips --force`.')
  process.exit(0)
}

// Default run: render every clip. Tamil goes to the main TTS model and English to the
// lite one (each has its own free-tier daily quota), identical texts are rendered once,
// and languages alternate so neither model is hit more than ~3 times a minute.
let ok = 0, skipped = 0, failed = 0
const main = geminiConfig().ttsModel
const lite = geminiConfig().ttsFallbackModel && geminiConfig().ttsFallbackModel !== main ? geminiConfig().ttsFallbackModel : main
const byText = new Map()
const ta = [], en = []
const onlyLang = [...args].find(a => a.startsWith('--lang='))?.slice(7)
for (const [id, text] of Object.entries(GUIDE_CLIPS)) {
  for (const lang of ['ta', 'en']) {
    if (onlyLang && lang !== onlyLang) continue
    const file = path.join(outDir, `${id}.${lang}.wav`)
    if (existsSync(file) && !args.has('--force')) {
      skipped++
      continue
    }
    const same = byText.get(text[lang])
    if (same) {
      same.copies.push(file)
      continue
    }
    const job = { id, lang, text: text[lang], file, copies: [] }
    byText.set(text[lang], job)
    ;(lang === 'ta' ? ta : en).push(job)
  }
}
const queue = []
while (ta.length || en.length) {
  if (ta.length) queue.push(ta.shift())
  if (en.length) queue.push(en.shift())
}
const capped = new Set()
console.log(`${queue.length} renders to do (${skipped} existing skipped). Tamil → ${main}, English → ${lite}.`)
while (queue.length) {
  const j = queue.shift()
  const preferred = j.lang === 'ta' ? main : lite
  const model = capped.has(preferred) ? [main, lite].find(m => !capped.has(m)) : preferred
  if (!model) {
    console.error('\nBoth TTS models have hit the free-tier daily cap. Enable billing on the key, or create a key in a NEW Google Cloud project and re-run.')
    failed += 1 + queue.length
    break
  }
  configureGemini({ ttsModel: model, ttsFallbackModel: model })
  try {
    const { bytes } = await geminiTTS(j.text, j.lang)
    writeFileSync(j.file, bytes)
    const fmt = compress(j.file)
    for (const c of j.copies) {
      copyFileSync(j.file, c)
      if (fmt) copyFileSync(j.file.replace(/\.wav$/, `.${fmt}`), c.replace(/\.wav$/, `.${fmt}`))
    }
    ok += 1 + j.copies.length
    console.log(`✓ ${path.basename(j.file)}${j.copies.length ? ` (+${j.copies.map(c => path.basename(c)).join(', ')})` : ''}  ${(bytes.length / 1024).toFixed(0)} KB${fmt ? ` → .${fmt}` : ''}  [${model}]`)
  } catch (e) {
    if (e.fatal) {
      capped.add(model)
      console.error(`  ${model}: daily cap reached — moving its clips to the other model`)
      queue.unshift(j)
      continue
    }
    failed++
    console.error(`✗ ${j.id}.${j.lang}`)
    explain(e)
  }
}
console.log(`\nRendered ${ok}, skipped ${skipped} existing, failed ${failed}. Files are in public/voice/.`)
process.exit(failed ? 1 : 0)
