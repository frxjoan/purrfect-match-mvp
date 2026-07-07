import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import { registerUser } from '../services/api.js'

const emptyForm = {
  accountType: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

const accountTypes = [
  { label: 'Customer', value: 'customer' },
  { label: 'Breeder', value: 'breeder' },
]

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setNotice('')
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.accountType) {
      nextErrors.accountType = 'Choose Customer or Breeder.'
    }

    if (!form.firstName.trim()) {
      nextErrors.firstName = 'First name is required.'
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    }

    if (!form.password.trim()) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await registerUser({
        email: form.email.trim(),
        password: form.password,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        role: form.accountType,
      })
      setNotice('Account created. You can now sign in.')
      setForm(emptyForm)
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[62vh] w-full max-w-3xl flex-col items-center justify-center rounded-lg border border-black/20 bg-[#eee7ff] px-4 py-12">
      <form className="w-full max-w-md rounded-lg border border-black bg-[#fbfbff] p-6 shadow-sm" onSubmit={handleSubmit} noValidate>
        <button className="mb-4 text-2xl leading-none" onClick={() => navigate('/login')} type="button" aria-label="Back to login">
          ←
        </button>
        <h1 className="text-center text-xl font-semibold text-slate-950">Create account</h1>
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-slate-700">Account type</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {accountTypes.map((accountType) => (
              <label
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-4 py-3 text-sm font-semibold transition ${form.accountType === accountType.value ? 'border-[#6c5ce7] bg-[#6c5ce7] text-white' : 'border-black bg-white text-slate-800 hover:bg-[#f7f3ff]'}`}
                key={accountType.value}
              >
                <input
                  checked={form.accountType === accountType.value}
                  className="sr-only"
                  name="accountType"
                  onChange={() => updateForm('accountType', accountType.value)}
                  type="radio"
                  value={accountType.value}
                />
                <span>{accountType.label}</span>
              </label>
            ))}
          </div>
          {errors.accountType ? <span className="mt-1 block text-xs font-semibold text-[#c24b78]">{errors.accountType}</span> : null}
        </fieldset>
        {[
          ['firstName', 'First name', 'text'],
          ['lastName', 'Last name', 'text'],
          ['email', 'Email', 'email'],
          ['password', 'Password', 'password'],
        ].map(([field, label, type]) => (
          <label key={field} className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <input
              className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d8d1ff]"
              onChange={(event) => updateForm(field, event.target.value)}
              type={type}
              value={form[field]}
            />
            {errors[field] ? <span className="mt-1 block text-xs font-semibold text-[#c24b78]">{errors[field]}</span> : null}
          </label>
        ))}
        <ActionButton className="mt-6 w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </ActionButton>
        {notice ? <p className="mt-4 text-center text-sm font-semibold text-[#6c5ce7]">{notice}</p> : null}
      </form>
    </section>
  )
}

export default RegisterPage