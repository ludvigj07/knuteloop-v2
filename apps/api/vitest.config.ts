import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    hookTimeout: 60_000,
    testTimeout: 30_000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
