import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ListingDetailPage from '../src/pages/ListingDetailPage.jsx'
import { fetchListingById, startConversation } from '../src/services/api.js'

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser: { id: 1, role: 'customer', token: 'token' } }),
}))

vi.mock('../src/services/api.js', () => ({
  fetchListingById: vi.fn(),
  startConversation: vi.fn(),
}))

describe('ListingDetailPage', () => {
  it('shows listing gender, breeder avatar area, and share behavior', async () => {
    const user = userEvent.setup()
    fetchListingById.mockResolvedValueOnce({
      id: 10,
      title: 'Bengal kitten',
      name: 'Bengal kitten',
      breed: 'Bengal',
      gender: 'Male',
      age: '5 months',
      location: 'Paris',
      price: 1500,
      summary: 'Playful kitten',
      image: '/cat.png',
      images: [{ image_url: '/cat.png' }, { image_url: '/cat-side.png' }],
      breederId: 8,
      breeder: 'Leo Cattery',
      breederPhoto: '/leo.png',
    })

    render(
      <MemoryRouter initialEntries={['/customer/listings/10']}>
        <Routes>
          <Route path="/customer/listings/:listingId" element={<ListingDetailPage />} />
          <Route path="/customer/messages" element={<p>Messages route</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Bengal kitten')).toBeInTheDocument()
    expect(screen.getByText('Male')).toBeInTheDocument()
    expect(screen.getByText('Leo Cattery')).toBeInTheDocument()

    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(writeText).toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Listing link copied.')
    expect(screen.getByRole('button', { name: 'Previous image' })).toBeDisabled()
    const nextImage = screen.getByRole('button', { name: 'Next image' })
    expect(nextImage).toBeEnabled()
    await user.click(nextImage)
    expect(screen.getByText('Image 2 of 2')).toHaveAttribute('aria-live', 'polite')
    expect(nextImage).toBeDisabled()
  })

  it('starts a conversation from the detail page', async () => {
    const user = userEvent.setup()
    fetchListingById.mockResolvedValueOnce({ id: 11, title: 'Milo', name: 'Milo', breed: 'Siamese', location: 'Lyon', price: 900, images: [] })
    startConversation.mockResolvedValueOnce({ conversation: { id: 2 } })

    render(
      <MemoryRouter initialEntries={['/customer/listings/11']}>
        <Routes>
          <Route path="/customer/listings/:listingId" element={<ListingDetailPage />} />
          <Route path="/customer/messages" element={<p>Messages route</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText('Milo')
    await user.click(screen.getByRole('button', { name: 'Send a message' }))

    await waitFor(() => expect(startConversation).toHaveBeenCalledWith(11))
    expect(await screen.findByText('Messages route')).toBeInTheDocument()
  })
})