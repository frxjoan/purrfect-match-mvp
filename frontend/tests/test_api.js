import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => apiMock),
  },
}))

const service = await import('../src/services/api.js')

describe('api service helpers', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.post.mockReset()
    apiMock.patch.mockReset()
    apiMock.put.mockReset()
    apiMock.delete.mockReset()
  })

  it('bootstraps, sends, and rotates the refresh CSRF token', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: {
        data: { refresh_csrf_token: 'csrf-before-refresh' },
      },
    })
    apiMock.post
      .mockResolvedValueOnce({
        data: {
          data: {
            access_token: 'access-after-refresh',
            refresh_csrf_token: 'csrf-after-refresh',
            user: { id: 2, email: 'security@test.com', role: 'customer' },
          },
        },
      })
      .mockResolvedValueOnce({
        data: { data: { message: 'Logged out successfully.' } },
      })

    const session = await service.refreshSession()

    expect(apiMock.get).toHaveBeenCalledWith('/auth/refresh/csrf', {
      skipAuthHeader: true,
      skipAuthRefresh: true,
    })
    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      '/auth/refresh',
      null,
      {
        headers: { 'X-CSRF-TOKEN': 'csrf-before-refresh' },
        skipAuthHeader: true,
        skipAuthRefresh: true,
      },
    )
    expect(session).toEqual({
      user: { id: 2, email: 'security@test.com', role: 'customer' },
    })

    await service.logoutUser()
    expect(apiMock.post.mock.calls[1][2].headers).toEqual({
      'X-CSRF-TOKEN': 'csrf-after-refresh',
    })
  })

  it('normalizes listing fields for the UI', () => {
    const listing = service.normalizeListing({
      id: 8,
      title: 'Bengal kitten',
      age_months: 14,
      gender: 'female',
      price: '1400',
      status: 'available',
      breeder: { id: 9, business_name: 'Leo Cattery', profile_picture_url: '/leo.png' },
      images: [{ image_url: '/cat.png' }],
    })

    expect(listing.gender).toBe('Female')
    expect(listing.age).toBe('1 year, 2 months')
    expect(listing.breeder).toBe('Leo Cattery')
    expect(listing.image).toBe('/cat.png')
  })

  it('fetches listings from the real centralized route helper', async () => {
    apiMock.get.mockResolvedValueOnce({ data: { listings: [{ id: 1, title: 'Milo', price: 700 }] } })

    const data = await service.fetchListings()

    expect(apiMock.get).toHaveBeenCalledWith('/listings', { params: {} })
    expect(data.listings[0].title).toBe('Milo')
  })

  it('sends conversation messages through the conversation endpoint', async () => {
    apiMock.post.mockResolvedValueOnce({ data: { message: { id: 5, content: 'Hello' } } })

    await service.sendConversationMessage(12, 'Hello')

    expect(apiMock.post).toHaveBeenCalledWith('/conversations/12/messages', { content: 'Hello' })
  })
})