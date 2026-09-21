import { useEffect, useId, useMemo, useState } from 'react'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ImageFilePicker({ existingImageUrl = '', files = [], helperText = '', multiple = false, onFilesChange, showPreview = true }) {
  const inputId = useId()
  const [error, setError] = useState('')
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files])

  useEffect(() => () => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url))
  }, [previews])

  function chooseFiles(event) {
    const selectedFiles = Array.from(event.target.files ?? [])
    const invalidType = selectedFiles.find((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type))
    const oversized = selectedFiles.find((file) => file.size > MAX_IMAGE_SIZE_BYTES)

    if (invalidType) {
      setError('Choose a JPG, JPEG, PNG, or WEBP image.')
      onFilesChange([])
      event.target.value = ''
      return
    }

    if (oversized) {
      setError(`Each image must be 5 MB or smaller. ${oversized.name} is ${formatFileSize(oversized.size)}.`)
      onFilesChange([])
      event.target.value = ''
      return
    }

    setError('')
    onFilesChange(multiple ? selectedFiles : selectedFiles.slice(0, 1))
  }

  return (
    <div className="grid gap-3">
      <label className="text-sm font-semibold text-slate-800" htmlFor={inputId}>
        {multiple ? 'Choose images' : 'Choose an image'}
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={[inputId + '-instructions', helperText ? inputId + '-help' : null, error ? inputId + '-error' : null].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        className="block w-full text-sm text-slate-900 file:mr-3 file:rounded file:border file:border-black file:bg-[#ff7bac] file:px-4 file:py-2 file:font-semibold file:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        id={inputId}
        multiple={multiple}
        onChange={chooseFiles}
        type="file"
      />
      <p className="text-xs text-slate-700" id={inputId + '-instructions'}>JPG, JPEG, PNG, WEBP. Max 5 MB per image.</p>
      {helperText ? <p className="text-xs text-slate-700" id={inputId + '-help'}>{helperText}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-700" id={inputId + '-error'} role="alert">{error}</p> : null}
      {showPreview && previews.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {previews.map((preview) => (
            <figure className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={`${preview.file.name}-${preview.file.lastModified}`}>
              <img alt="" className="h-32 w-full object-cover" src={preview.url} />
              <figcaption className="truncate px-3 py-2 text-xs text-slate-600">{preview.file.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : showPreview && existingImageUrl ? (
        <img alt="Current profile" className="h-32 w-32 rounded-full border border-slate-200 object-cover" src={existingImageUrl} />
      ) : null}
    </div>
  )
}

export default ImageFilePicker