const PROFILE_IMAGE_EVENT = 'purrfect-match-profile-image-updated'
const PROFILE_IMAGE_PREFIX = 'purrfect-match-profile-image'

function getUserKey(user) {
  const identifier = user?.id ?? user?.email
  return identifier ? `${PROFILE_IMAGE_PREFIX}:${identifier}` : null
}

function emitProfileImageChange(user, dataUrl = '') {
  window.dispatchEvent(new CustomEvent(PROFILE_IMAGE_EVENT, { detail: { dataUrl, userKey: getUserKey(user) } }))
}

export function getStoredProfileImage(user) {
  const key = getUserKey(user)

  if (!key) {
    return ''
  }

  try {
    return window.localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

export function setStoredProfileImage(user, dataUrl) {
  const key = getUserKey(user)

  if (!key || !dataUrl) {
    return
  }

  try {
    window.localStorage.setItem(key, dataUrl)
    emitProfileImageChange(user, dataUrl)
  } catch {
    // Browser storage can fail when quota is full; profile fields still save through the backend.
  }
}

export function removeStoredProfileImage(user) {
  const key = getUserKey(user)

  if (!key) {
    return
  }

  try {
    window.localStorage.removeItem(key)
    emitProfileImageChange(user, '')
  } catch {
    // Ignore local cleanup failures.
  }
}

export function profileImageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Profile image could not be read.'))
    reader.readAsDataURL(file)
  })
}

export { PROFILE_IMAGE_EVENT }
