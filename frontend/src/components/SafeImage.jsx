import { sanitizeImageUrl } from '../utils/safeUrl.js'

function SafeImage({ allowBlob = false, allowData = false, src, ...props }) {
  const safeSource = sanitizeImageUrl(src, { allowBlob, allowData })

  if (!safeSource) {
    return null
  }

  return <img {...props} src={safeSource} />
}

export default SafeImage
