import { Link } from 'react-router-dom'

const variants = {
  primary: 'border border-[#4634b6] bg-[#6c5ce7] text-white hover:bg-[#5c4ed1] focus:ring-[#d8d1ff]',
  secondary: 'border border-black bg-white text-slate-900 hover:bg-[#f7f3ff] focus:ring-[#d8d1ff]',
  danger: 'border border-[#c24b78] bg-[#ff7bac] text-white hover:bg-[#f4679d] focus:ring-[#ffd4e5]',
  muted: 'border border-slate-300 bg-slate-100 text-slate-500',
}

function ActionButton({
  children,
  className = '',
  disabled = false,
  to,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = [
    'inline-flex min-h-10 items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4',
    disabled ? 'cursor-not-allowed opacity-60' : '',
    variants[variant],
    className,
  ].join(' ')

  if (to && !disabled) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  )
}

export default ActionButton
