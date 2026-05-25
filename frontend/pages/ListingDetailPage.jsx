import { useParams } from 'react-router-dom'
import PageHero from '../components/PageHero.jsx'

function ListingDetailPage() {
  const { listingId } = useParams()

  return (
    <PageHero
      eyebrow="Listing details"
      title={`Preview listing ${listingId}`}
      description="This placeholder route is ready for breeder profiles, cat details, health records, and inquiry actions once Sprint 1 APIs are implemented."
    >
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-slate-300">
        Listing detail modules will include availability, breeder verification status, and Cloudinary-powered media galleries.
      </div>
    </PageHero>
  )
}

export default ListingDetailPage
