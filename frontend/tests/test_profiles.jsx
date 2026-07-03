import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CustomerProfilePage from '../src/pages/CustomerProfilePage.jsx'
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '../src/services/api.js'
import { getStoredProfileImage, setStoredProfileImage } from '../src/utils/profileImageStorage.js'

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser: { id: 5, email: 'customer@test.dev', role: 'customer', token: 'token' } }),
}))

vi.mock('../src/services/api.js', () => ({
  fetchCurrentUserProfile: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
}))

describe('profile editing', () => {
  it('loads and saves editable profile fields', async () => {
    const user = userEvent.setup()
    fetchCurrentUserProfile.mockResolvedValueOnce({ user: { id: 5, email: 'customer@test.dev', first_name: 'Alice', last_name: 'Customer', location: 'Lyon', phone_number: '' } })
    updateCurrentUserProfile.mockResolvedValueOnce({ user: { id: 5, email: 'customer@test.dev', first_name: 'Alice', last_name: 'Martin', location: 'Paris', phone_number: '123' } })

    render(<MemoryRouter><CustomerProfilePage /></MemoryRouter>)

    const lastName = await screen.findByLabelText('Last name')
    await user.clear(lastName)
    await user.type(lastName, 'Martin')
    await user.clear(screen.getByLabelText('Location'))
    await user.type(screen.getByLabelText('Location'), 'Paris')
    await user.type(screen.getByLabelText('Phone number'), '123')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(updateCurrentUserProfile).toHaveBeenCalledWith(expect.objectContaining({
      last_name: 'Martin',
      location: 'Paris',
      phone_number: '123',
    })))
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
  })

  it('stores profile images by authenticated user identity', () => {
    const user = { id: 5, email: 'customer@test.dev' }

    setStoredProfileImage(user, 'data:image/png;base64,cat')

    expect(getStoredProfileImage(user)).toBe('data:image/png;base64,cat')
  })
})