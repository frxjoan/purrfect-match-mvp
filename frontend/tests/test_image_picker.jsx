import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ImageFilePicker from '../src/components/ImageFilePicker.jsx'

describe('ImageFilePicker', () => {
  it('accepts valid image files and reports them to the parent', async () => {
    const user = userEvent.setup()
    const onFilesChange = vi.fn()
    const file = new File(['cat'], 'cat.png', { type: 'image/png' })
    render(<ImageFilePicker files={[]} helperText="Upload a clear photo." onFilesChange={onFilesChange} />)

    const input = screen.getByLabelText('Choose an image')
    expect(input).toHaveAccessibleDescription('JPG, JPEG, PNG, WEBP. Max 5 MB per image. Upload a clear photo.')
    await user.tab()
    expect(input).toHaveFocus()
    await user.upload(input, file)

    expect(onFilesChange).toHaveBeenCalledWith([file])
  })

  it('rejects non-image files', () => {
    const onFilesChange = vi.fn()
    const file = new File(['notes'], 'notes.txt', { type: 'text/plain' })
    const { container } = render(<ImageFilePicker files={[]} onFilesChange={onFilesChange} />)

    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } })

    const input = screen.getByLabelText('Choose an image')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('JPG, JPEG, PNG, WEBP. Max 5 MB per image. Choose a JPG, JPEG, PNG, or WEBP image.')
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG, JPEG, PNG, or WEBP image.')
    expect(onFilesChange).toHaveBeenCalledWith([])
  })

  it('rejects images larger than 5 MB', async () => {
    const user = userEvent.setup()
    const onFilesChange = vi.fn()
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' })
    const { container } = render(<ImageFilePicker files={[]} onFilesChange={onFilesChange} />)

    await user.upload(container.querySelector('input[type="file"]'), file)

    expect(screen.getByText(/Each image must be 5 MB or smaller/)).toBeInTheDocument()
  })
})