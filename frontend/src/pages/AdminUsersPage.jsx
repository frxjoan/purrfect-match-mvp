import { useEffect, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { fetchAdminUsers, liftAdminUserRestriction, restrictAdminUser } from '../services/api.js'

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [selectedAction, setSelectedAction] = useState(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function loadUsers() {
    setIsLoading(true)
    try {
      const data = await fetchAdminUsers()
      setUsers(data.users ?? [])
      setNotice('')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Users could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function beginRestriction(user, restrictionType) {
    setSelectedAction({ user, restrictionType })
    setReason('')
    setNotice('')
  }

  async function submitRestriction(event) {
    event.preventDefault()

    if (!selectedAction) {
      return
    }

    setIsSubmitting(true)
    try {
      const data = await restrictAdminUser(selectedAction.user.id, {
        reason: reason.trim(),
        restriction_type: selectedAction.restrictionType,
      })
      setUsers((currentUsers) => currentUsers.map((user) => user.id === data.user.id ? data.user : user))
      setSelectedAction(null)
      setReason('')
      setNotice('User restriction saved.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'User restriction could not be saved.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function liftRestriction(user) {
    setIsSubmitting(true)
    try {
      const data = await liftAdminUserRestriction(user.id)
      setUsers((currentUsers) => currentUsers.map((item) => item.id === data.user.id ? data.user : item))
      setNotice('User restriction lifted.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'User restriction could not be lifted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Admin users"
        title="User management"
        description="Review accounts and moderation status."
      />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading users...</p> : null}
        <div className="grid gap-4">
          {users.map((user) => (
            <article className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-[1fr_auto]" key={user.id}>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{user.email}</p>
                <p className="mt-1 text-sm text-slate-500">{user.role} - {user.status}</p>
                {user.moderation_reason ? <p className="mt-1 text-sm text-slate-500">Reason: {user.moderation_reason}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton disabled={isSubmitting || user.status === 'suspended'} onClick={() => beginRestriction(user, 'suspension')} variant="secondary">Suspend</ActionButton>
                <ActionButton disabled={isSubmitting || user.status === 'banned'} onClick={() => beginRestriction(user, 'ban')} variant="danger">Ban</ActionButton>
                <ActionButton disabled={isSubmitting || user.status === 'active'} onClick={() => liftRestriction(user)} variant="secondary">Lift</ActionButton>
              </div>
              {selectedAction?.user.id === user.id ? (
                <form className="grid gap-3 md:col-span-2" onSubmit={submitRestriction}>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Reason for {selectedAction.restrictionType}</span>
                    <textarea className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => setReason(event.target.value)} value={reason} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton disabled={isSubmitting || !reason.trim()} type="submit">Confirm</ActionButton>
                    <ActionButton disabled={isSubmitting} onClick={() => setSelectedAction(null)} type="button" variant="secondary">Cancel</ActionButton>
                  </div>
                </form>
              ) : null}
            </article>
          ))}
          {!isLoading && users.length === 0 ? <p className="text-sm text-slate-500">No users found.</p> : null}
        </div>
        {notice ? <p className="mt-5 text-sm font-semibold text-teal-700">{notice}</p> : null}
      </section>
    </>
  )
}

export default AdminUsersPage
