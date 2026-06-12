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

export type PendingSubmission = {
  id: string
  userId: string
  knuteId: string
  imageKey: string
  caption: string | null
  createdAt: string
  russenavn: string
  knuteTitle: string
  knutePoints: number
}
export type PendingResponse = { submissions: PendingSubmission[] }

export type ReviewedSubmission = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: string | null
  reviewedAt: string | null
}
export type ReviewResponse = { submission: ReviewedSubmission }

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!DEV_TOKEN) {
    throw new ApiError(0, 'EXPO_PUBLIC_DEV_TOKEN er ikke satt. Hent en token med "pnpm dev:token" og lim inn i apps/mobile/.env.')
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${DEV_TOKEN}`,
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch {
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

// Knutesjef-panel uses ?all=1 to include inactive knuter so they can be re-activated.
export function fetchAllKnuter(): Promise<KnuterResponse> {
  return apiFetch<KnuterResponse>('/api/knuter?all=1')
}

export type CreateKnuteInput = {
  title: string
  description?: string
  points: number
  difficulty: 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
}

export type UpdateKnuteInput = Omit<Partial<CreateKnuteInput>, 'description'> & {
  isActive?: boolean
  description?: string | null
}

export type CreatedKnute = { knute: Knute & { schoolId: string } }

export function createKnute(input: CreateKnuteInput): Promise<CreatedKnute> {
  return apiFetch<CreatedKnute>('/api/knuter', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateKnute(id: string, input: UpdateKnuteInput): Promise<CreatedKnute> {
  return apiFetch<CreatedKnute>(`/api/knuter/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export type CreateSubmissionInput = {
  knuteId: string
  imageKey: string
  caption?: string
}

export type CreatedSubmission = {
  submission: {
    id: string
    status: 'pending'
    knuteId: string
  }
}

export function createSubmission(input: CreateSubmissionInput): Promise<CreatedSubmission> {
  return apiFetch<CreatedSubmission>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchPendingSubmissions(): Promise<PendingResponse> {
  return apiFetch<PendingResponse>('/api/submissions/pending')
}

export function approveSubmission(id: string): Promise<ReviewResponse> {
  return apiFetch<ReviewResponse>(`/api/submissions/${id}/approve`, { method: 'PATCH' })
}

export function rejectSubmission(id: string): Promise<ReviewResponse> {
  return apiFetch<ReviewResponse>(`/api/submissions/${id}/reject`, { method: 'PATCH' })
}

export type LeaderboardEntry = {
  userId: string
  russenavn: string
  points: number
  rank: number
  isCurrentUser: boolean
}
export type LeaderboardResponse = { leaderboard: LeaderboardEntry[] }

export function fetchLeaderboard(): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>('/api/leaderboard')
}

export type MyProfile = {
  id: string
  russenavn: string
  role: 'student' | 'knutesjef' | 'admin'
  points: number
  createdAt: string
}
export type MySubmission = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  imageKey: string
  caption: string | null
  createdAt: string
  reviewedAt: string | null
  knuteTitle: string
  knutePoints: number
}
export type MeResponse = {
  user: MyProfile
  submissions: MySubmission[]
  counts: { approved: number; pending: number; rejected: number }
}

export function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/me')
}

// Used by the home screen to detect knutesjef role without decoding the JWT:
// hit /pending; 200 = knutesjef, 403 = not. Returns null if not authorized.
export async function tryFetchPendingCount(): Promise<number | null> {
  try {
    const data = await fetchPendingSubmissions()
    return data.submissions.length
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return null
    throw err
  }
}

export { ApiError }
