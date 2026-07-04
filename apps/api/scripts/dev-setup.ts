// scripts/dev-setup.ts — one-shot bootstrap for the local dev database.
//
//   pnpm dev:setup
//
// Drops + recreates knuteloop_dev, runs all migrations, seeds two schools,
// one user per school, and a starter set of knuter so the API has something
// to return when you hit GET /api/knuter manually.
//
// Re-running this WIPES the dev DB. That's the point — predictable starting
// state for every dev session.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema/index.js'
import { signDevToken } from '../src/lib/auth-dev.js'
import { librarySeedKnuter } from './library-seed-data.js'

const SUPERUSER_URL =
  process.env.SUPERUSER_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres'

// Parse the app DATABASE_URL to extract the target db name + host/port.
const APP_URL = process.env.DATABASE_URL
if (!APP_URL) {
  process.stderr.write('DATABASE_URL is not set (check apps/api/.env)\n')
  process.exit(1)
}

const appUrl = new URL(APP_URL)
const DEV_DB_NAME = appUrl.pathname.replace(/^\//, '') // e.g. 'knuteloop_dev'

const MIGRATIONS_DIR = new URL('../src/db/migrations', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
)

process.stdout.write(`Dev setup → ${DEV_DB_NAME}\n`)

// 1. Drop + recreate the database as superuser.
{
  const adminSql = postgres(SUPERUSER_URL, { prepare: false, max: 1 })
  try {
    await adminSql.unsafe(`DROP DATABASE IF EXISTS "${DEV_DB_NAME}" WITH (FORCE)`)
    await adminSql.unsafe(`CREATE DATABASE "${DEV_DB_NAME}"`)
    process.stdout.write(`  dropped + recreated ${DEV_DB_NAME}\n`)
  } finally {
    await adminSql.end({ timeout: 5 })
  }
}

// 2. Connect to the fresh dev DB as superuser. Apply migrations + grants.
const supSqlBase = new URL(SUPERUSER_URL)
supSqlBase.pathname = `/${DEV_DB_NAME}`
const supSql = postgres(supSqlBase.toString(), { prepare: false, max: 1 })
const supDb = drizzle(supSql, { schema })

await migrate(supDb, { migrationsFolder: MIGRATIONS_DIR })
process.stdout.write(`  migrations applied\n`)

await supSql.unsafe(`
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_role;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;
`)
// The library_* catalog is read-only for the app role (ADR-0014 / migration 0014).
// The blanket grant above re-granted write on EVERY table, so re-apply the REVOKE.
await supSql.unsafe(`
  REVOKE INSERT, UPDATE, DELETE ON library_knuter, library_packs, library_pack_memberships FROM app_role;
`)
process.stdout.write(`  grants applied\n`)

// 3. Seed: two schools, one user each.
const insertedSchools = await supDb
  .insert(schema.schools)
  .values([{ name: 'St. Olav vgs' }, { name: 'Hetland vgs' }])
  .returning()
const stOlav = insertedSchools[0]!
const hetland = insertedSchools[1]!

// Classes (school_classes): created by the knutesjef in the real flow; users
// claim membership via class_id. Seeded here so the toppliste's «Klassen min»
// + «Klassekamp» views have data. Odin alone in 3MKA makes the Klassekamp
// average visibly differ from the sum.
const insertedClasses = await supDb
  .insert(schema.schoolClasses)
  .values([
    { schoolId: stOlav.id, name: '3STA' },
    { schoolId: stOlav.id, name: '3MKA' },
    { schoolId: hetland.id, name: '3PBA' },
  ])
  .returning()
const class3STA = insertedClasses[0]!
const class3MKA = insertedClasses[1]!
const class3PBA = insertedClasses[2]!

const insertedUsers = await supDb
  .insert(schema.users)
  .values([
    // Each school gets its OWN knutesjef (so you can test the approve flow on
    // both tenants) plus students. Loke's token is written to mobile/.env as
    // the default; the dev-login screen switches between all of these.
    // russType + quote are seeded on a few users so the profile card has content.
    {
      schoolId: stOlav.id,
      russenavn: 'Loke',
      role: 'knutesjef',
      russType: 'red',
      quote: 'E det bedre å pilsa i heisen eller heisa pilsen?',
      isAdult: true,
      classId: class3STA.id,
    },
    { schoolId: stOlav.id, russenavn: 'Frida', role: 'student', russType: 'blue', quote: 'Tar livet med ein klype Maarud.', isAdult: true, classId: class3STA.id },
    // Odin stays a minor (isAdult default false) so you can test the 18+ age gate.
    { schoolId: stOlav.id, russenavn: 'Odin', role: 'student', russType: 'red', classId: class3MKA.id },
    // Brage has NO class — exercises the class-less path in the class views.
    { schoolId: hetland.id, russenavn: 'Brage', role: 'knutesjef', russType: 'red', isAdult: true },
    { schoolId: hetland.id, russenavn: 'Tor', role: 'student', russType: 'blue', classId: class3PBA.id },
    { schoolId: hetland.id, russenavn: 'Saga', role: 'student', classId: class3PBA.id },
  ])
  .returning()
const userLoke = insertedUsers[0]!
const userFrida = insertedUsers[1]!
const userOdin = insertedUsers[2]!
const userBrage = insertedUsers[3]!
const userTor = insertedUsers[4]!
const userSaga = insertedUsers[5]!

// 4. Seed knuter. St. Olav gets the 43 v1-spec knuter (treated as dev test
// data here — NOT a production seed, never auto-applied to other envs).
// Testskolen gets 3 distinct knuter so you can visually verify tenant isolation.
//
// Titles, points, difficulty come straight from v1-spec §2.
type SeedKnute = {
  title: string
  description: string | null
  points: number
  difficulty: 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
}

type KnuteCategory = 'Generelle' | 'Dobbelknuter' | 'Alkoholknuter' | 'Sexknuter' | 'Fordervett-knuter'

// Assign a knutemappe (folder) to each seed knute by keyword. TEST DATA ONLY —
// the real v1 category mapping is unknown (docs/v1-spec.md is an empty stub).
// This just spreads the dev knuter across all five folders so the profile
// category rings populate with believable progress. Order matters: first match
// wins, most-specific themes checked before the catch-all.
function devCategory(title: string): KnuteCategory {
  const t = title.toLocaleLowerCase('nb-NO')
  if (/snus|sneip|edru|pils|øl|drikk|shot|club sandwich/.test(t)) return 'Alkoholknuter'
  if (/kiss|klint|tinder|jenteknute|undertøy|komando|superman|paparazzi/.test(t)) return 'Sexknuter'
  if (/handcuff|dans|medruss|klan|vinn mot|hold pusten|2 min/.test(t)) return 'Dobbelknuter'
  if (/surr|frys|ring men|bjeff|drite|dorull|bikkja|1881|baka|popp/.test(t)) return 'Fordervett-knuter'
  return 'Generelle'
}

const stOlavKnuter: SeedKnute[] = [
  { title: 'Spis frokost under pulten', description: null, points: 10, difficulty: 'Lett' },
  { title: 'Ta klassebilde med matchende solbriller', description: null, points: 25, difficulty: 'Medium' },
  { title: 'Møt opp med røde sokker hele dagen', description: null, points: 15, difficulty: 'Lett' },
  { title: 'Lag en heiarop-video for klassen', description: null, points: 35, difficulty: 'Medium' },
  { title: 'Spis lunsj utendørs med russebuksa på', description: null, points: 20, difficulty: 'Lett' },
  { title: 'Arranger miniquiz om russetiden', description: null, points: 30, difficulty: 'Medium' },
  { title: 'Gå i badetøy på beverlig', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: 'Bjeff 10 ganger i løpet av en time', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: 'Spis 3 bananer under en presentasjon', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Lett' },
  { title: 'Spis 100 nuggets i en studietime', description: 'Fra St. Olav-listen.', points: 20, difficulty: 'Medium' },
  { title: 'Popp en snus fra bakken', description: 'Fra St. Olav-listen.', points: 5, difficulty: 'Lett' },
  { title: 'Røyk en sneip fra bakken', description: 'Fra St. Olav-listen.', points: 5, difficulty: 'Lett' },
  { title: 'Få et russekort fra en unge', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: 'Spor om skruff 67', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: '5 club sandwich i kantinen', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Baka', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: 'Be knutesjef om kiss or slap på knutesjef', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Bli med på selvforsvars time på kampsportshuset', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Frys skoen til noen på fest', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: 'Gå i komando under rusedressen en hel dag', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Jenteknute: Lag til tok dans med lærer', description: 'Fra St. Olav-listen.', points: 20, difficulty: 'Medium' },
  { title: 'Lag tinderprofil for noen', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Hold pusten 2 min i løpet av timen', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: 'Si høyt at du må drite og løp ut av klasserommet', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Kjop rosa hatt fra en tilfeldig selger', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: 'Perfekt week: barney', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Ring men ikke spring', description: 'Fra St. Olav-listen.', points: 20, difficulty: 'Medium' },
  { title: 'Jonern: overbevis noen om at de kjenner deg', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Gave: surr opp bilen til en lærer med dorull', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Superman: gå en hel dag med undertøy utenpå russedrakten', description: 'Fra St. Olav-listen.', points: 20, difficulty: 'Medium' },
  { title: 'Bikkja: gå som en hund fra kannik til skolebygget', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Russelue: gjennomfør russedåp med medruss', description: 'Fra St. Olav-listen.', points: 20, difficulty: 'Medium' },
  { title: 'Jim Carrey: si ja til alt ein heil dag', description: 'Fra St. Olav-listen.', points: 25, difficulty: 'Hard' },
  { title: 'Laettis alarm: få knutesjef til å le', description: 'Fra St. Olav-listen.', points: 10, difficulty: 'Lett' },
  { title: 'Paparazzi: få autograf til 10 stykker du har klint med', description: 'Fra St. Olav-listen.', points: 25, difficulty: 'Hard' },
  { title: 'Autograf: få autografen til en kjendis', description: 'Fra St. Olav-listen.', points: 30, difficulty: 'Hard' },
  { title: 'Kong laettis: hold standup show i kinosal', description: 'Fra St. Olav-listen.', points: 30, difficulty: 'Hard' },
  { title: 'Sommerkroppen: fullfør treningsøkt i kaentish minimum 15 min', description: 'Fra St. Olav-listen.', points: 20, difficulty: 'Medium' },
  { title: 'Kvisten: fullfør en heil 6er i et tre', description: 'Fra St. Olav-listen.', points: 25, difficulty: 'Hard' },
  { title: 'Klan leder: vinn mot lederen av St. Olav-klanen i Clash Royal', description: 'Fra St. Olav-listen.', points: 15, difficulty: 'Medium' },
  { title: 'Gå edru hele rt', description: 'Fra St. Olav-listen.', points: 30, difficulty: 'Hard' },
  { title: 'Handcuff deg til noen en hel skoledag', description: 'Fra St. Olav-listen.', points: 20, difficulty: 'Medium' },
  { title: 'Ring 1881 og be dem velge 3 tall', description: 'Fra St. Olav-listen.', points: 20, difficulty: 'Medium' },
]

const hetlandKnuter: SeedKnute[] = [
  { title: 'Hetland: Lag papirfly i timen', description: null, points: 10, difficulty: 'Lett' },
  { title: 'Hetland: Snurr rundt 5 ganger før du svarer på spørsmål', description: null, points: 15, difficulty: 'Lett' },
  { title: 'Hetland: Bær lærerens sekk en hel dag', description: null, points: 20, difficulty: 'Medium' },
]

// A few traditional St. Olav knuter are gullknuter (test data). Indices into
// stOlavKnuter: 31 = russedåp, 35 = autograf (the one Loke completes → 1 gull),
// 40 = gå edru hele rt. The knutesjef flag drives this in real life.
const GOLD_INDICES = new Set([31, 35, 40])
// 18+ + text-only test data (ADR-0015 / ADR-0014): index 19 (komando) + 34
// (paparazzi/klint) are 18+; 34 is also text-only. Lets you verify the age gate
// (minor Odin won't see/submit them) + the evidence flag.
const AGE18_INDICES = new Set([19, 34])
const TEXT_INDICES = new Set([34])

const insertedStOlavKnuter = await supDb
  .insert(schema.knuter)
  .values(
    stOlavKnuter.map((k, i) => ({
      ...k,
      schoolId: stOlav.id,
      category: devCategory(k.title),
      isGold: GOLD_INDICES.has(i),
      minAge: AGE18_INDICES.has(i) ? 18 : 17,
      evidenceType: TEXT_INDICES.has(i) ? ('text' as const) : ('media' as const),
    })),
  )
  .returning()
const insertedHetlandKnuter = await supDb
  .insert(schema.knuter)
  .values(hetlandKnuter.map((k) => ({ ...k, schoolId: hetland.id, category: devCategory(k.title) })))
  .returning()

// School-side library: a couple of St. Olav folders + memberships (ADR-0014).
// "Alle knuter" is implicit (the unfiltered catalog), so it's not seeded here.
const insertedFolders = await supDb
  .insert(schema.knuteFolders)
  .values([
    { schoolId: stOlav.id, name: 'Mat-knuter', sortOrder: 0 },
    { schoolId: stOlav.id, name: 'Rampestreker', sortOrder: 1 },
    { schoolId: stOlav.id, name: 'Klassikere', sortOrder: 2 },
  ])
  .returning()
await supDb.insert(schema.knuteFolderMemberships).values([
  { schoolId: stOlav.id, folderId: insertedFolders[0]!.id, knuteId: insertedStOlavKnuter[0]!.id }, // frokost
  { schoolId: stOlav.id, folderId: insertedFolders[0]!.id, knuteId: insertedStOlavKnuter[9]!.id }, // nuggets
  { schoolId: stOlav.id, folderId: insertedFolders[1]!.id, knuteId: insertedStOlavKnuter[7]!.id }, // bjeff
  { schoolId: stOlav.id, folderId: insertedFolders[1]!.id, knuteId: insertedStOlavKnuter[28]!.id }, // surr bil
  { schoolId: stOlav.id, folderId: insertedFolders[2]!.id, knuteId: insertedStOlavKnuter[31]!.id }, // russedåp
])

// A handful of submissions so the DB has something to look at across screens.
// One already approved by Loke (so the leaderboard has real points), two
// pending (for the review queue).
const firstKnute = insertedStOlavKnuter[0]! // "Spis frokost under pulten" — 10p
const odinKnute = insertedStOlavKnuter[3]! // "Lag en heiarop-video for klassen" — 35p
const hetlandFirst = insertedHetlandKnuter[0]! // "Hetland: Lag papirfly i timen" — 10p
const hetlandSecond = insertedHetlandKnuter[1]!

await supDb.insert(schema.submissions).values([
  // St. Olav — two approved (leaderboard), two pending (review queue).
  {
    schoolId: stOlav.id,
    userId: userFrida.id,
    knuteId: firstKnute.id,
    imageKey: 'bunny/dev-seed/frokost-approved.webp',
    caption: 'Allerede godkjent — seed-data for topplisten',
    status: 'approved',
    reviewedBy: userLoke.id,
    reviewedAt: new Date(),
  },
  {
    schoolId: stOlav.id,
    userId: userOdin.id,
    knuteId: odinKnute.id,
    imageKey: 'bunny/dev-seed/heiarop-approved.webp',
    caption: 'Heiarop-video godkjent',
    status: 'approved',
    reviewedBy: userLoke.id,
    reviewedAt: new Date(),
  },
  {
    schoolId: stOlav.id,
    userId: userFrida.id,
    knuteId: insertedStOlavKnuter[1]!.id, // "Ta klassebilde med matchende solbriller"
    imageKey: 'bunny/dev-seed/klassebilde.webp',
    caption: 'Klarte det i 1. time uten å bli tatt',
    status: 'pending',
  },
  {
    schoolId: stOlav.id,
    userId: userFrida.id,
    knuteId: insertedStOlavKnuter[2]!.id, // "Møt opp med røde sokker hele dagen"
    imageKey: 'bunny/dev-seed/rode-sokker.webp',
    caption: null,
    status: 'pending',
  },
  // Hetland — one approved (leaderboard), one pending (review queue).
  {
    schoolId: hetland.id,
    userId: userTor.id,
    knuteId: hetlandFirst.id,
    imageKey: 'bunny/dev-seed/hetland-papirfly.webp',
    caption: 'Papirfly tvers over klasserommet',
    status: 'approved',
    reviewedBy: userBrage.id,
    reviewedAt: new Date(),
  },
  {
    schoolId: hetland.id,
    userId: userSaga.id,
    knuteId: hetlandSecond.id,
    imageKey: 'bunny/dev-seed/hetland-snurr.webp',
    caption: null,
    status: 'pending',
  },
])

// Loke is the default mobile identity, so give Loke a rich profile: a 3-day
// streak across several folders plus one gold knute (>= 30p). createdAt is set
// explicitly to past Oslo days — the streak is computed from the approved
// submission's day, so these consecutive days produce a streak of 3, and the
// spread across folders lights up multiple category rings.
const MS_PER_DAY = 24 * 60 * 60 * 1000
const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * MS_PER_DAY)

const lokeCompletions = [
  { knute: insertedStOlavKnuter[0]!, day: daysAgo(2) }, // frokost — Generelle, 10p
  { knute: insertedStOlavKnuter[10]!, day: daysAgo(2) }, // popp en snus — Alkoholknuter, 5p
  { knute: insertedStOlavKnuter[7]!, day: daysAgo(1) }, // bjeff — Fordervett-knuter, 10p
  { knute: insertedStOlavKnuter[34]!, day: daysAgo(1) }, // paparazzi — Sexknuter, 25p
  { knute: insertedStOlavKnuter[35]!, day: daysAgo(0) }, // autograf — Generelle, 30p (gold)
]

await supDb.insert(schema.submissions).values(
  lokeCompletions.map((c, i) => ({
    schoolId: stOlav.id,
    userId: userLoke.id,
    knuteId: c.knute.id,
    imageKey: `bunny/dev-seed/loke-${i}.webp`,
    caption: null,
    status: 'approved' as const,
    reviewedBy: userLoke.id,
    reviewedAt: c.day,
    createdAt: c.day,
  })),
)
const lokePoints = lokeCompletions.reduce((sum, c) => sum + c.knute.points, 0)

// Match each leaderboard to its pre-approved seed submissions (the approve flow
// normally awards points transactionally; here we set them directly).
await supDb.update(schema.users).set({ points: lokePoints }).where(eq(schema.users.id, userLoke.id))
await supDb.update(schema.users).set({ points: firstKnute.points }).where(eq(schema.users.id, userFrida.id))
await supDb.update(schema.users).set({ points: odinKnute.points }).where(eq(schema.users.id, userOdin.id))
await supDb.update(schema.users).set({ points: hetlandFirst.points }).where(eq(schema.users.id, userTor.id))

// ── Central knute library (ADR-0014). Shared catalog, seeded as SUPERUSER because
// app_role is read-only on library_* (migration 0014). Source: docs/library-seed-source.md
// → scripts/library-seed-data.ts. Sanity guards catch a truncated/mis-edited seed.
{
  const n = librarySeedKnuter.length
  const text = librarySeedKnuter.filter((k) => k.evidenceType === 'text').length
  const adult = librarySeedKnuter.filter((k) => k.minAge === 18).length
  const stavanger = librarySeedKnuter.filter((k) => k.region === 'Stavanger').length
  if (n !== 186) throw new Error(`library seed: expected 186 knuter, got ${n}`)
  if (text !== 24) throw new Error(`library seed: expected 24 text-only, got ${text}`)
  if (adult !== 21) throw new Error(`library seed: expected 21 adult-only (18+), got ${adult}`)
  if (stavanger !== 5) throw new Error(`library seed: expected 5 Stavanger-region, got ${stavanger}`)
}

const difficultyFor = (p: number): 'Lett' | 'Medium' | 'Hard' | 'Valgfri' =>
  p === 0 ? 'Valgfri' : p < 20 ? 'Lett' : p <= 45 ? 'Medium' : 'Hard'

const insertedLibrary = await supDb
  .insert(schema.libraryKnuter)
  .values(
    librarySeedKnuter.map((k) => ({
      title: k.title,
      description: k.description,
      points: k.points,
      difficulty: difficultyFor(k.points),
      evidenceType: k.evidenceType ?? ('media' as const),
      minAge: k.minAge ?? 17,
      suggestedFolder: k.folder,
      region: k.region ?? null,
    })),
  )
  .returning()

// "Anbefalt starter" = everything except the Sex folder. A sensible default the
// knutesjef curates later (no super-admin tool yet — edit it in library-seed-data.ts).
const [starterPack] = await supDb
  .insert(schema.libraryPacks)
  .values({
    name: 'Anbefalt starter',
    description: 'Et godt utgangspunkt — alt utenom Sex-mappa.',
    sortOrder: 0,
  })
  .returning()
const starterMembers = insertedLibrary.filter((k) => k.suggestedFolder !== 'Sex')
await supDb
  .insert(schema.libraryPackMemberships)
  .values(starterMembers.map((k) => ({ packId: starterPack!.id, libraryKnuteId: k.id })))

process.stdout.write(`  seeded:\n`)
process.stdout.write(`    library: ${insertedLibrary.length} knuter, ${starterMembers.length} i «Anbefalt starter»\n`)
process.stdout.write(`    klasser: 3STA + 3MKA (St. Olav), 3PBA (Hetland)\n`)
process.stdout.write(`    ${stOlav.name}: ${stOlavKnuter.length} knuter\n`)
process.stdout.write(`      ${userLoke.russenavn} (${userLoke.role})\n`)
process.stdout.write(`      ${userFrida.russenavn} (${userFrida.role})\n`)
process.stdout.write(`      ${userOdin.russenavn} (${userOdin.role})\n`)
process.stdout.write(`    ${hetland.name}: ${hetlandKnuter.length} knuter\n`)
process.stdout.write(`      ${userBrage.russenavn} (${userBrage.role})\n`)
process.stdout.write(`      ${userTor.russenavn} (${userTor.role})\n`)
process.stdout.write(`      ${userSaga.russenavn} (${userSaga.role})\n`)

// 5. Inject a fresh Loke token into apps/mobile/.env so the mobile app's
// bundled EXPO_PUBLIC_DEV_TOKEN matches the just-seeded user ids. Without
// this, every dev:setup invalidates the old token and the mobile shows
// either "0 knuter" (stale schoolId) or 401 (expired). TTL is 8h here —
// longer than 15min so it survives a typical dev session.
const lokeToken = await signDevToken(
  { sub: userLoke.id, school_id: stOlav.id, role: 'knutesjef' },
  '8h',
)

const mobileEnvPath = new URL('../../mobile/.env', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
)
const tokenLine = `EXPO_PUBLIC_DEV_TOKEN=${lokeToken}`
let envContent: string
if (existsSync(mobileEnvPath)) {
  const current = readFileSync(mobileEnvPath, 'utf8')
  envContent = /^EXPO_PUBLIC_DEV_TOKEN=.*$/m.test(current)
    ? current.replace(/^EXPO_PUBLIC_DEV_TOKEN=.*$/m, tokenLine)
    : current.replace(/\s*$/, `\n${tokenLine}\n`)
} else {
  envContent = `EXPO_PUBLIC_API_URL=http://localhost:3000\n${tokenLine}\n`
}
writeFileSync(mobileEnvPath, envContent)
process.stdout.write(`  wrote fresh Loke token to apps/mobile/.env\n`)

process.stdout.write(`\nDone. Run 'pnpm dev:all' to start API + mobile.\n`)

await supSql.end({ timeout: 5 })
process.exit(0)
