import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ListingDetailPage from '../src/pages/ListingDetailPage.jsx'
import Seo, { RouteSeo } from '../src/components/Seo.jsx'
import { fetchListingById } from '../src/services/api.js'

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser: null }),
}))

vi.mock('../src/services/api.js', () => ({
  fetchListingById: vi.fn(),
  startConversation: vi.fn(),
}))

afterEach(() => {
  cleanup()
  document.head.querySelector('link[rel="canonical"]')?.remove()
  document.head.querySelector('meta[name="robots"]')?.remove()
  vi.clearAllMocks()
})

function meta(name) {
  return document.head.querySelector(`meta[name="${name}"]`)?.content
}

function canonical() {
  return document.head.querySelector('link[rel="canonical"]')?.href
}

describe('public SEO', () => {
  it('updates title, canonical, robots and Open Graph across navigation', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteSeo />
        <nav>
          <Link to="/">Home</Link>
          <Link to="/customer/listings">Listings</Link>
          <Link to="/login">Login</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Seo title="Find your cat" description="Meet cats from breeders." />} />
          <Route path="/customer/listings" element={<Seo title="Browse cat listings" description="Browse available cats." />} />
          <Route path="/login" element={<div>Sign in</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(document.title).toBe('Find your cat | Purrfect Match')
    expect(canonical()).toBe(new URL('/', window.location.origin).href)
    expect(meta('robots')).toBe('index,follow')
    expect(document.head.querySelector('meta[property="og:title"]')?.content).toBe(document.title)

    await user.click(screen.getByRole('link', { name: 'Listings' }))
    await waitFor(() => expect(document.title).toBe('Browse cat listings | Purrfect Match'))
    expect(canonical()).toBe(new URL('/customer/listings', window.location.origin).href)

    await user.click(screen.getByRole('link', { name: 'Login' }))
    await waitFor(() => expect(meta('robots')).toBe('noindex,nofollow'))
    expect(canonical()).toBeUndefined()
    expect(document.head.querySelector('meta[property="og:title"]')).toBeNull()
  })

  it('clears listing metadata when the next listing is missing', async () => {
    const user = userEvent.setup()
    fetchListingById.mockImplementation((id) => id === '10'
      ? Promise.resolve({ id: 10, name: 'Milo', title: 'Milo', breed: 'Siamese', location: 'Lyon', price: 900, images: [] })
      : Promise.reject(new Error('Missing')))

    render(
      <MemoryRouter initialEntries={['/customer/listings/10']}>
        <RouteSeo />
        <Link to="/customer/listings/999">Missing listing</Link>
        <Routes>
          <Route path="/customer/listings/:listingId" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => expect(canonical()).toBe(new URL('/customer/listings/10', window.location.origin).href))
    await user.click(screen.getByRole('link', { name: 'Missing listing' }))
    await screen.findByText('Listing not found')
    expect(meta('robots')).toBe('noindex,nofollow')
    expect(canonical()).toBeUndefined()
  })
})
