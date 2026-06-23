import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

const demoUsers = [
  { id: 1, email: 'maya@example.com', role: 'customer', status: 'Active' },
  { id: 2, email: 'ava@willow.example', role: 'breeder', status: 'Pending verification' },
  { id: 3, email: 'admin@purrfectmatch.dev', role: 'admin', status: 'Active' },
]

function AdminUsersPage() {
  const [notice, setNotice] = useState('')

  function placeholderAction(action, user) {
    // TODO: Connect user management actions to admin user endpoints once available.
    setNotice(`${action} placeholder recorded locally for ${user.email}.`)
  }

  return (
    <>
      <SectionHeader
        eyebrow="Admin users"
        title="User management placeholder"
        description="Review demo customer, breeder, and admin accounts before backend user-management endpoints are connected."
      />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          {demoUsers.map((user) => (
            <article className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-[1fr_auto]" key={user.id}>
              <div>
                <p className="font-semibold text-slate-950">{user.email}</p>
                <p className="mt-1 text-sm text-slate-500">{user.role} · {user.status}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={() => placeholderAction('View profile', user)} variant="secondary">View</ActionButton>
                <ActionButton onClick={() => placeholderAction('Flag account', user)} variant="danger">Flag</ActionButton>
              </div>
            </article>
          ))}
        </div>
        {notice ? <p className="mt-5 text-sm font-semibold text-teal-700">{notice}</p> : null}
      </section>
    </>
  )
}

export default AdminUsersPage
