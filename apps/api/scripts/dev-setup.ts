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

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as schema from '../src/db/schema/index.js'

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
process.stdout.write(`  grants applied\n`)

// 3. Seed: two schools, one user each.
const insertedSchools = await supDb
  .insert(schema.schools)
  .values([{ name: 'St. Olav vgs' }, { name: 'Testskolen' }])
  .returning()
const stOlav = insertedSchools[0]!
const testskolen = insertedSchools[1]!

const insertedUsers = await supDb
  .insert(schema.users)
  .values([
    // Loke is St. Olav's knutesjef so dev:token gives you a token that
    // can both READ via GET /api/knuter and WRITE via POST /api/knuter.
    { schoolId: stOlav.id, russenavn: 'Loke', role: 'knutesjef' },
    { schoolId: stOlav.id, russenavn: 'Frida', role: 'student' },
    { schoolId: testskolen.id, russenavn: 'Tor', role: 'student' },
  ])
  .returning()
const userLoke = insertedUsers[0]!
const userFrida = insertedUsers[1]!
const userTor = insertedUsers[2]!

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

const testskolenKnuter: SeedKnute[] = [
  { title: 'Testskolen: Lag papirfly i timen', description: null, points: 10, difficulty: 'Lett' },
  { title: 'Testskolen: Snurr rundt 5 ganger før du svarer på spørsmål', description: null, points: 15, difficulty: 'Lett' },
  { title: 'Testskolen: Bær lærerens sekk en hel dag', description: null, points: 20, difficulty: 'Medium' },
]

await supDb.insert(schema.knuter).values(
  stOlavKnuter.map((k) => ({ ...k, schoolId: stOlav.id })),
)
await supDb.insert(schema.knuter).values(
  testskolenKnuter.map((k) => ({ ...k, schoolId: testskolen.id })),
)

process.stdout.write(`  seeded:\n`)
process.stdout.write(`    ${stOlav.name}: ${stOlavKnuter.length} knuter, users:\n`)
process.stdout.write(`      ${userLoke.russenavn} (${userLoke.role}, ${userLoke.id.slice(0, 8)}…)\n`)
process.stdout.write(`      ${userFrida.russenavn} (${userFrida.role}, ${userFrida.id.slice(0, 8)}…)\n`)
process.stdout.write(`    ${testskolen.name}: ${testskolenKnuter.length} knuter, users:\n`)
process.stdout.write(`      ${userTor.russenavn} (${userTor.role}, ${userTor.id.slice(0, 8)}…)\n`)
process.stdout.write(`\nDone. Run 'pnpm dev' to start the API, 'pnpm dev:token' to get a token.\n`)

await supSql.end({ timeout: 5 })
process.exit(0)
