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
  {
    files: ['apps/api/src/**/*.ts'],
    ignores: [
      'apps/api/src/db/**',
      'apps/api/src/middleware/tenant-context.ts',
      'apps/api/src/test/**',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/db/client', '**/db/client.js'],
              allowTypeImports: true,
              message:
                "Bypasses RLS tenant scoping. Use the transaction from tenantContext(): c.get('tx'). See .claude/rules/backend.md §7.",
            },
          ],
        },
      ],
    },
  },

  // 2. No sql.raw() (injection vector — database.md §5) and no process.env
  //    outside the typed config module (backend.md §12).
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
          selector: 'MemberExpression[object.name="process"][property.name="env"]',
          message:
            'Use the typed config module (apps/api/src/config.ts), not process.env. See .claude/rules/backend.md §12.',
        },
      ],
    },
  },

  // Places that legitimately read process.env (env bootstrap) keep only the
  // sql.raw ban. NOTE: this block must come AFTER block 2 — for these files
  // it REPLACES the rule options above.
  {
    files: [
      'apps/api/src/config.ts',
      'apps/api/src/test/**/*.ts',
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
      ],
    },
  },
]
