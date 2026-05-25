import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero.jsx'

const highlights = [
  'Breeder verification workflows ready for Sprint 1 implementation.',
  'Listing discovery, messaging, and dashboard paths wired into the shell.',
  'Environment-aware API client prepared for Flask REST integration.',
]

function HomePage() {
  return (
    <>
      <PageHero
        eyebrow="Marketplace MVP"
        title="Launch a trusted cat breeder marketplace faster"
        description="Purrfect Match is scaffolded for buyer discovery, verified breeder onboarding, and secure messaging so Sprint 1 can focus on product features instead of project setup."
      >
        <div className="flex flex-wrap gap-4">
          <Link
            to="/listings"
            className="rounded-full bg-sky-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-sky-300"
          >
            Explore listings
          </Link>
          <Link
            to="/register"
            className="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/5"
          >
            Join as a breeder
          </Link>
        </div>
      </PageHero>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
            <p className="text-sm leading-7">{item}</p>
          </article>
        ))}
      </section>
    </>
  )
}

export default HomePage
