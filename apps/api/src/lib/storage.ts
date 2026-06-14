import { randomUUID } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { config } from '../config.js'

// Image storage abstraction. The DB stores a storage KEY (never a full URL);
// the public URL is resolved at read-time from the key. Two drivers:
//
//   - 'local'  (dev): files live under apps/api/var/uploads/, served by the API
//                     itself (routes/uploads.ts). Public/upload URLs are built
//                     from the incoming request's origin so the phone reaches the
//                     same host it called (localhost or the dev machine's LAN IP).
//   - 'bunny'  (prod): Bunny Storage + CDN (EU, ADR-0008). Upload = presigned PUT,
//                      public URL = https://<cdn-hostname>/<key>. Wired when the
//                      Bunny account + keys are configured; throws until then.
//
// Swapping local→bunny is a config flip (STORAGE_DRIVER=bunny + BUNNY_* vars);
// no call sites change because they only ever deal with keys + these helpers.

// apps/api/var/uploads/ — gitignored. import.meta.url is …/src/lib/storage.ts.
const LOCAL_ROOT = resolve(
  new URL('../../var/uploads', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
)

// Keys we generate: submissions/<uuid>.jpg. The pattern is also the allowlist for
// the dev upload/serve routes (defense against path traversal — see localPath()).
// Strict UUID v4 shape (8-4-4-4-12), so only keys we actually mint are accepted.
const KEY_PATTERN = /^submissions\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/

export function isValidImageKey(key: string): boolean {
  return KEY_PATTERN.test(key)
}

// Detect the real image type from the leading magic bytes, so we serve the
// correct Content-Type regardless of what the client claimed. Matters because
// (a) image manipulators can emit PNG even when asked for JPEG, and (b) browsers
// honour X-Content-Type-Options: nosniff and refuse a mismatched type.
export function sniffImageType(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return 'application/octet-stream'
}

/** A fresh, unguessable key for a new submission image. */
export function newSubmissionImageKey(): string {
  return `submissions/${randomUUID()}.jpg`
}

/** The origin (scheme://host[:port]) the client used to reach us — used to build
 *  absolute dev URLs that are reachable from the same device. */
export function requestOrigin(reqUrl: string): string {
  return new URL(reqUrl).origin
}

/** Where the client PUTs the image bytes. */
export function uploadUrlForKey(key: string, origin: string): string {
  if (config.STORAGE_DRIVER === 'bunny') {
    // TODO(bunny): return a short-lived presigned PUT URL once BUNNY_* is configured.
    throw new Error('Bunny upload not wired yet — set STORAGE_DRIVER=local for dev')
  }
  return `${origin}/uploads/${key}`
}

/** The public URL the app loads the image from (feed, review, etc.). */
export function publicUrlForKey(key: string, origin: string): string {
  if (config.STORAGE_DRIVER === 'bunny') {
    if (!config.BUNNY_CDN_HOSTNAME) throw new Error('BUNNY_CDN_HOSTNAME is not set')
    return `https://${config.BUNNY_CDN_HOSTNAME}/${key}`
  }
  return `${origin}/uploads/${key}`
}

// ---- Local driver disk I/O (dev only; used by routes/uploads.ts) ----

// Resolve a key to an absolute path UNDER LOCAL_ROOT, rejecting traversal.
function localPath(key: string): string {
  if (!isValidImageKey(key)) throw new Error('Invalid image key')
  const full = resolve(LOCAL_ROOT, key)
  if (full !== LOCAL_ROOT && !full.startsWith(LOCAL_ROOT + sep)) {
    throw new Error('Path traversal blocked')
  }
  return full
}

export async function writeLocalImage(key: string, bytes: Uint8Array): Promise<void> {
  const full = localPath(key)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, bytes)
}

export async function readLocalImage(key: string): Promise<Uint8Array | null> {
  try {
    return await readFile(localPath(key))
  } catch {
    return null
  }
}

export async function localImageExists(key: string): Promise<boolean> {
  try {
    await stat(localPath(key))
    return true
  } catch {
    return false
  }
}

export { LOCAL_ROOT }
