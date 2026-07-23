import { fetchKnuter, fetchLibraryKnuter } from './api'

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

  it('maps a zod-400 (issues present) to a bokmål message, not English "Invalid input"', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: { message: 'Invalid input', issues: { fieldErrors: {} } } }),
    }) as unknown as typeof fetch

    await expect(fetchKnuter()).rejects.toThrow('Ugyldige verdier')
  })

  it('appends the dev hint on a 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({}),
    }) as unknown as typeof fetch

    await expect(fetchKnuter()).rejects.toThrow('Velg bruker på nytt under «Bytt bruker (dev)»')
  })
})

describe('fetchLibraryKnuter query string', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
  })

  it('passes folder, region, search, limit and offset to the API', async () => {
    const spy = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ knuter: [] }),
    })
    global.fetch = spy as unknown as typeof fetch

    await fetchLibraryKnuter({ folder: 'Sex', region: 'nasjonalt', q: 'shot', limit: 30, offset: 60 })

    const url = String(spy.mock.calls[0][0])
    expect(url).toContain('folder=Sex')
    expect(url).toContain('region=nasjonalt')
    expect(url).toContain('q=shot')
    expect(url).toContain('limit=30')
    expect(url).toContain('offset=60')
  })
})
