import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ReportListingModal from '../src/components/ReportListingModal.jsx'
import { createListingReport } from '../src/services/api.js'

vi.mock('../src/services/api.js', () => ({
  createListingReport: vi.fn(),
}))

describe('ReportListingModal', () => {
  it('submits listing reports and shows the confirmation state', async () => {
    const user = userEvent.setup()
    createListingReport.mockResolvedValueOnce({ report: { id: 9 } })

    render(<ReportListingModal listing={{ id: 3, title: 'Suspicious listing' }} onClose={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Reason'), 'suspected_scam')
    await user.type(screen.getByPlaceholderText('Describe the issue...'), 'The price looks suspicious.')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(createListingReport).toHaveBeenCalledWith(3, {
      reason: 'suspected_scam',
      comment: 'The price looks suspicious.',
    }))
    expect(await screen.findByText('Thank you!')).toBeInTheDocument()
  })
})