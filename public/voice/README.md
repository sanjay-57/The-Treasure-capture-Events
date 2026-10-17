Pre-rendered voice guide clips (`<clip>.<lang>.wav`), produced by `pnpm voice:clips`
from `src/pages/book/voiceScripts.ts` with Gemini TTS. The app plays these when
present and otherwise speaks the same text live. Re-run with `--force` after
editing a script or changing the voice in `.env.local`.
