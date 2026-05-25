import PageHero from '../components/PageHero.jsx'

function RegisterPage() {
  return (
    <PageHero
      eyebrow="Breeder onboarding"
      title="Create a Purrfect Match account"
      description="Registration placeholders outline the fields required for buyers, breeders, and future verification workflows without hardcoding any secrets or API assumptions."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {['Buyer profile', 'Breeder profile', 'Verification documents'].map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
            {item}
          </div>
        ))}
      </div>
    </PageHero>
  )
}

export default RegisterPage
