import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'customer' })
  const [notice, setNotice] = useState('')

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Connect to /api/v1/auth/register and branch breeder onboarding after account creation.
    setNotice('Registration captured locally as a frontend placeholder.')
  }

  return (
    <>
      <SectionHeader eyebrow="Registration" title="Create an account" description="Usable registration UI with controlled inputs and clear backend TODOs." />
      <form className="mx-auto grid w-full max-w-3xl gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2" onSubmit={handleSubmit}>
        {[
          ['firstName', 'First name', 'text'],
          ['lastName', 'Last name', 'text'],
          ['email', 'Email', 'email'],
          ['password', 'Password', 'password'],
        ].map(([field, label, type]) => (
          <label key={field} className="block">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm(field, event.target.value)} type={type} value={form[field]} />
          </label>
        ))}
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Account type</span>
          <select className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('role', event.target.value)} value={form.role}>
            <option value="customer">Customer</option>
            <option value="breeder">Breeder</option>
          </select>
        </label>
        <ActionButton className="md:col-span-2" disabled={!form.firstName || !form.lastName || !form.email || form.password.length < 8} type="submit">
          Create account placeholder
        </ActionButton>
        {notice ? <p className="text-sm font-semibold text-teal-700 md:col-span-2">{notice}</p> : null}
      </form>
    </>
  )
}

export default RegisterPage
