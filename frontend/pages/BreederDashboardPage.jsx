import PageHero from '../components/PageHero.jsx'

const dashboardCards = ['Listing management', 'Inquiry queue', 'Verification progress', 'Payout readiness']

function BreederDashboardPage() {
  return (
    <>
      <PageHero
        eyebrow="Breeder workspace"
        title="Manage your cattery from one dashboard"
        description="The dashboard placeholder reserves clear extension points for listings, moderation states, and buyer conversations."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
            {item}
          </div>
        ))}
      </section>
    </>
  )
}

export default BreederDashboardPage
