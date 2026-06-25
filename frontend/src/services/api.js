import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 10000,
})

// TODO: Keep all future Flask API calls in this module or small service modules that import this client.

api.interceptors.request.use((config) => {
  try {
    const storedUser = window.localStorage.getItem('purrfect-match-demo-user')
    const currentUser = storedUser ? JSON.parse(storedUser) : null

    if (currentUser?.token) {
      config.headers.Authorization = `Bearer ${currentUser.token}`
    }
  } catch {
    // Ignore malformed demo session storage and continue unauthenticated.
  }

  return config
})

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

export async function loginUser(credentials) {
  const response = await api.post('/auth/login', credentials)
  return getResponseData(response)
}

export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload)
  return getResponseData(response)
}

export async function createListing(payload) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (key !== 'images' && value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })

  payload.images.forEach((image) => {
    formData.append('images', image)
  })

  const response = await api.post('/listings', formData)
  return normalizeListing(getResponseData(response))
}

export async function deleteListing(listingId) {
  const response = await api.delete(`/listings/${listingId}`)
  return getResponseData(response)
}

export async function fetchAdminStats() {
  const response = await api.get('/admin/stats')
  return getResponseData(response)
}

export async function deleteAdminListing(listingId) {
  const response = await api.delete(`/admin/listings/${listingId}`)
  return getResponseData(response)
}

export default api
