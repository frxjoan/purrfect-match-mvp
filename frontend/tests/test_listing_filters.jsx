import { describe, expect, it } from 'vitest'
import { applyListingFilters, countActiveListingFilters, emptyListingFilters, getListingFilterOptions } from '../src/utils/listingFilters.js'

const listings = [
  { id: 1, title: 'Maine Coon kitten', breed: 'Maine Coon', gender: 'Male', location: 'Lyon', price: 1200, status: 'Available' },
  { id: 2, title: 'Siamese kitten', breed: 'Siamese', gender: 'Female', location: 'Paris', price: 900, status: 'Reserved' },
]

describe('listing filters', () => {
  it('filters by search text and structured fields together', () => {
    const result = applyListingFilters(listings, 'kitten', { ...emptyListingFilters, gender: 'Female', maxPrice: '1000' })

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Siamese kitten')
  })

  it('builds filter options from loaded listings', () => {
    const options = getListingFilterOptions(listings)

    expect(options.breeds).toEqual(['Maine Coon', 'Siamese'])
    expect(options.locations).toEqual(['Lyon', 'Paris'])
  })

  it('counts active filters only', () => {
    expect(countActiveListingFilters({ ...emptyListingFilters, breed: 'Siamese', minPrice: '500' })).toBe(2)
  })
})