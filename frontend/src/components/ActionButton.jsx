import { Link } from 'react-router-dom'

const variants = {
  primary: 'bg-teal-600 text-white hover:bg-teal-500 focus:ring-teal-200',
  secondary: 'border border-slate-200 bg-white text-slate-800 hover:border-teal-300 hover:text-teal-700 focus:ring-teal-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-200',
  muted: 'bg-slate-100 text-slate-500',
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
    'inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4',
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
