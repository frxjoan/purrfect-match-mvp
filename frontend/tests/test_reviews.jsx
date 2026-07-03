import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CustomerReviewsPage from '../src/pages/CustomerReviewsPage.jsx'
import PublicBreederProfilePage from '../src/pages/PublicBreederProfilePage.jsx'
import { deleteReview, fetchBreederReviews, fetchListings, fetchPublicBreederProfile, updateReview } from '../src/services/api.js'

let currentUser = { id: 2, role: 'customer', token: 'token', email: 'alice@test.dev' }

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser }),
}))

vi.mock('../src/services/api.js', () => ({
  createBreederReview: vi.fn(),
  deleteReview: vi.fn(),
  fetchBreederReviews: vi.fn(),
  fetchListings: vi.fn(),
  fetchPublicBreederProfile: vi.fn(),
  updateReview: vi.fn(),
}))

describe('reviews', () => {
  it('discovers reviews written by the current customer', async () => {
    fetchListings.mockResolvedValueOnce({ listings: [{ id: 1, breederId: 9, breeder: 'Leo Cattery' }] })
    fetchPublicBreederProfile.mockResolvedValueOnce({ breeder_profile: { business_name: 'Leo Cattery' } })
    fetchBreederReviews.mockResolvedValueOnce({ reviews: [
      { id: 7, reviewer_id: 2, rating: 5, comment: 'Great breeder', created_at: '2026-07-02T12:00:00Z' },
      { id: 8, reviewer_id: 3, rating: 4, comment: 'Other review' },
    ] })

    render(<MemoryRouter><CustomerReviewsPage /></MemoryRouter>)

    expect(await screen.findByText('Leo Cattery')).toBeInTheDocument()
    expect(screen.getByText('Great breeder')).toBeInTheDocument()
    expect(screen.queryByText('Other review')).not.toBeInTheDocument()
  })

  it('lets customers edit and delete only their own review', async () => {
    const user = userEvent.setup()
    fetchPublicBreederProfile.mockResolvedValueOnce({ breeder_profile: { id: 9, business_name: 'Leo Cattery', user_id: 99 } })
    fetchBreederReviews.mockResolvedValue({ reviews: [
      { id: 7, reviewer_id: 2, rating: 4, comment: 'Original comment', created_at: '2026-07-02T12:00:00Z', reviewer: { first_name: 'Alice' } },
      { id: 8, reviewer_id: 3, rating: 5, comment: 'Other comment', reviewer: { first_name: 'Bob' } },
    ] })
    fetchListings.mockResolvedValueOnce({ listings: [] })
    updateReview.mockResolvedValueOnce({ review: { id: 7, reviewer_id: 2, rating: 5, comment: 'Updated comment', reviewer: { first_name: 'Alice' } } })
    deleteReview.mockResolvedValueOnce({})

    render(
      <MemoryRouter initialEntries={['/breeders/9']}>
        <Routes><Route path="/breeders/:breederId" element={<PublicBreederProfilePage />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Original comment')).toBeInTheDocument()
    expect(screen.getByText('Other comment')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Edit review' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Delete review' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Edit review' }))
    const editableComment = screen.getAllByLabelText('Comment').find((field) => !field.disabled)
    await user.clear(editableComment)
    await user.type(editableComment, 'Updated comment')
    await user.click(screen.getByRole('button', { name: 'Save review' }))

    await waitFor(() => expect(updateReview).toHaveBeenCalledWith(7, expect.objectContaining({ comment: 'Updated comment' })))
    await user.click(screen.getByRole('button', { name: 'Delete review' }))

    await waitFor(() => expect(deleteReview).toHaveBeenCalledWith(7))
  })
})