import { type DevUser } from './api'

// Dev-only identity store. Normally the app uses the single
// EXPO_PUBLIC_DEV_TOKEN baked in at build time; the dev-login screen lets you
// switch to any seeded user at runtime by swapping the active token. In-memory
// only — a full app reload falls back to the env token. This whole module is
// replaced by real token storage (expo-secure-store) when Vipps auth lands.

const ENV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN ?? ''

let activeToken = ENV_TOKEN
let activeUser: DevUser | null = null

export function getActiveToken(): string {
  return activeToken
}

export function getActiveUser(): DevUser | null {
  return activeUser
}

export function setActiveIdentity(token: string, user: DevUser): void {
  activeToken = token
  activeUser = user
}
