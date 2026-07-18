/**
 * Dev route pre-warmer.
 *
 * `next dev` compiles each route the first time it's requested — so the first
 * click on any page is slow. This script logs in as the seed admin and requests
 * every top-level page once, right after the server boots, so those first-click
 * compiles happen up front instead of while you're waiting.
 *
 * Dev-only. Never runs in production (there are no on-demand compiles there).
 * Auth cookies are produced by @supabase/ssr itself, so the format always matches
 * the installed version. Any failure is swallowed — warming must never break dev.
 *
 * Run standalone: `npm run warm` (server must be up), or it's launched
 * automatically by `scripts/dev.mjs` (the default `npm run dev`).
 */
import { readFileSync } from 'node:fs'
import { createServerClient } from '@supabase/ssr'

const env = {}
try {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {
  /* no .env.local — public-only warm below */
}

const BASE = process.env.WARM_BASE || env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const EMAIL = process.env.WARM_EMAIL || 'admin@silverline.test'
const PASSWORD = process.env.WARM_PASSWORD || 'Password123!'

// Top-level pages the sidebar links to (dynamic [id] routes can't be pre-warmed
// without an id, so they compile on first real visit).
const ROUTES = [
  '/dashboard',
  '/projects',
  '/projects/new',
  '/clients',
  '/tasks',
  '/documents',
  '/users',
  '/settings',
  '/portal',
]

const log = (m) => console.log(`\x1b[2m[warm]\x1b[0m ${m}`)

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE, { redirect: 'manual' })
      if (res.status > 0) return true
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

async function authCookie() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  const jar = {}
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => Object.entries(jar).map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => (jar[name] = value)),
    },
  })
  const { error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (error) {
    log(`login as ${EMAIL} failed (${error.message}) — warming public routes only`)
    return null
  }
  return Object.entries(jar)
    .map(([n, v]) => `${n}=${v}`)
    .join('; ')
}

async function warm() {
  if (!(await waitForServer())) {
    log('server never came up — skipping')
    return
  }
  const cookie = await authCookie()
  const headers = cookie ? { cookie } : {}
  const started = Date.now()
  // Sequential: gentle on the dev compiler, and it doesn't need to be fast.
  for (const route of ROUTES) {
    const t = Date.now()
    try {
      const res = await fetch(BASE + route, { headers, redirect: 'manual' })
      log(`${route} → ${res.status} ${Date.now() - t}ms`)
    } catch (e) {
      log(`${route} failed: ${e.message}`)
    }
  }
  log(`warmed ${ROUTES.length} routes in ${((Date.now() - started) / 1000).toFixed(1)}s — first clicks are now instant`)
}

warm().catch((e) => log(`aborted: ${e.message}`))
