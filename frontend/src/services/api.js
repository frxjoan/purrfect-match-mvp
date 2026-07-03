import axios from 'axios'

const AUTH_STORAGE_KEY = 'purrfect-match-user'
const LEGACY_AUTH_STORAGE_KEY = 'purrfect-match-demo-user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  try {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
    const currentUser = storedUser ? JSON.parse(storedUser) : null

    if (currentUser?.token) {
      config.headers.Authorization = `Bearer ${currentUser.token}`
    }
  } catch {
    // Ignore malformed session storage and continue unauthenticated.
  }

  return config
})

function getResponseData(response) {
  return response.data?.data ?? response.data
}

function formatAge(ageMonths) {
  if (ageMonths === null || ageMonths === undefined || ageMonths === '') {
    return ''
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
  return mainImage?.image_url ?? null
}

function normalizeStatus(status) {
  if (!status) {
    return ''
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

function normalizeGender(gender) {
  if (!gender) {
    return ''
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

function getBreederName(breeder) {
  if (!breeder) {
    return ''
  }

  if (typeof breeder === 'string') {
    return breeder
  }

  const ownerName = [breeder.first_name, breeder.last_name].filter(Boolean).join(' ')

  return breeder.display_name
    ?? breeder.business_name
    ?? breeder.cattery_name
    ?? breeder.name
    ?? breeder.owner_name
    ?? breeder.user?.display_name
    ?? ownerName
    ?? ''
}

export function normalizeListing(listing) {
  const title = listing.title ?? listing.name ?? ''
  const ageMonths = listing.age_months ?? listing.ageMonths
  const images = listing.images ?? []
  const breederProfile = typeof listing.breeder === 'object' ? listing.breeder : null

  return {
    ...listing,
    age: listing.age ?? formatAge(ageMonths),
    ageMonths,
    breeder: getBreederName(listing.breeder),
    breederId: listing.breeder_id ?? breederProfile?.id ?? null,
    breederOwnerName: breederProfile?.owner_name ?? breederProfile?.user?.display_name ?? '',
    breederPhoto: breederProfile?.profile_picture_url ?? breederProfile?.user?.profile_picture_url ?? null,
    breederProfile,
    gender: normalizeGender(listing.gender),
    id: listing.id,
    image: listing.image ?? getPrimaryImage(images),
    images,
    name: listing.name ?? title,
    price: Number(listing.price ?? 0),
    status: normalizeStatus(listing.status),
    summary: listing.summary ?? listing.description ?? '',
    title,
    verified: listing.verified ?? breederProfile?.certification_status === 'verified',
  }
}

function normalizeSavedListings(data) {
  const listings = data?.listings ?? []

  return {
    count: data?.count ?? listings.length,
    listings: listings.map(normalizeListing),
    savedListingIds: (data?.saved_listing_ids ?? []).map(String),
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

export async function fetchSavedListings() {
  const response = await api.get('/users/me/saved-listings')
  return normalizeSavedListings(getResponseData(response))
}

export async function saveListing(listingId) {
  const response = await api.post('/users/me/saved-listings', { listing_id: listingId })
  return normalizeSavedListings(getResponseData(response))
}

export async function unsaveListing(listingId) {
  const response = await api.delete(`/users/me/saved-listings/${listingId}`)
  return normalizeSavedListings(getResponseData(response))
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

  ;(payload.images ?? []).forEach((image) => {
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

export async function fetchAdminUsers(params = {}) {
  const response = await api.get('/admin/users', { params })
  return getResponseData(response)
}

export async function restrictAdminUser(userId, payload) {
  const response = await api.post(`/admin/users/${userId}/restrictions`, payload)
  return getResponseData(response)
}

export async function liftAdminUserRestriction(userId) {
  const response = await api.delete(`/admin/users/${userId}/restrictions`)
  return getResponseData(response)
}

export async function deleteAdminListing(listingId) {
  const response = await api.delete(`/admin/listings/${listingId}`)
  return getResponseData(response)
}

export async function fetchCurrentUserProfile() {
  const response = await api.get('/users/me')
  return getResponseData(response)
}

export async function updateCurrentUserProfile(payload) {
  const response = await api.patch('/users/me', payload)
  return getResponseData(response)
}

export async function fetchPublicUserProfile(userId) {
  const response = await api.get(`/users/${userId}`)
  return getResponseData(response)
}

export async function fetchBreederProfile() {
  const response = await api.get('/breeders/me')
  return getResponseData(response)
}

export async function fetchPublicBreederProfile(breederId) {
  const response = await api.get(`/breeders/${breederId}`)
  return getResponseData(response)
}

export async function updateBreederProfile(payload) {
  const response = await api.patch('/breeders/me', payload)
  return getResponseData(response)
}

export async function applyAsBreeder(payload) {
  const formData = new FormData()

  formData.append('business_name', payload.business_name)
  formData.append('location', payload.location)

  if (payload.bio) {
    formData.append('bio', payload.bio)
  }

  if (payload.certification_document) {
    formData.append('certification_document', payload.certification_document)
  }

  const response = await api.post('/breeders/apply', formData)
  return getResponseData(response)
}

export async function fetchBreederReviews(breederId) {
  const response = await api.get(`/breeders/${breederId}/reviews`)
  return getResponseData(response)
}

export async function createBreederReview(breederId, payload) {
  const response = await api.post(`/breeders/${breederId}/reviews`, payload)
  return getResponseData(response)
}

export async function updateReview(reviewId, payload) {
  const response = await api.patch(`/reviews/${reviewId}`, payload)
  return getResponseData(response)
}

export async function deleteReview(reviewId) {
  const response = await api.delete(`/reviews/${reviewId}`)
  return getResponseData(response)
}

export async function fetchConversations() {
  const response = await api.get('/conversations')
  return getResponseData(response)
}

export async function fetchConversation(conversationId) {
  const response = await api.get(`/conversations/${conversationId}`)
  return getResponseData(response)
}

export async function sendConversationMessage(conversationId, content) {
  const response = await api.post(`/conversations/${conversationId}/messages`, { content })
  return getResponseData(response)
}

export async function createListingReport(listingId, payload) {
  const response = await api.post(`/listings/${listingId}/reports`, payload)
  return getResponseData(response)
}

export async function startConversation(listingId) {
  const response = await api.post('/conversations', { listing_id: listingId })
  return getResponseData(response)
}

export async function fetchAdminReports(params = {}) {
  const response = await api.get('/admin/reports', { params })
  return getResponseData(response)
}

export async function reviewAdminReport(reportId, payload) {
  const response = await api.patch(`/admin/reports/${reportId}`, payload)
  return getResponseData(response)
}

export async function fetchAdminCertifications() {
  const response = await api.get('/admin/certifications')
  return getResponseData(response)
}

export async function approveAdminCertification(breederId, payload = {}) {
  const response = await api.post(`/admin/certifications/${breederId}/approve`, payload)
  return getResponseData(response)
}

export async function rejectAdminCertification(breederId, payload) {
  const response = await api.post(`/admin/certifications/${breederId}/reject`, payload)
  return getResponseData(response)
}

export default api
