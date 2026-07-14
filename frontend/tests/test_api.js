import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: { request: { use: vi.fn() } },
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