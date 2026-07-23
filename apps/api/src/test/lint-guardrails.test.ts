import { describe, it, expect, beforeAll } from 'vitest'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

// The guardrails' own guardrail. `pnpm lint` being green proves the rules
// have no false positives — but it is indistinguishable from the rules not
// running at all (a glob typo, a per-package eslint.config.js shadowing the
// root one, a later block replacing the options). This suite lints known-bad
// snippets THROUGH the real root config and asserts the rules still fire.
// If any assertion here fails, the guardrails are decorative — fix the
// config, not this test.

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..')

type LintMessage = { ruleId: string | null }
type LintResult = { messages: LintMessage[] }
type ESLintInstance = {
  lintText(code: string, options: { filePath: string }): Promise<LintResult[]>
}
type ESLintCtor = new (options: { cwd: string }) => ESLintInstance

let eslint: ESLintInstance

// Lint as if the snippet lived in a real route file — the path decides which
// config blocks apply, the content is ours.
const ROUTE_PATH = path.join(repoRoot, 'apps/api/src/routes/__guardrail_fixture__.ts')
const CONFIG_PATH = path.join(repoRoot, 'apps/api/src/config.ts')

async function ruleIdsFor(code: string, filePath: string): Promise<(string | null)[]> {
  const results = await eslint.lintText(code, { filePath })
  return results.flatMap((r) => r.messages.map((m) => m.ruleId))
}

beforeAll(async () => {
  // eslint is a workspace-root devDependency (pnpm does not hoist it into
  // apps/api), so resolve it from the root and import by URL.
  const rootRequire = createRequire(path.join(repoRoot, 'package.json'))
  const eslintEntry = rootRequire.resolve('eslint')
  const mod = (await import(pathToFileURL(eslintEntry).href)) as { ESLint: ESLintCtor }
  eslint = new mod.ESLint({ cwd: repoRoot })
})

describe('backend lint guardrails actually fire', () => {
  it('db-seam: value-importing db/client in a route errors', async () => {
    const ids = await ruleIdsFor(
      "import { db } from '../db/client.js'\nexport const x = db\n",
      ROUTE_PATH,
    )
    expect(ids).toContain('@typescript-eslint/no-restricted-imports')
  })

  it('db-seam: constructing your OWN client in a route errors (postgres + drizzle adapter)', async () => {
    const ids = await ruleIdsFor(
      "import postgres from 'postgres'\nimport { drizzle } from 'drizzle-orm/postgres-js'\nexport const x = drizzle(postgres('u'))\n",
      ROUTE_PATH,
    )
    expect(ids).toContain('@typescript-eslint/no-restricted-imports')
  })

  it('env-seam: import { env } from node:process errors', async () => {
    const ids = await ruleIdsFor(
      "import { env } from 'node:process'\nexport const x = env\n",
      ROUTE_PATH,
    )
    expect(ids).toContain('@typescript-eslint/no-restricted-imports')
  })

  it('sql.raw errors — dot and bracket access both', async () => {
    const dot = await ruleIdsFor(
      "import { sql } from 'drizzle-orm'\nexport const q = sql.raw('x')\n",
      ROUTE_PATH,
    )
    const bracket = await ruleIdsFor(
      "import { sql } from 'drizzle-orm'\nexport const q = sql['raw']('x')\n",
      ROUTE_PATH,
    )
    expect(dot).toContain('no-restricted-syntax')
    expect(bracket).toContain('no-restricted-syntax')
  })

  it('process.env errors in a route — dot and bracket access both', async () => {
    const dot = await ruleIdsFor('export const x = process.env.FOO\n', ROUTE_PATH)
    const bracket = await ruleIdsFor("export const x = process['env'].FOO\n", ROUTE_PATH)
    expect(dot).toContain('no-restricted-syntax')
    expect(bracket).toContain('no-restricted-syntax')
  })

  it('exemption intact: config.ts may read process.env (the env bootstrap)', async () => {
    const ids = await ruleIdsFor('export const x = process.env.FOO\n', CONFIG_PATH)
    expect(ids).not.toContain('no-restricted-syntax')
  })

  it('exemption is narrow: sql.raw stays banned even in config.ts', async () => {
    const ids = await ruleIdsFor(
      "import { sql } from 'drizzle-orm'\nexport const q = sql.raw('x')\n",
      CONFIG_PATH,
    )
    expect(ids).toContain('no-restricted-syntax')
  })
})
