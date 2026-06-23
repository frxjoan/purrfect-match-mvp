import ActionButton from '../components/ActionButton.jsx'
import PageHero from '../components/PageHero.jsx'
import StatCard from '../components/StatCard.jsx'

const entryCards = [
  { title: 'Customers', text: 'Search verified cats, manage saved conversations, and report suspicious listings.', to: '/customer/dashboard' },
  { title: 'Breeders', text: 'Track verification, manage listings, and respond to buyer inquiries.', to: '/breeder/dashboard' },
  { title: 'Admins', text: 'Review breeder applications, marketplace reports, and platform health.', to: '/admin/dashboard' },
]

function HomePage() {
  return (
    <>
      <PageHero
        eyebrow="Marketplace MVP"
        title="A calmer way to match families with trusted cat breeders"
        description="The frontend is organized around the three users this MVP needs most: customers, breeders, and admins. Each section is ready for Flask API integration as endpoints are finalized."
      >
        <div className="flex flex-wrap gap-3">
          <ActionButton to="/customer/listings">Browse cats</ActionButton>
          <ActionButton to="/breeder/certification" variant="secondary">Start breeder verification</ActionButton>
        </div>
      </PageHero>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Verified-first" value="3" note="Role sections ready for MVP workflows" />
        <StatCard label="Listings" value="4" note="Static cards until live listing fetch is connected" />
        <StatCard label="Admin flow" value="2" note="Verification and reports queues scaffolded" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {entryCards.map((card) => (
          <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">{card.title}</h2>
            <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{card.text}</p>
            <ActionButton className="mt-5 w-full" to={card.to} variant="secondary">
              Open {card.title}
            </ActionButton>
          </article>
        ))}
      </section>
    </>
  )
}

export default HomePage
