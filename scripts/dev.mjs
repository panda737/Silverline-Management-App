/**
 * `npm run dev` — starts Next (Turbopack) and pre-warms routes once it's up.
 *
 * The warmer (scripts/warm.mjs) polls for readiness itself, so it's safe to kick
 * off immediately; it compiles every top-level page up front so your first click
 * on each isn't the slow one. Use `npm run dev:raw` for plain Next without warming.
 */
import { spawn } from 'node:child_process'

const next = spawn('npx', ['next', 'dev', '--turbopack'], {
  stdio: 'inherit',
  shell: true,
})

// Warmer runs in this same process (it waits for the server before hitting routes).
import('./warm.mjs')

next.on('exit', (code) => process.exit(code ?? 0))
process.on('SIGINT', () => next.kill('SIGINT'))
process.on('SIGTERM', () => next.kill('SIGTERM'))
