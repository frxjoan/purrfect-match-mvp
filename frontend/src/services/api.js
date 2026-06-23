import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// TODO: Add auth token injection once login stores the JWT returned by /api/v1/auth/login.
// TODO: Keep all future Flask API calls in this module or small service modules that import this client.

function getResponseData(response) {
  return response.data?.data ?? response.data
}

function formatAge(ageMonths) {
  if (ageMonths === null || ageMonths === undefined) {
    return 'Age not listed'
  }

  if (ageMonths < 12) {
    return `${ageMonths} month${ageMonths === 1 ? '' : 's'}`
  }

  const years = Math.floor(ageMonths / 12)
  const months = ageMonths % 12

  if (!months) {
    return `${years} year${years === 1 ? '' : 's'}`
  }

  return `${years} year${years === 1 ? '' : 's'}, ${months} month${months === 1 ? '' : 's'}`
}

function getPrimaryImage(images = []) {
  const mainImage = images.find((image) => image.is_main) ?? images[0]
  return mainImage?.image_url ?? 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80'
}

function normalizeStatus(status) {
  if (!status) {
    return 'Available'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

function normalizeGender(gender) {
  if (!gender) {
    return ''
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

export function normalizeListing(listing) {
  const title = listing.title ?? listing.name ?? 'Cat announcement'
  const ageMonths = listing.age_months ?? listing.ageMonths

  return {
    ...listing,
    age: listing.age ?? formatAge(ageMonths),
    ageMonths,
    breeder: listing.breeder?.cattery_name ?? listing.breeder?.name ?? listing.breeder ?? 'Verified breeder',
    gender: normalizeGender(listing.gender),
    id: listing.id,
    image: listing.image ?? getPrimaryImage(listing.images),
    images: listing.images ?? [],
    name: listing.name ?? title,
    price: Number(listing.price ?? 0),
    status: normalizeStatus(listing.status),
    summary: listing.summary ?? listing.description ?? 'Details from the breeder will appear here.',
    title,
    verified: listing.verified ?? false,
  }
}

export async function fetchListings(params = {}) {
  const response = await api.get('/listings', { params })
  const data = getResponseData(response)
  const listings = data?.listings ?? []

  return {
    count: data?.count ?? listings.length,
    listings: listings.map(normalizeListing),
  }
}

export async function fetchListingById(listingId) {
  const response = await api.get(`/listings/${listingId}`)
  return normalizeListing(getResponseData(response))
}

export default api
