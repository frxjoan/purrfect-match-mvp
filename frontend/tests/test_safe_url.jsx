import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ActionButton from '../src/components/ActionButton.jsx'
import SafeImage from '../src/components/SafeImage.jsx'
import { sanitizeImageUrl, sanitizeNavigationTarget } from '../src/utils/safeUrl.js'

describe('safe URL rendering', () => {
  it('rejects executable navigation and image schemes', () => {
    expect(sanitizeNavigationTarget('javascript:alert(1)')).toBe('')
    expect(sanitizeImageUrl('javascript:alert(1)')).toBe('')
    expect(
      sanitizeImageUrl(
        'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+',
        { allowData: true },
      ),
    ).toBe('')
  })

  it('keeps normal application and HTTPS URLs', () => {
    expect(sanitizeNavigationTarget('/customer/listings')).toBe(
      '/customer/listings',
    )
    expect(sanitizeImageUrl('https://images.example/cat.png')).toBe(
      'https://images.example/cat.png',
    )
  })

  it('does not render an unsafe image source', () => {
    render(<SafeImage alt="Unsafe" src="javascript:alert(1)" />)
    expect(screen.queryByRole('img', { name: 'Unsafe' })).not.toBeInTheDocument()
  })

  it('renders untrusted navigation as a non-link control', () => {
    render(
      <MemoryRouter>
        <ActionButton to="javascript:alert(1)">Open</ActionButton>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: 'Open' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('opens external HTTPS links without opener access', () => {
    render(<ActionButton to="https://example.com/document">Document</ActionButton>)
    const link = screen.getByRole('link', { name: 'Document' })

    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
