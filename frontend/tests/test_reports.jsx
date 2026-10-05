import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ReportListingModal from '../src/components/ReportListingModal.jsx'
import { createListingReport } from '../src/services/api.js'

vi.mock('../src/services/api.js', () => ({
  createListingReport: vi.fn(),
}))

describe('ReportListingModal', () => {
  it('returns focus to the trigger on Escape and traps Tab inside', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(<><button type="button">Report trigger</button><ReportListingModal listing={null} onClose={onClose} /></>)
    const trigger = screen.getByRole('button', { name: 'Report trigger' })
    trigger.focus()
    rerender(<><button type="button">Report trigger</button><ReportListingModal listing={{ id: 3, title: 'Listing' }} onClose={onClose} /></>)
    expect(screen.getByRole('heading', { name: 'Report listing' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('heading', { name: 'Report listing' }), { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    rerender(<><button type="button">Report trigger</button><ReportListingModal listing={null} onClose={onClose} /></>)
    expect(trigger).toHaveFocus()
  })

  it('submits listing reports and shows the confirmation state', async () => {
    const user = userEvent.setup()
    createListingReport.mockResolvedValueOnce({ report: { id: 9 } })

    render(<ReportListingModal listing={{ id: 3, title: 'Suspicious listing' }} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Report listing' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Report listing' })).toHaveFocus()
    await user.selectOptions(screen.getByLabelText('Reason'), 'suspected_scam')
    await user.type(screen.getByPlaceholderText('Describe the issue...'), 'The price looks suspicious.')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(createListingReport).toHaveBeenCalledWith(3, {
      reason: 'suspected_scam',
      comment: 'The price looks suspicious.',
    }))
    expect(await screen.findByText('Thank you!')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Thank you!' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Thank you!' })).toHaveFocus()
  })
})