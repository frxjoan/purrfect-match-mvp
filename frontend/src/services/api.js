import axios from 'axios'

/**
 * Central API client for the React frontend.
 *
 * Every exported helper in this module talks to the Flask API and returns the
 * normalized data payload from the backend response. Flask usually responds
 * with success/data on success and success false/error on
 * failure, while Axios exposes failures through error.response.
 */

/**
 * @typedef {Object} FlaskSuccessResponse
 * @property {boolean} success - Whether Flask completed the operation.
 * @property {Object} data - Endpoint-specific payload returned by Flask.
 */

/**
 * @typedef {Object} FlaskErrorResponse
 * @property {boolean} success - Always false for handled backend errors.
 * @property {{ code?: string, message: string, fields?: string[] }} error - Human-readable backend error details.
 */

/**
 * @typedef {Object} AuthenticatedUser
 * @property {number} id - Database user id.
 * @property {'customer'|'breeder'|'admin'} role - Role used by ProtectedRoute and the navbar.
 * @property {string} email - User email returned by Flask.
 * @property {string} [token] - JWT stored by AuthContext after login.
 * @property {Object} [breeder_profile] - Optional breeder profile returned for breeder accounts.
 */

/**
 * @typedef {Object} Listing
 * @property {number} id - Listing database id.
 * @property {string} title - Listing title.
 * @property {string} breed - Cat breed.
 * @property {string} gender - Display-ready gender label.
 * @property {number} price - Numeric listing price.
 * @property {string} status - Display-ready listing status.
 * @property {string} [image] - Primary image URL used by listing cards.
 * @property {Object[]} [images] - Raw backend listing images.
 */

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

/**
 * Extracts the endpoint payload from the standard Flask response envelope.
 *
 * @param {import('axios').AxiosResponse<FlaskSuccessResponse|Object>} response - Axios response from Flask.
 * @returns {Object} Endpoint-specific data payload.
 */
function getResponseData(response) {
  return response.data?.data ?? response.data
}

/**
 * Converts a backend age value in months into a compact display label.
 *
 * @param {number|string|null|undefined} ageMonths - Age value returned by Flask.
 * @returns {string} Human-readable age for listing cards and detail pages.
 */
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

/**
 * Picks the first main image from the backend images array.
 *
 * @param {Object[]} images - Listing images returned by Flask.
 * @returns {string|null} Primary image URL or null when no image exists.
 */
function getPrimaryImage(images = []) {
  const mainImage = images.find((image) => image.is_main) ?? images[0]
  return mainImage?.image_url ?? null
}

/**
 * Formats backend status values for UI display.
 *
 * @param {string} status - Raw backend status such as available.
 * @returns {string} Capitalized status label.
 */
