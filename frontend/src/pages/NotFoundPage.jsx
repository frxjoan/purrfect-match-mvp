import ActionButton from '../components/ActionButton.jsx'
import PageHero from '../components/PageHero.jsx'

function NotFoundPage() {
  return (
    <PageHero
      eyebrow="404"
      title="Page not found"
      description="That route is not part of the MVP frontend yet."
    >
      <div className="flex flex-wrap gap-3">
        <ActionButton to="/">Go home</ActionButton>
        <ActionButton to="/customer/listings" variant="secondary">Browse listings</ActionButton>
      </div>
    </PageHero>
  )
}

export default NotFoundPage
