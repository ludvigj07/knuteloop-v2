import { type DevUser } from './api'

// Dev-only identity store. Normally the app uses the single
// EXPO_PUBLIC_DEV_TOKEN baked in at build time; the dev-login screen lets you
// switch to any seeded user at runtime by swapping the active token.
//
// On WEB the picked identity survives page reloads via localStorage — Ludvig
// tests in the browser, where every refresh otherwise fell back to the (often
// expired) env token and 401-ed the whole app. Native dev stays in-memory.
// This whole module is replaced by real token storage (expo-secure-store)
// when Vipps auth lands; localStorage never sees a production token.

// EXPO_PUBLIC_* vars are inlined into the JS bundle at build time, so guard the
// fallback behind __DEV__ — a release build must never carry a live dev token.
const ENV_TOKEN = __DEV__ ? (process.env.EXPO_PUBLIC_DEV_TOKEN ?? '') : ''
const STORAGE_KEY = 'knuteloop.dev.identity'

type StoredIdentity = { token: string; user: DevUser }

function loadStored(): StoredIdentity | null {
  if (!__DEV__ || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredIdentity) : null
  } catch {
    return null
  }
}

const stored = loadStored()
let activeToken = stored?.token ?? ENV_TOKEN
let activeUser: DevUser | null = stored?.user ?? null

export function getActiveToken(): string {
  return activeToken
}

export function getActiveUser(): DevUser | null {
  return activeUser
}

export function setActiveIdentity(token: string, user: DevUser): void {
  activeToken = token
  activeUser = user
  if (__DEV__ && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    } catch {
      // Storage blocked/full — dev-only convenience, safe to ignore.
    }
  }
}