function normalizeStatus(status) {
  if (!status) {
    return ''
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

/**
 * Formats backend gender values for UI display.
 *
 * @param {string} gender - Raw backend gender such as male.
 * @returns {string} Capitalized gender label.
 */
function normalizeGender(gender) {
  if (!gender) {
    return ''
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

/**
 * Resolves a breeder display name from multiple backend response shapes.
 *
 * @param {string|Object|null|undefined} breeder - Breeder object or name returned by Flask.
 * @returns {string} Best available breeder display name.
 */
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

/**
 * Normalizes Flask listing responses into one shape consumed by cards, detail
 * pages, saved listings, and breeder management screens.
 *
 * @param {Object} listing - Raw listing object returned by Flask.
 * @returns {Listing} Frontend-friendly listing object.
 */
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
    breederPhoto: breederProfile?.profile_picture_url ?? breederProfile?.profilePictureUrl ?? breederProfile?.avatar_url ?? breederProfile?.user?.profile_picture_url ?? breederProfile?.user?.profilePictureUrl ?? breederProfile?.user?.avatar_url ?? null,
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

/**
 * Normalizes the saved-listings response from /users/me/saved-listings.
 *
 * @param {Object} data - Backend saved listing payload.
 * @returns {{ count: number, listings: Listing[], savedListingIds: string[] }} Saved listings plus id lookup list.
 */
function normalizeSavedListings(data) {
  const listings = data?.listings ?? []

  return {
    count: data?.count ?? listings.length,
    listings: listings.map(normalizeListing),
    savedListingIds: (data?.saved_listing_ids ?? []).map(String),
  }
}

/**
 * Loads public listings from Flask.
 *
 * @param {Object} [params={}] - Optional query params such as breed, location, price, gender, or status.
 * @returns {Promise<{ count: number, listings: Listing[] }>} Public listing collection.
 */
export async function fetchListings(params = {}) {
  const response = await api.get('/listings', { params })
  const data = getResponseData(response)
  const listings = data?.listings ?? []

  return {
    count: data?.count ?? listings.length,
    listings: listings.map(normalizeListing),
  }
}

/**
 * Loads one public listing by id.
 *
 * @param {number|string} listingId - Listing id from the route.
 * @returns {Promise<Listing>} Normalized listing detail.
 */
export async function fetchListingById(listingId) {
  const response = await api.get(`/listings/${listingId}`)
  return normalizeListing(getResponseData(response))
}

/**
 * Loads the authenticated user's saved listings.
 *
 * @returns {Promise<{ count: number, listings: Listing[], savedListingIds: string[] }>} Saved listing state.
 */
export async function fetchSavedListings() {
  const response = await api.get('/users/me/saved-listings')
  return normalizeSavedListings(getResponseData(response))
}

/**
 * Saves a listing for the authenticated user.
 *
 * @param {number|string} listingId - Listing id to save.
 * @returns {Promise<{ count: number, listings: Listing[], savedListingIds: string[] }>} Updated saved listing state.
 */
export async function saveListing(listingId) {
  const response = await api.post('/users/me/saved-listings', { listing_id: listingId })
  return normalizeSavedListings(getResponseData(response))
}

/**
 * Removes a listing from the authenticated user's saved list.
 *
 * @param {number|string} listingId - Listing id to unsave.
 * @returns {Promise<{ count: number, listings: Listing[], savedListingIds: string[] }>} Updated saved listing state.
 */
export async function unsaveListing(listingId) {
  const response = await api.delete(`/users/me/saved-listings/${listingId}`)
  return normalizeSavedListings(getResponseData(response))
}

/**
 * Authenticates a user and receives the JWT from Flask.
 *
 * @param {{ email: string, password: string }} credentials - Login form values.
 * @returns {Promise<{ token: string, user: AuthenticatedUser }>} Authenticated session payload.
 */
export async function loginUser(credentials) {
  const response = await api.post('/auth/login', credentials)
  return getResponseData(response)
}

/**
 * Registers a new account through Flask.
 *
 * @param {Object} payload - Register form values expected by .
 * @returns {Promise<{ message: string, user: AuthenticatedUser }>} Created account payload.
 */
export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload)
  return getResponseData(response)
}

/**
 * Creates a breeder listing with multipart form data.
 *
 * @param {Object} payload - Listing form state.
 * @param {File[]} payload.images - Cat images uploaded through Flask.
 * @returns {Promise<Listing>} Newly created listing.
 */
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

/**
 * Archives one listing owned by the authenticated breeder.
 *
 * @param {number|string} listingId - Listing id to archive.
 * @returns {Promise<Object>} Backend deletion/archive payload.
 */
export async function deleteListing(listingId) {
  const response = await api.delete(`/listings/${listingId}`)
  return getResponseData(response)
}

/**
 * Loads aggregate admin dashboard statistics.
 *
 * @returns {Promise<Object>} Admin stats payload returned by Flask.
 */
export async function fetchAdminStats() {
  const response = await api.get('/admin/stats')
  return getResponseData(response)
}

/**
 * Loads admin user-management data.
 *
 * @param {Object} [params={}] - Optional role, status, or search filters.
 * @returns {Promise<Object>} Admin users payload.
 */
export async function fetchAdminUsers(params = {}) {
  const response = await api.get('/admin/users', { params })
  return getResponseData(response)
}

/**
 * Applies a moderation restriction to a user.
 *
 * @param {number|string} userId - User id selected by the admin.
 * @param {{ restriction_type: 'suspension'|'ban', reason: string, expires_at?: string }} payload - Restriction payload expected by Flask.
 * @returns {Promise<Object>} Updated restriction and user payload.
 */
export async function restrictAdminUser(userId, payload) {
  const response = await api.post(`/admin/users/${userId}/restrictions`, payload)
  return getResponseData(response)
}

/**
 * Removes an active moderation restriction from a user.
 *
 * @param {number|string} userId - User id selected by the admin.
 * @returns {Promise<Object>} Updated user payload.
 */
export async function liftAdminUserRestriction(userId) {
  const response = await api.delete(`/admin/users/${userId}/restrictions`)
  return getResponseData(response)
}

/**
 * Archives a listing as an admin moderation action.
 *
 * @param {number|string} listingId - Listing id to archive.
 * @returns {Promise<Object>} Backend archive payload.
 */
export async function deleteAdminListing(listingId) {
  const response = await api.delete(`/admin/listings/${listingId}`)
  return getResponseData(response)
}

/**
 * Loads the authenticated user's profile from Flask.
 *
 * @returns {Promise<{ user: AuthenticatedUser }>} Current user profile payload.
 */
export async function fetchCurrentUserProfile() {
  const response = await api.get('/users/me')
  return getResponseData(response)
}

/**
 * Updates editable fields on the authenticated user's profile.
 *
 * @param {Object} payload - User profile fields accepted by .
 * @returns {Promise<{ message: string, user: AuthenticatedUser }>} Updated profile payload.
 */
export async function updateCurrentUserProfile(payload) {
  const response = await api.patch('/users/me', payload)
  return getResponseData(response)
}

/**
 * Loads the authenticated breeder profile.
 *
 * @returns {Promise<Object>} Breeder profile payload.
 */
export async function fetchPublicUserProfile(userId) {
  const response = await api.get(`/users/${userId}`)
  return getResponseData(response)
}

export async function fetchBreederProfile() {
  const response = await api.get('/breeders/me')
  return getResponseData(response)
}

/**
 * Loads a public breeder profile by id.
 *
 * @param {number|string} breederId - Public breeder profile id.
 * @returns {Promise<Object>} Public breeder profile payload.
 */
export async function fetchPublicBreederProfile(breederId) {
  const response = await api.get(`/breeders/${breederId}`)
  return getResponseData(response)
}

/**
 * Updates authenticated breeder profile fields.
 *
 * @param {Object} payload - Breeder profile fields accepted by Flask.
 * @returns {Promise<Object>} Updated breeder profile payload.
 */
export async function updateBreederProfile(payload) {
  const response = await api.patch('/breeders/me', payload)
  return getResponseData(response)
}

/**
 * Submits a breeder certification application with a document upload.
 *
 * @param {Object} payload - Certification form state.
 * @param {File} payload.certification_document - Certification document uploaded to Flask.
 * @returns {Promise<Object>} Submitted breeder profile payload.
 */
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

/**
 * Loads public reviews for a breeder profile.
 *
 * @param {number|string} breederId - Breeder profile id.
 * @returns {Promise<Object>} Reviews payload.
 */
export async function fetchBreederReviews(breederId) {
  const response = await api.get(`/breeders/${breederId}/reviews`)
  return getResponseData(response)
}

/**
 * Creates a review for a breeder profile.
 *
 * @param {number|string} breederId - Breeder profile id.
 * @param {{ rating: number, comment?: string }} payload - Review payload expected by Flask.
 * @returns {Promise<Object>} Created review payload.
 */
export async function createBreederReview(breederId, payload) {
  const response = await api.post(`/breeders/${breederId}/reviews`, payload)
  return getResponseData(response)
}

/**
 * Loads conversations available to the authenticated user.
 *
 * @returns {Promise<Object>} Conversation collection payload.
 */
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

/**
 * Loads one conversation with its messages.
 *
 * @param {number|string} conversationId - Conversation id selected in the message center.
 * @returns {Promise<Object>} Conversation detail payload.
 */
export async function fetchConversation(conversationId) {
  const response = await api.get(`/conversations/${conversationId}`)
  return getResponseData(response)
}

/**
 * Sends a text message in an existing conversation.
 *
 * @param {number|string} conversationId - Conversation id selected in the message center.
 * @param {string} content - Message body sent to Flask.
 * @returns {Promise<Object>} Created message payload.
 */
export async function sendConversationMessage(conversationId, content) {
  const response = await api.post(`/conversations/${conversationId}/messages`, { content })
  return getResponseData(response)
}

/**
 * Reports a listing for admin moderation.
 *
 * @param {number|string} listingId - Listing id being reported.
 * @param {{ reason: string, comment?: string }} payload - Report payload expected by Flask.
 * @returns {Promise<Object>} Created report payload.
 */
export async function createListingReport(listingId, payload) {
  const response = await api.post(`/listings/${listingId}/reports`, payload)
  return getResponseData(response)
}

/**
 * Starts or reopens a conversation for a listing.
 *
 * @param {number|string} listingId - Listing id that creates the conversation context.
 * @returns {Promise<Object>} Conversation payload.
 */
export async function startConversation(listingId) {
  const response = await api.post('/conversations', { listing_id: listingId })
  return getResponseData(response)
}

/**
 * Loads listing reports for the admin moderation queue.
 *
 * @param {Object} [params={}] - Optional report filters such as status.
 * @returns {Promise<Object>} Admin report collection payload.
 */
export async function fetchAdminReports(params = {}) {
  const response = await api.get('/admin/reports', { params })
  return getResponseData(response)
}

/**
 * Accepts or rejects one admin listing report.
 *
 * @param {number|string} reportId - Report id selected by the admin.
 * @param {{ decision: 'accepted'|'rejected', admin_comment?: string }} payload - Moderation decision payload.
 * @returns {Promise<Object>} Updated report payload.
 */
export async function reviewAdminReport(reportId, payload) {
  const response = await api.patch(`/admin/reports/${reportId}`, payload)
  return getResponseData(response)
}

/**
 * Loads pending breeder certification applications.
 *
 * @returns {Promise<Object>} Certification queue payload.
 */
export async function fetchAdminCertifications() {
  const response = await api.get('/admin/certifications')
  return getResponseData(response)
}

/**
 * Approves a breeder certification application.
 *
 * @param {number|string} breederId - Breeder profile id.
 * @param {{ comment?: string }} [payload={}] - Optional admin comment.
 * @returns {Promise<Object>} Updated breeder profile payload.
 */
export async function approveAdminCertification(breederId, payload = {}) {
  const response = await api.post(`/admin/certifications/${breederId}/approve`, payload)
  return getResponseData(response)
}

/**
 * Rejects a breeder certification application.
 *
 * @param {number|string} breederId - Breeder profile id.
 * @param {{ comment: string }} payload - Required rejection comment.
 * @returns {Promise<Object>} Updated breeder profile payload.
 */
export async function rejectAdminCertification(breederId, payload) {
  const response = await api.post(`/admin/certifications/${breederId}/reject`, payload)
  return getResponseData(response)
}

export default api
