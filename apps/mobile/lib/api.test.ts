import { fetchKnuter, fetchLibraryKnuter } from './api'

// Stateful auth mock: the 401 self-heal swaps the active identity mid-flight,
// so the mock must actually store what setActiveIdentity writes.
jest.mock('./auth', () => {
  let token = 'test-token'
  let user: unknown = null
  return {
    getActiveToken: () => token,
    getActiveUser: () => user,
    setActiveIdentity: (nextToken: string, nextUser: unknown) => {
      token = nextToken
      user = nextUser
    },
    __resetAuthMock: (nextToken: string, nextUser: unknown) => {
      token = nextToken
      user = nextUser
    },
  }
})

const { __resetAuthMock } = jest.requireMock('./auth') as {
  __resetAuthMock: (token: string, user: unknown) => void
}

describe('apiFetch error handling', () => {
  const realFetch = global.fetch
  beforeEach(() => __resetAuthMock('test-token', null))
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

  it('appends the dev hint on a 401 when no identity can self-heal', async () => {
    // getActiveUser is null (beforeEach) — recovery bails, the 401 surfaces.
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({}),
    }) as unknown as typeof fetch

    await expect(fetchKnuter()).rejects.toThrow('Velg bruker på nytt under «Bytt bruker (dev)»')
  })

  it('self-heals a 401 by re-adopting the stored identity and retrying once', async () => {
    const lokeUser = {
      userId: 'stale-user-id',
      russenavn: 'Loke',
      role: 'knutesjef',
      schoolId: 'stale-school-id',
      schoolName: 'St. Olav vgs',
    }
    __resetAuthMock('stale-token', lokeUser)

    const spy = jest
      .fn()
      // 1: original request fails with 401 (stale token)
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) })
      // 2: /api/dev/users returns the same identity with a fresh token
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          users: [{ ...lokeUser, userId: 'fresh-user-id', token: 'fresh-token' }],
        }),
      })
      // 3: the retried request succeeds
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ knuter: [] }) })
    global.fetch = spy as unknown as typeof fetch

    await expect(fetchKnuter()).resolves.toEqual({ knuter: [] })
    expect(spy).toHaveBeenCalledTimes(3)
    expect(String(spy.mock.calls[1][0])).toContain('/api/dev/users')
    const retryHeaders = (spy.mock.calls[2][1] as RequestInit).headers as Record<string, string>
    expect(retryHeaders.Authorization).toBe('Bearer fresh-token')
  })

  it('gives up after one heal attempt — a still-invalid token does not loop', async () => {
    __resetAuthMock('stale-token', {
      userId: 'u1',
      russenavn: 'Loke',
      role: 'knutesjef',
      schoolId: 's1',
      schoolName: 'St. Olav vgs',
    })

    const spy = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          users: [{ userId: 'u1', russenavn: 'Loke', role: 'knutesjef', schoolId: 's1', schoolName: 'St. Olav vgs', token: 'fresh-token' }],
        }),
      })
      // Retry ALSO 401s — must surface the error, not heal again.
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) })
    global.fetch = spy as unknown as typeof fetch

    await expect(fetchKnuter()).rejects.toThrow('Velg bruker på nytt')
    expect(spy).toHaveBeenCalledTimes(3)
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
