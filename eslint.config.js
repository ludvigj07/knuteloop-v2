import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
    },
  },

  // ==========================================================================
  // Backend guardrails (apps/api) — mechanical enforcement of the rules in
  // .claude/rules/backend.md §7 and database.md §5. These run in `pnpm lint`
  // and CI, so a violation can never merge regardless of who (or what) wrote
  // the code.
  // ==========================================================================

  // 1. The tenant seam: handlers must use the RLS-scoped `tx` from
  //    tenantContext() — never the global `db`. Only the middleware that
  //    OPENS the tenant transaction may value-import db/client.
  //    `import type { db }` stays allowed everywhere (it's just the Tx type).
  //
  //    Review-hardened (2026-07-24): the seam is also closed against
  //    (a) building your OWN client (`import postgres`/`drizzle-orm/postgres-js`
  //        — the routes/dev.ts pattern must never spread to real routes),
  //    (b) laundering db through a barrel inside db/** (`export { db } from
  //        './client.js'` — relative specifiers are banned and db/** is no
  //        longer exempt; schema files never import the client), and
  //    (c) `import { env } from 'node:process'` walking around the
  //        process.env syntax ban below.
  //    Known future exemptions (add HERE with a comment when they land):
  //    real auth middleware (token_version lookup runs before tenantContext)
  //    and /healthz's DB ping.
  //    NOTE: later blocks for overlapping files REPLACE these options —
  //    extend THIS patterns array, never add a parallel block.
  {
    files: ['apps/api/src/**/*.ts'],
    ignores: [
      'apps/api/src/db/client.ts', // the client module itself
      'apps/api/src/middleware/tenant-context.ts',
      'apps/api/src/test/**',
      'apps/api/src/routes/dev.ts', // dev-only: builds a superuser client for the identity switcher
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/db/client',
                '**/db/client.js',
                './client',
                './client.js',
                '../client',
                '../client.js',
              ],
              allowTypeImports: true,
              message:
                "Bypasses RLS tenant scoping. Use the transaction from tenantContext(): c.get('tx'). See .claude/rules/backend.md §7.",
            },
            {
              group: ['postgres', 'drizzle-orm/postgres-js'],
              allowTypeImports: true,
              message:
                'Building your own DB client bypasses the RLS tenant seam entirely. Use the transaction from tenantContext(). See .claude/rules/backend.md §7.',
            },
            {
              group: ['process', 'node:process'],
              allowTypeImports: true,
              message:
                'Use the typed config module (apps/api/src/config.ts), not process/env imports. See .claude/rules/backend.md §12.',
            },
          ],
        },
      ],
    },
  },

  // 2. No sql.raw() (injection vector — database.md §5) and no process.env
  //    outside the typed config module (backend.md §12). Both selectors have
  //    computed-property twins (sql['raw'], process['env']) so the ban can't
  //    be dodged with bracket access.
  {
    files: ['apps/api/src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="sql"][callee.property.name="raw"]',
          message:
            'sql.raw() is a SQL injection vector. Use the parameterized sql`...` template. See .claude/rules/database.md §5.',
        },
        {
          selector: 'CallExpression[callee.object.name="sql"][callee.property.value="raw"]',
          message:
            "sql['raw']() is a SQL injection vector. Use the parameterized sql`...` template. See .claude/rules/database.md §5.",
        },
        {
          selector: 'MemberExpression[object.name="process"][property.name="env"]',
          message:
            'Use the typed config module (apps/api/src/config.ts), not process.env. See .claude/rules/backend.md §12.',
        },
        {
          selector: 'MemberExpression[object.name="process"][property.value="env"]',
          message:
            "Use the typed config module (apps/api/src/config.ts), not process['env']. See .claude/rules/backend.md §12.",
        },
      ],
    },
  },

  // Places that legitimately read process.env (env bootstrap) keep only the
  // sql.raw ban (both selector variants). Co-located unit tests
  // (src/**/*.test.ts) are exempt like src/test/** — the repo has both test
  // conventions. NOTE: this block must come AFTER block 2 — for these files
  // it REPLACES the rule options above.
  {
    files: [
      'apps/api/src/config.ts',
      'apps/api/src/test/**/*.ts',
      'apps/api/src/**/*.test.ts',
      'apps/api/src/routes/dev.ts', // dev-only seeding, reads SUPERUSER_DATABASE_URL
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="sql"][callee.property.name="raw"]',
          message:
            'sql.raw() is a SQL injection vector. Use the parameterized sql`...` template. See .claude/rules/database.md §5.',
        },
        {
          selector: 'CallExpression[callee.object.name="sql"][callee.property.value="raw"]',
          message:
            "sql['raw']() is a SQL injection vector. Use the parameterized sql`...` template. See .claude/rules/database.md §5.",
        },
      ],
    },
  },
]
