export const emptyListingFilters = {
  breed: '',
  location: '',
  gender: '',
  minPrice: '',
  maxPrice: '',
  status: '',
}

function normalizeValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function matchesText(listing, query) {
  const value = normalizeValue(query)

  if (!value) {
    return true
  }

  const haystack = [listing.name, listing.title, listing.breed, listing.location, listing.gender, listing.status]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(value)
}

export function countActiveListingFilters(filters = emptyListingFilters) {
  return Object.values(filters).filter((value) => String(value ?? '').trim() !== '').length
}

export function applyListingFilters(listings, query, filters = emptyListingFilters) {
  const breed = normalizeValue(filters.breed)
  const location = normalizeValue(filters.location)
  const gender = normalizeValue(filters.gender)
  const status = normalizeValue(filters.status)
  const minPrice = filters.minPrice === '' ? null : Number(filters.minPrice)
  const maxPrice = filters.maxPrice === '' ? null : Number(filters.maxPrice)

  return listings.filter((listing) => {
    const listingPrice = Number(listing.price ?? 0)

    return matchesText(listing, query)
      && (!breed || normalizeValue(listing.breed) === breed)
      && (!location || normalizeValue(listing.location).includes(location))
      && (!gender || normalizeValue(listing.gender) === gender)
      && (!status || normalizeValue(listing.status) === status)
      && (minPrice === null || listingPrice >= minPrice)
      && (maxPrice === null || listingPrice <= maxPrice)
  })
}

export function getListingFilterOptions(listings) {
  const toOptions = (values) => Array.from(new Set(values.filter(Boolean).map(String))).sort((a, b) => a.localeCompare(b))

  return {
    breeds: toOptions(listings.map((listing) => listing.breed)),
    genders: toOptions(listings.map((listing) => listing.gender)),
    locations: toOptions(listings.map((listing) => listing.location)),
    statuses: toOptions(listings.map((listing) => listing.status)),
  }
}