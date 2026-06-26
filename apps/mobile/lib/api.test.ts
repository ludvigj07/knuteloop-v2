import { fetchKnuter } from './api'

// getActiveToken must return a token so apiFetch reaches the fetch call.
jest.mock('./auth', () => ({ getActiveToken: () => 'test-token' }))

describe('apiFetch error handling', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
    jest.restoreAllMocks()
  })

  it('surfaces the server error message on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({ error: { message: 'Knuten er allerede importert' } }),
    }) as unknown as typeof fetch

    await expect(fetchKnuter()).rejects.toThrow('Knuten er allerede importert')
  })

  it('falls back to a generic message when the body is not JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('not json')
      },
    }) as unknown as typeof fetch

    await expect(fetchKnuter()).rejects.toThrow('API svarte 500 Internal Server Error.')
  })

  it('appends the dev hint on a 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({}),
    }) as unknown as typeof fetch

    await expect(fetchKnuter()).rejects.toThrow('Re-kjør dev:token')
  })
})
