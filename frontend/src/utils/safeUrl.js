const SAFE_WEB_PROTOCOLS = new Set(['http:', 'https:'])
const SAFE_DATA_IMAGE_PATTERN = /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i

function normalizeUrl(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function sanitizeNavigationTarget(value) {
  const target = normalizeUrl(value)

  if (!target) {
    return ''
  }

  try {
    const parsed = new URL(target, window.location.origin)
    return SAFE_WEB_PROTOCOLS.has(parsed.protocol) ? target : ''
  } catch {
    return ''
  }
}

export function isExternalNavigationTarget(value) {
  const target = sanitizeNavigationTarget(value)

  if (!target) {
    return false
  }

  return new URL(target, window.location.origin).origin !== window.location.origin
}

export function sanitizeImageUrl(value, { allowBlob = false, allowData = false } = {}) {
  const source = normalizeUrl(value)

  if (!source) {
    return ''
  }

  if (allowData && SAFE_DATA_IMAGE_PATTERN.test(source)) {
    return source
  }

  try {
    const parsed = new URL(source, window.location.origin)

    if (SAFE_WEB_PROTOCOLS.has(parsed.protocol) || (allowBlob && parsed.protocol === 'blob:')) {
      return source
    }
  } catch {
    return ''
  }

  return ''
}
