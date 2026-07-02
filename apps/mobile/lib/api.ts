// Typed fetch client. API URL comes from EXPO_PUBLIC_API_URL; the auth token is
// the active dev identity (lib/auth) — EXPO_PUBLIC_DEV_TOKEN by default, or
// whatever the dev-login screen switched to.

import type { FolderIconKey } from '@knuteloop/shared'
import { getActiveToken } from './auth'

// The API base URL. In PRODUCTION builds it MUST be provided explicitly via
// EXPO_PUBLIC_API_URL (an https:// URL) — we deliberately do NOT fall back to
// localhost there, so a misconfigured release build fails loudly at startup
// instead of silently shipping a dead app to TestFlight / the App Store (H-8).
// In dev (__DEV__) we keep the convenient localhost fallback.
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (__DEV__) {
    return fromEnv ?? 'http://localhost:3000'
  }
  if (!fromEnv) {
    throw new Error(
      'EXPO_PUBLIC_API_URL er ikke satt. Produksjonsbygg krever en eksplisitt https:// API-URL.',
    )
  }
  if (!fromEnv.startsWith('https://')) {
    throw new Error(
      `EXPO_PUBLIC_API_URL må være en https:// URL i produksjon (fikk: ${fromEnv}).`,
    )
  }
  return fromEnv
}

const API_URL = resolveApiUrl()

export type Knute = {
  id: string
  title: string
  description: string | null
  points: number
  difficulty: 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
  /** 'media' = photo required; 'text' = caption-only submission (no photo). */
  evidenceType: 'media' | 'text'
  /** Knutesjef-flagged gullknute (special/traditional). Drives gold styling. */
  isGold: boolean
  isActive: boolean
  createdAt: string
}

export type KnuterResponse = { knuter: Knute[] }

export type PendingSubmission = {
  id: string
  userId: string
  knuteId: string
  imageKey: string | null
  /** Loadable image URL (null for text submissions + legacy placeholder keys). */
  imageUrl: string | null
  caption: string | null
  createdAt: string
  russenavn: string
  knuteTitle: string
  knutePoints: number
  evidenceType: 'media' | 'text'
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
  const token = getActiveToken()
  if (!token) {
    throw new ApiError(0, 'Ingen token. Sett EXPO_PUBLIC_DEV_TOKEN i apps/mobile/.env, eller velg en bruker via «Bytt bruker (dev)».')
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError(0, `Kunne ikke nå ${API_URL}. Sjekk at backend kjører og at URL-en stemmer.`)
  }

  if (!res.ok) {
    // The API formats domain errors as { error: { message, requestId? } } (and
    // 400s as { error: { message, issues } }). Surface that Norwegian message —
    // e.g. "Knuten er allerede importert" — instead of a generic status string.
    let serverMessage: string | undefined
    try {
      const body = (await res.json()) as { error?: { message?: unknown; issues?: unknown } }
      if (res.status === 400 && body?.error?.issues != null) {
        // Zod validation failures come back as the English "Invalid input" with an
        // `issues` payload. The rest of the app is bokmål — show a bokmål message.
        serverMessage = 'Ugyldige verdier. Sjekk feltene og prøv igjen.'
      } else if (typeof body?.error?.message === 'string' && body.error.message.length > 0) {
        serverMessage = body.error.message
      }
    } catch {
      // Body wasn't JSON (proxy error, empty body) — fall back to the generic message.
    }
    const fallback = `API svarte ${res.status} ${res.statusText}.`
    const devHint = res.status === 401 ? ' Token utløpt? Re-kjør dev:token.' : ''
    throw new ApiError(res.status, (serverMessage ?? fallback) + devHint)
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
  isGold?: boolean
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
  /** Omitted for text-only knuter (the caption is the evidence). */
  imageKey?: string
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

export type UploadUrlResponse = { uploadUrl: string; imageKey: string }

// Step 1 of the submit flow: ask the API for a one-time image key + the URL to
// PUT the photo to (dev: this API's /uploads route; prod: a Bunny presigned URL).
export function fetchUploadUrl(): Promise<UploadUrlResponse> {
  return apiFetch<UploadUrlResponse>('/api/submissions/upload-url', { method: 'POST' })
}

// Step 2: PUT the (already compressed) image bytes to the upload URL. The upload
// URL is a one-time target / presigned URL, so it carries NO Authorization header.
export async function uploadImageBinary(uploadUrl: string, fileUri: string): Promise<void> {
  const blob = await (await fetch(fileUri)).blob()
  let res: Response
  try {
    res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': 'image/jpeg' },
      body: blob,
    })
  } catch {
    throw new ApiError(0, 'Kunne ikke laste opp bildet. Sjekk nettet og prøv igjen.')
  }
  if (!res.ok) throw new ApiError(res.status, `Opplasting feilet (${res.status}).`)
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

export type FeedItem = {
  id: string
  userId: string
  /** Null for text-only submissions. */
  imageKey: string | null
  /** Loadable image URL (null for text submissions + legacy placeholder keys). */
  imageUrl: string | null
  caption: string | null
  createdAt: string
  russenavn: string
  knuteTitle: string
  knutePoints: number
  /** 'text' → render a text card instead of a photo. */
  evidenceType: 'media' | 'text'
}
export type FeedResponse = { feed: FeedItem[]; nextCursor: string | null }

export function fetchFeed(cursor?: string | null): Promise<FeedResponse> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return apiFetch<FeedResponse>(`/api/feed${params}`)
}

