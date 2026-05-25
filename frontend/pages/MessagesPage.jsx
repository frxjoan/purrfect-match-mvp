import PageHero from '../components/PageHero.jsx'

function MessagesPage() {
  return (
    <PageHero
      eyebrow="Messaging"
      title="Keep buyer and breeder conversations organized"
      description="Conversation placeholders map directly to the planned /api/v1/conversations resource and support future unread counts, moderation, and attachments."
    >
      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-6">
        {['New inquiry from a buyer', 'Verification follow-up from admin', 'Deposit confirmation thread'].map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
            {item}
          </div>
        ))}
      </div>
    </PageHero>
  )
}

export default MessagesPage
