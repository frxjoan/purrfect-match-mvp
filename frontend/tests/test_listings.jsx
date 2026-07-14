import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CustomerSearchBar from '../src/components/CustomerSearchBar.jsx'
import ListingCard from '../src/components/ListingCard.jsx'
import { emptyListingFilters } from '../src/utils/listingFilters.js'

const listing = {
  id: 1,
  title: 'Maine Coon kitten',
  breed: 'Maine Coon',
  gender: 'Female',
  age: '4 months',
  location: 'Lyon',
  price: 1200,
  status: 'Available',
  breederId: 4,
  breeder: 'Mia Cattery',
}

describe('listings UI', () => {
  it('renders listing cards with gender and save actions', async () => {
    const user = userEvent.setup()
    const onToggleSave = vi.fn()

    render(<MemoryRouter><ListingCard listing={listing} onToggleSave={onToggleSave} /></MemoryRouter>)

    expect(screen.getByText('Female')).toBeInTheDocument()
    expect(screen.getByText('Mia Cattery')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save listing' }))

    expect(onToggleSave).toHaveBeenCalledWith(1)
  })

  it('opens the paw filter panel and applies filters', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()

    render(
      <CustomerSearchBar
        filters={emptyListingFilters}
        listings={[listing, { ...listing, id: 2, gender: 'Male', breed: 'Siamese', location: 'Paris' }]}
        onChange={vi.fn()}
        onFiltersChange={onFiltersChange}
        value=""
      />,
    )

    await user.click(screen.getByLabelText('Open listing filters'))
    await user.selectOptions(screen.getByLabelText('Gender'), 'Female')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ gender: 'Female' }))
  })

  it('keeps search text controlled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<CustomerSearchBar filters={emptyListingFilters} listings={[]} onChange={onChange} value="" />)
    await user.type(screen.getByPlaceholderText('Orange cat...'), 'bengal')

    expect(onChange).toHaveBeenCalledWith('b')
  })
})