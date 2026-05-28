// Typed fetch client. API URL and dev token come from EXPO_PUBLIC_* env vars
// (baked into the JS bundle at build time — never put production secrets here).

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
const DEV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN ?? ''

export type Knute = {
  id: string
  title: string
  description: string | null
  points: number
  difficulty: 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
  isActive: boolean
  createdAt: string
}

export type KnuterResponse = { knuter: Knute[] }

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  if (!DEV_TOKEN) {
    throw new ApiError(0, 'EXPO_PUBLIC_DEV_TOKEN er ikke satt. Hent en token med "pnpm --filter @knuteloop/api dev:token" og lim inn i apps/mobile/.env.')
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${DEV_TOKEN}` },
    })
  } catch (err) {
    // Network-level failure: backend nede, feil URL, firewall.
    throw new ApiError(0, `Kunne ikke nå ${API_URL}. Sjekk at backend kjører og at URL-en stemmer.`)
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      `API svarte ${res.status} ${res.statusText}.${res.status === 401 ? ' Token utløpt? Re-kjør dev:token.' : ''}`,
    )
  }

  return res.json() as Promise<T>
}

export function fetchKnuter(): Promise<KnuterResponse> {
  return apiFetch<KnuterResponse>('/api/knuter')
}
