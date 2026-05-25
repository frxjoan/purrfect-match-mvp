import { NavLink } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/listings', label: 'Listings' },
  { to: '/messages', label: 'Messages' },
  { to: '/dashboard', label: 'Breeder Dashboard' },
  { to: '/login', label: 'Login' },
]

function MainLayout({ children }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
              Purrfect Match
            </p>
            <p className="text-sm text-slate-300">Verified breeders. Trusted connections.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 transition',
                    isActive ? 'bg-sky-400 text-slate-950' : 'bg-white/5 hover:bg-white/10',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">{children}</main>
    </div>
  )
}

export default MainLayout
