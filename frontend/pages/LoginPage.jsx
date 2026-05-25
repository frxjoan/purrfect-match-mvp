import PageHero from '../components/PageHero.jsx'

function LoginPage() {
  return (
    <PageHero
      eyebrow="Account access"
      title="Buyer and breeder sign in"
      description="Placeholder authentication UI for Sprint 1. This page will connect to the Flask JWT authentication endpoints exposed under /api/v1/auth."
    >
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-6 md:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Email</p>
          <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-500">buyer@purrfectmatch.dev</div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Password</p>
          <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-500">••••••••</div>
        </div>
      </div>
    </PageHero>
  )
}

export default LoginPage
