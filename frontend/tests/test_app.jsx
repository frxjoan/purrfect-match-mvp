import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App.jsx'

vi.mock('../src/routes/AppRouter.jsx', () => ({
  default: () => <main>Router mounted</main>,
}))

describe('App', () => {
  it('mounts the auth provider and router shell', () => {
    render(<App />)

    expect(screen.getByText('Router mounted')).toBeInTheDocument()
  })
})