export type LeaderboardEntry = {
  userId: string
  russenavn: string
  points: number
  rank: number
  rankTitle: string
  isCurrentUser: boolean
}
export type LeaderboardResponse = { leaderboard: LeaderboardEntry[] }

export function fetchLeaderboard(): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>('/api/leaderboard')
}

export type RussType = 'blue' | 'red'
export type KnuteCategory =
  | 'Generelle'
  | 'Dobbelknuter'
  | 'Alkoholknuter'
  | 'Sexknuter'
  | 'Fordervett-knuter'
/** Per-folder progress for the profile category rings. */
export type CategoryRingData = { category: KnuteCategory; total: number; completed: number }

export type MyProfile = {
  id: string
  russenavn: string
  role: 'student' | 'knutesjef' | 'admin'
  russType: RussType
  quote: string | null
  points: number
  createdAt: string
}
export type MySubmission = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  knuteId: string
  imageKey: string | null
  caption: string | null
  createdAt: string
  reviewedAt: string | null
  knuteTitle: string
  knutePoints: number
  evidenceType: 'media' | 'text'
}
export type MeResponse = {
  user: MyProfile
  submissions: MySubmission[]
  counts: { approved: number; pending: number; rejected: number }
  /** Distinct knuter completed (all-time). */
  completedCount: number
  /** Distinct completed knuter worth >= 30 points. */
  goldCount: number
  /** Consecutive Europe/Oslo days with an approved submission (ending today/yesterday). */
  streak: number
  /** Always the five folders, in display order. */
  categories: CategoryRingData[]
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

export type DevUser = {
  userId: string
  russenavn: string
  role: 'student' | 'knutesjef' | 'admin'
  schoolId: string
  schoolName: string
  token: string
}
export type DevUsersResponse = { users: DevUser[] }

// Dev-only: list seeded users for the identity switcher. Unauthenticated — the
// endpoint is gated to non-production server-side, and this is how you OBTAIN a
// token, so it sits outside apiFetch.
export async function fetchDevUsers(): Promise<DevUsersResponse> {
  const res = await fetch(`${API_URL}/api/dev/users`)
  if (!res.ok) {
    throw new ApiError(res.status, `Dev-login utilgjengelig (${res.status}). Kjører API-en i dev-modus?`)
  }
  return res.json() as Promise<DevUsersResponse>
}

// ── Knutebibliotek (ADR-0014) — the shared catalog a knutesjef browses + imports from.

export type LibraryKnute = {
  id: string
  title: string
  description: string | null
  points: number
  difficulty: 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
  /** 'media' (photo/video) or 'text' (no media — legally sensitive knuter). */
  evidenceType: 'media' | 'text'
  /** 17 (all-ages) or 18 (adult-only). */
  minAge: number
  /** The theme/type axis: Generelle / Dobbel / Rampestrek / Alkohol / Sex. */
  suggestedFolder: string
  /** Geography axis; null = Nasjonalt. */
  region: string | null
  /** Whether THIS school has already imported it. */
  imported: boolean
}
export type LibraryKnuterResponse = { knuter: LibraryKnute[] }

export type LibraryBrowseParams = {
  folder?: string
  region?: string
  q?: string
  packId?: string
  /** Page size (server caps at 100, defaults to 50). */
  limit?: number
  /** Pagination offset — drives "vis flere" / infinite scroll. */
  offset?: number
}

export function fetchLibraryKnuter(params: LibraryBrowseParams = {}): Promise<LibraryKnuterResponse> {
  const parts: string[] = []
  if (params.folder) parts.push(`folder=${encodeURIComponent(params.folder)}`)
  if (params.region) parts.push(`region=${encodeURIComponent(params.region)}`)
  if (params.q) parts.push(`q=${encodeURIComponent(params.q)}`)
  if (params.packId) parts.push(`packId=${encodeURIComponent(params.packId)}`)
  if (params.limit != null) parts.push(`limit=${params.limit}`)
  if (params.offset != null) parts.push(`offset=${params.offset}`)
  const suffix = parts.length > 0 ? `?${parts.join('&')}` : ''
  return apiFetch<LibraryKnuterResponse>(`/api/library/knuter${suffix}`)
}

export type LibraryPack = {
  id: string
  name: string
  description: string | null
  sortOrder: number
  knuteCount: number
}
export type LibraryPacksResponse = { packs: LibraryPack[] }

export function fetchLibraryPacks(): Promise<LibraryPacksResponse> {
  return apiFetch<LibraryPacksResponse>('/api/library/packs')
}

export type ImportKnuteResponse = {
  /** The school's own copy (existing one reused if already imported). */
  knuteId: string
  /** True when the knute was already in the school — the call just added folders. */
  alreadyImported: boolean
  /** The folders the copy was filed into by this call (deduped). */
  folderIds: string[]
}

// Import a library knute into the chosen folder(s) ("add to playlist"). Pass no folders
// to import into the catalog only. Idempotent — safe to call again to add more folders.
export function importLibraryKnute(
  libraryKnuteId: string,
  folderIds?: string[],
): Promise<ImportKnuteResponse> {
  return apiFetch<ImportKnuteResponse>('/api/library/imports', {
    method: 'POST',
    body: JSON.stringify({ libraryKnuteId, folderIds }),
  })
}

export type ImportPackResponse = { imported: number; skipped: number; folders: string[] }

export function importLibraryPack(packId: string): Promise<ImportPackResponse> {
  return apiFetch<ImportPackResponse>(`/api/library/packs/${packId}/import`, { method: 'POST' })
}

// ── Knutemapper (folders) — the school's own organization of its knuter (ADR-0014).

export type Folder = {
  id: string
  name: string
  /** Lucide icon key (FOLDER_ICON_KEYS) or null for the default folder icon. */
  icon: FolderIconKey | null
  sortOrder: number
  knuteCount: number
}
export type FoldersResponse = { folders: Folder[] }

export function fetchFolders(): Promise<FoldersResponse> {
  return apiFetch<FoldersResponse>('/api/folders')
}

export type CreatedFolder = {
  folder: { id: string; name: string; icon: FolderIconKey | null; sortOrder: number }
}

export function createFolder(name: string, icon?: FolderIconKey): Promise<CreatedFolder> {
  return apiFetch<CreatedFolder>('/api/folders', {
    method: 'POST',
    body: JSON.stringify({ name, icon }),
  })
}

export function deleteFolder(id: string): Promise<{ deleted: string }> {
  return apiFetch<{ deleted: string }>(`/api/folders/${id}`, { method: 'DELETE' })
}

export function removeKnuteFromFolder(folderId: string, knuteId: string): Promise<{ removed: string }> {
  return apiFetch<{ removed: string }>(`/api/folders/${folderId}/knuter/${knuteId}`, {
    method: 'DELETE',
  })
}

// Knuter in a single folder (knutesjef view — all=1 includes inactive).
export function fetchKnuterByFolder(folderId: string): Promise<KnuterResponse> {
  return apiFetch<KnuterResponse>(`/api/knuter?all=1&folderId=${encodeURIComponent(folderId)}`)
}

// Knuter in a single folder for the student catalog (no all=1 → active-only,
// age-gated). Drives the folder chips on the "Knuter" tab.
export function fetchKnuterInFolder(folderId: string): Promise<KnuterResponse> {
  return apiFetch<KnuterResponse>(`/api/knuter?folderId=${encodeURIComponent(folderId)}`)
}

export { ApiError }
