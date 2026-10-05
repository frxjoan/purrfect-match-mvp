import { render, screen } from '@testing-library/react'
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
    await user.click(screen.getByRole('button', { name: 'Save listing for Maine Coon kitten' }))

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

    const filterButton = screen.getByRole('button', { name: 'Open listing filters' })
    await user.click(filterButton)
    expect(filterButton).toHaveAttribute('aria-expanded', 'true')
    await user.selectOptions(screen.getByLabelText('Gender'), 'Female')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ gender: 'Female' }))
    expect(filterButton).toHaveFocus()
    expect(filterButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes filters with Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<CustomerSearchBar filters={emptyListingFilters} listings={[listing]} onChange={vi.fn()} value="" />)
    const trigger = screen.getByRole('button', { name: 'Open listing filters' })
    await user.click(trigger)
    await user.click(screen.getByRole('combobox', { name: 'Breed' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('combobox', { name: 'Breed' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('keeps search text controlled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<CustomerSearchBar filters={emptyListingFilters} listings={[]} onChange={onChange} value="" />)
    await user.type(screen.getByRole('searchbox', { name: 'Search listings' }), 'bengal')

    expect(onChange).toHaveBeenCalledWith('b')
  })
})