import PageHero from '../components/PageHero.jsx'

const listings = [
  { name: 'Blue Point Ragdoll', location: 'Austin, TX', status: 'Available in June' },
  { name: 'Maine Coon Litter', location: 'Seattle, WA', status: 'Accepting deposits' },
  { name: 'Siberian Kitten Pair', location: 'Boston, MA', status: 'Health screening complete' },
]

function ListingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Listings"
        title="Browse verified breeder listings"
        description="The listing index is wired for filterable marketplace inventory and future search endpoints from the Flask backend."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {listings.map((listing) => (
          <article key={listing.name} className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">{listing.status}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{listing.name}</h2>
            <p className="mt-2 text-slate-300">{listing.location}</p>
          </article>
        ))}
      </section>
    </>
  )
}

export default ListingsPage
